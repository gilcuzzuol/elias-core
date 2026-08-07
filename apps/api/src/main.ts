import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import {
  ChatSession,
  createLLMProvider,
  createMemoryLayer,
  createMemoryRetrievalConfig,
} from "@elias/core";
import { EliasError, optionalEnv, requireEnv } from "@elias/shared";

/**
 * Servidor HTTP local do ELIAS (ADR-0012).
 *
 * Expõe o mesmo ChatSession do CLI (Fase 0) via HTTP, e serve os arquivos
 * estáticos do PWA (apps/web/dist) no mesmo processo/porta — sem CORS.
 * Bind fixo em 127.0.0.1: nada exposto além desta máquina (Princípio 3).
 */
async function main(): Promise<void> {
  let provider;
  let userId;
  let memoryStore;
  let conversationStore;
  let memory;
  try {
    provider = createLLMProvider();
    // ADR-0005: mesmo com um único usuário ativo, é um usuário real do
    // Supabase Auth — não um placeholder. Ver apps/scripts/ensure-user.
    userId = requireEnv("ELIAS_USER_ID");
    ({ memoryStore, conversationStore } = createMemoryLayer());
    memory = createMemoryRetrievalConfig();
  } catch (error) {
    if (error instanceof EliasError) {
      console.error(`\n[configuração] ${error.message}\n`);
      console.error(
        "Dica: copie .env.example para .env, preencha ANTHROPIC_API_KEY/SUPABASE_* e rode " +
          "`pnpm --filter @elias/scripts ensure-user` para obter ELIAS_USER_ID.\n",
      );
      process.exit(1);
    }
    throw error;
  }

  // Uma única sessão por processo (single-user local, mesmo modelo do CLI):
  // reiniciar o servidor começa uma conversa nova.
  const session = new ChatSession({
    provider,
    userId,
    memoryStore,
    conversationStore,
    memory,
  });

  const app = Fastify({ logger: true });

  const webDist = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "web", "dist");
  await app.register(fastifyStatic, { root: webDist });

  app.get("/api/health", async () => ({ ok: true, provider: provider.name }));

  app.get("/api/chat/history", async () => ({
    messages: session.messages
      .filter((message) => message.role !== "system")
      .map((message) => ({ role: message.role, content: message.content })),
  }));

  app.post("/api/chat", async (request, reply) => {
    const body = request.body as { message?: unknown } | undefined;
    const text = typeof body?.message === "string" ? body.message.trim() : "";
    if (text === "") {
      reply.code(400);
      return { error: "Mensagem vazia." };
    }
    const replyText = await session.send(text);
    return { reply: replyText };
  });

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    const message = error instanceof Error ? error.message : String(error);
    reply.code(error instanceof EliasError ? 503 : 500).send({ error: message });
  });

  const port = Number(optionalEnv("ELIAS_API_PORT", "4787"));
  await app.listen({ port, host: "127.0.0.1" });
  console.log(`\nELIAS rodando em http://localhost:${port} (Ctrl+C para encerrar)\n`);
}

void main();
