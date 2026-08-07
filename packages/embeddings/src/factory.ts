import { ConfigError, optionalEnv } from "@elias/shared";
import { LocalEmbeddingProvider, type EmbeddingDType } from "./local.js";
import type { EmbeddingProvider } from "./provider.js";

const VALID_DTYPES: readonly EmbeddingDType[] = ["fp32", "fp16", "q8"];

function parseDType(value: string): EmbeddingDType {
  if ((VALID_DTYPES as readonly string[]).includes(value)) {
    return value as EmbeddingDType;
  }
  throw new ConfigError(
    `ELIAS_EMBEDDINGS_DTYPE inválido: "${value}". Use um de: ${VALID_DTYPES.join(", ")}.`,
  );
}

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
        dtype: parseDType(optionalEnv("ELIAS_EMBEDDINGS_DTYPE", "q8")),
      });
    default:
      throw new ConfigError(
        `Provedor de embeddings não suportado nesta fase: "${backend}". Use "local".`,
      );
  }
}
