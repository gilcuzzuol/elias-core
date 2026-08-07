import { createEmbeddingProvider } from "@elias/embeddings";
import { ConversationStore, MemoryStore, createServiceClient } from "@elias/memory";
import { optionalEnv } from "@elias/shared";

export interface MemoryLayer {
  memoryStore: MemoryStore;
  conversationStore: ConversationStore;
}

/**
 * Cria a camada de memória (semântica + episódica) a partir do ambiente.
 *
 * É aqui — e só aqui — que o cliente Supabase e o EmbeddingProvider concretos
 * se juntam (ADR-0009). O resto do core só conhece MemoryStore/ConversationStore.
 * As duas camadas compartilham um único cliente Supabase.
 */
export function createMemoryLayer(): MemoryLayer {
  const client = createServiceClient();
  const embeddings = createEmbeddingProvider();
  return {
    memoryStore: new MemoryStore({ client, embeddings }),
    conversationStore: new ConversationStore({ client }),
  };
}

/** Parâmetros de recuperação de contexto lidos do ambiente (ADR-0010). */
export interface MemoryRetrievalConfig {
  matchCount: number;
  minSimilarity: number;
}

export function createMemoryRetrievalConfig(): MemoryRetrievalConfig {
  return {
    matchCount: Number(optionalEnv("ELIAS_MEMORY_MATCH_COUNT", "5")),
    minSimilarity: Number(optionalEnv("ELIAS_MEMORY_MIN_SIMILARITY", "0.5")),
  };
}
