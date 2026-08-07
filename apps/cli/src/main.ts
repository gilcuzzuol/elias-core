import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import {
  ChatSession,
  createLLMProvider,
  createMemoryLayer,
  createMemoryRetrievalConfig,
} from "@elias/core";
import { EliasError, requireEnv } from "@elias/shared";

/**
 * CLI de chat do ELIAS (Fase 0 — macOS; memória plugada na Fase 1).
 *
 * REPL simples: lê linhas do usuário e responde via ChatSession, com memória
 * semântica (retrieval) e episódica (conversations/messages) plugadas
 * (ADR-0010). Interfaces mais ricas (PWA Android, etc.) entram nas fases
 * seguintes.
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

  const session = new ChatSession({
    provider,
    userId,
    memoryStore,
    conversationStore,
    memory,
  });

  const rl = createInterface({ input: stdin, output: stdout });
  rl.on("SIGINT", () => {
    rl.close();
  });

  console.log("ELIAS (Fase 0) — chat local via Claude, com memória (Fase 1).");
  console.log(
    "A primeira mensagem pode demorar mais: carrega o modelo local de embeddings " +
      "(baixa ~500MB na primeira vez).",
  );
  console.log('Digite sua mensagem. Use "/sair" ou Ctrl+C para encerrar.\n');

  try {
    while (true) {
      const input = (await rl.question("você › ")).trim();
      if (input === "") continue;
      if (input === "/sair" || input === "/exit") break;

      try {
        const reply = await session.send(input);
        console.log(`\nELIAS › ${reply}\n`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`\n[erro] ${message}\n`);
      }
    }
  } finally {
    rl.close();
    console.log("\nAté logo.");
  }
}

void main();
