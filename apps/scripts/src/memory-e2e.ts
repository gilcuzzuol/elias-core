/**
 * Teste ponta a ponta da memória semântica do ELIAS.
 *
 * Prova o pipeline real contra o Supabase: cria um usuário de teste, ingere um
 * texto (chunk -> embedding local -> pgvector), busca semanticamente e valida
 * que o retrieval discrimina relevante de irrelevante. No fim, apaga o usuário
 * (cascade limpa memory_chunks e audit_log), sem deixar resíduo.
 *
 * Rodar (no Mac, com .env preenchido — inclui SUPABASE_SERVICE_ROLE_KEY):
 *   pnpm --filter @elias/scripts build
 *   pnpm --filter @elias/scripts memory:e2e
 *
 * O primeiro run baixa o modelo de embeddings (~1GB), uma vez.
 */
import { createServiceClient, MemoryStore } from "@elias/memory";
import { createEmbeddingProvider } from "@elias/embeddings";

const SAMPLE = `
O ELIAS é um sistema de IA pessoal e familiar, modular e seguro, projetado para
operar e evoluir por muitos anos. Ele não é apenas um app que chama LLMs: memória,
integrações e agentes são infraestrutura própria e duradoura.

A memória do ELIAS é organizada em camadas: memória de trabalho, episódica,
semântica (vetorial, via pgvector) e estruturada. Os embeddings são gerados
localmente, para que dados pessoais sensíveis nunca saiam da máquina do usuário.

A arquitetura é híbrida: um núcleo leve de orquestração na nuvem e um worker local
no Mac que processa os dados mais sensíveis. Tudo trafega por uma rede privada.
`.trim();

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`ASSERT FALHOU: ${message}`);
  console.log(`  ✓ ${message}`);
}

async function main(): Promise<void> {
  const client = createServiceClient();
  const embeddings = createEmbeddingProvider();
  const memory = new MemoryStore({ client, embeddings });

  const email = `elias-e2e+${Date.now()}@example.com`;
  console.log(`\n[1/5] Criando usuário de teste: ${email}`);
  const created = await client.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (created.error || !created.data.user) {
    throw new Error(`Falha ao criar usuário: ${created.error?.message}`);
  }
  const userId = created.data.user.id;
  console.log(`      user_id: ${userId}`);

  try {
    console.log(`\n[2/5] Ingerindo texto de exemplo (${SAMPLE.length} chars)`);
    const ingest = await memory.ingest({
      userId,
      content: SAMPLE,
      source: "e2e",
      sourceRef: "memory-e2e",
      sensitivity: "internal",
      chunking: { maxChars: 400, overlap: 60 },
    });
    console.log(`      chunks gravados: ${ingest.chunks}`);
    assert(ingest.chunks >= 1, "ingestão gerou ao menos 1 chunk");

    console.log(`\n[3/5] Busca RELEVANTE: "Onde os embeddings do ELIAS são gerados?"`);
    const relevant = await memory.search({
      userId,
      query: "Onde os embeddings do ELIAS são gerados?",
      matchCount: 3,
    });
    for (const hit of relevant) {
      console.log(`      sim=${hit.similarity.toFixed(4)}  ${hit.content.slice(0, 70).replace(/\n/g, " ")}...`);
    }
    assert(relevant.length > 0, "busca relevante retornou resultados");
    const topRelevant = relevant[0]!;
    assert(topRelevant.similarity > 0.75, `top-sim relevante alto (${topRelevant.similarity.toFixed(4)} > 0.75)`);
    assert(/local/i.test(topRelevant.content), "top hit menciona geração local dos embeddings");

    console.log(`\n[4/5] Busca IRRELEVANTE: "receita de bolo de chocolate"`);
    const irrelevant = await memory.search({
      userId,
      query: "receita de bolo de chocolate",
      matchCount: 3,
    });
    const topIrrelevant = irrelevant[0]?.similarity ?? 0;
    console.log(`      top-sim irrelevante: ${topIrrelevant.toFixed(4)}`);
    assert(
      topRelevant.similarity > topIrrelevant,
      `relevante (${topRelevant.similarity.toFixed(4)}) supera irrelevante (${topIrrelevant.toFixed(4)})`,
    );

    console.log(`\n[5/5] Verificando audit log`);
    const audit = await client
      .from("audit_log")
      .select("action, target, metadata")
      .eq("user_id", userId);
    if (audit.error) throw new Error(`Falha ao ler audit_log: ${audit.error.message}`);
    console.log(`      registros: ${audit.data.length} (${audit.data.map((a) => a.action).join(", ")})`);
    assert(
      audit.data.some((a) => a.action === "memory.write"),
      "ingestão registrou 'memory.write' no audit log",
    );

    console.log("\n✅ E2E PASSOU — embed local + pgvector + retrieval + audit funcionando.");
  } finally {
    console.log(`\n[limpeza] Apagando usuário de teste (cascade em chunks/audit)`);
    const deleted = await client.auth.admin.deleteUser(userId);
    if (deleted.error) {
      console.warn(`      aviso: falha ao apagar usuário: ${deleted.error.message}`);
    } else {
      console.log("      ok, ambiente limpo.");
    }
  }
}

main().catch((error: unknown) => {
  console.error(`\n❌ E2E FALHOU: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
