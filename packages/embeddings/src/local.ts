import {
  pipeline,
  type FeatureExtractionPipeline,
} from "@huggingface/transformers";
import { EliasError } from "@elias/shared";
import type { EmbeddingProvider } from "./provider.js";

const DEFAULT_MODEL = "Xenova/multilingual-e5-large";
const E5_DIMENSIONS = 1024;

export interface LocalEmbeddingOptions {
  /** ID do modelo (Hugging Face). Padrão: multilingual-e5-large. */
  model?: string;
  /** Dimensão esperada do vetor. Padrão: 1024. */
  dimensions?: number;
}

/**
 * Provedor de embeddings local (ADR-0009). Roda o modelo dentro do processo
 * Node via ONNX Runtime (@huggingface/transformers) — nada sai da máquina.
 *
 * Usa a convenção do e5: prefixo "passage: " para documentos e "query: " para
 * consultas. O pipeline aplica mean pooling e normalização L2, então os vetores
 * já saem prontos para similaridade de cosseno (o operador <=> do pgvector).
 */
export class LocalEmbeddingProvider implements EmbeddingProvider {
  readonly name = "local-e5-large";
  readonly dimensions: number;
  private readonly model: string;
  private extractor: FeatureExtractionPipeline | null = null;

  constructor(options: LocalEmbeddingOptions = {}) {
    this.model = options.model ?? DEFAULT_MODEL;
    this.dimensions = options.dimensions ?? E5_DIMENSIONS;
  }

  /** Carrega o modelo sob demanda (o primeiro uso baixa os pesos uma vez). */
  private async getExtractor(): Promise<FeatureExtractionPipeline> {
    if (this.extractor === null) {
      this.extractor = await pipeline("feature-extraction", this.model);
    }
    return this.extractor;
  }

  private async embedWithPrefix(
    prefix: "passage: " | "query: ",
    texts: string[],
  ): Promise<number[][]> {
    if (texts.length === 0) return [];
    try {
      const extractor = await this.getExtractor();
      const output = await extractor(
        texts.map((t) => prefix + t),
        { pooling: "mean", normalize: true },
      );
      return output.tolist() as number[][];
    } catch (cause) {
      throw new EliasError(
        `Falha ao gerar embeddings locais: ${cause instanceof Error ? cause.message : String(cause)}`,
        "EMBEDDING_ERROR",
      );
    }
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return this.embedWithPrefix("passage: ", texts);
  }

  async embedQuery(text: string): Promise<number[]> {
    const [vector] = await this.embedWithPrefix("query: ", [text]);
    if (vector === undefined) {
      throw new EliasError(
        "Embedding de consulta vazio.",
        "EMBEDDING_ERROR",
      );
    }
    return vector;
  }
}
