import { ConfigError, optionalEnv } from "@elias/shared";
import { LocalEmbeddingProvider } from "./local.js";
import type { EmbeddingProvider } from "./provider.js";

/**
 * Cria o EmbeddingProvider ativo a partir do ambiente. É aqui — e só aqui —
 * que o backend concreto é escolhido (ADR-0009). Na Fase 1 só o local existe;
 * openai/híbrido entram como novos casos sem tocar na camada de memória.
 */
export function createEmbeddingProvider(): EmbeddingProvider {
  const backend = optionalEnv("ELIAS_EMBEDDINGS_PROVIDER", "local");

  switch (backend) {
    case "local":
      return new LocalEmbeddingProvider({
        model: optionalEnv("ELIAS_EMBEDDINGS_MODEL", "Xenova/multilingual-e5-large"),
      });
    default:
      throw new ConfigError(
        `Provedor de embeddings não suportado nesta fase: "${backend}". Use "local".`,
      );
  }
}
