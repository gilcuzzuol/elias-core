import type { EmbeddingProvider } from "@elias/embeddings";
import { EliasError } from "@elias/shared";
import type { UserId } from "@elias/shared";
import type { EliasSupabaseClient } from "./client.js";
import { chunkText, type ChunkOptions } from "./chunker.js";
import type { Database, Json } from "./database.types.js";

type Sensitivity = Database["public"]["Enums"]["data_sensitivity"];

export interface IngestParams {
  userId: UserId;
  content: string;
  source?: string; // ex: 'gdrive', 'filesystem', 'conversation'
  sourceRef?: string; // id/caminho da origem
  sensitivity?: Sensitivity;
  metadata?: Json;
  chunking?: ChunkOptions;
}

export interface IngestResult {
  chunks: number;
}

export interface SearchParams {
  userId: UserId;
  query: string;
  matchCount?: number;
  minSimilarity?: number;
}

export interface SearchHit {
  id: string;
  content: string;
  source: string | null;
  similarity: number;
  metadata: Json;
}

/** Converte um vetor em literal aceito pelo pgvector (ex.: "[0.1,0.2]"). */
function toVectorLiteral(vector: number[]): string {
  return `[${vector.join(",")}]`;
}

/**
 * Camada de memória semântica do ELIAS: ingestão e recuperação sobre
 * memory_chunks (pgvector). Todo acesso é escopado por user_id explicitamente,
 * porque o core usa service_role e não pode depender de RLS (ADR-0005).
 *
 * Pipeline de ingestão: chunk → embed (local, ADR-0009) → grava → audita.
 */
export class MemoryStore {
  private readonly client: EliasSupabaseClient;
  private readonly embeddings: EmbeddingProvider;

  constructor(deps: { client: EliasSupabaseClient; embeddings: EmbeddingProvider }) {
    this.client = deps.client;
    this.embeddings = deps.embeddings;
  }

  async ingest(params: IngestParams): Promise<IngestResult> {
    const chunks = chunkText(params.content, params.chunking);
    if (chunks.length === 0) return { chunks: 0 };

    const vectors = await this.embeddings.embedDocuments(chunks);

    const rows: Database["public"]["Tables"]["memory_chunks"]["Insert"][] =
      chunks.map((content, i) => ({
        user_id: params.userId,
        content,
        embedding: toVectorLiteral(vectors[i] ?? []),
        source: params.source ?? null,
        source_ref: params.sourceRef ?? null,
        sensitivity: params.sensitivity ?? "sensitive",
        metadata: params.metadata ?? {},
      }));

    const { error } = await this.client.from("memory_chunks").insert(rows);
    if (error) {
      throw new EliasError(`Falha ao gravar memória: ${error.message}`, "MEMORY_WRITE_ERROR");
    }

    // Auditoria de escrita (log imutável — estratégia de segurança).
    await this.audit(params.userId, "memory.write", params.sourceRef ?? params.source ?? null, {
      chunks: chunks.length,
      source: params.source ?? null,
    });

    return { chunks: chunks.length };
  }

  async search(params: SearchParams): Promise<SearchHit[]> {
    const queryVector = await this.embeddings.embedQuery(params.query);

    const { data, error } = await this.client.rpc("match_memory_chunks", {
      filter_user_id: params.userId,
      query_embedding: toVectorLiteral(queryVector),
      match_count: params.matchCount ?? 8,
      min_similarity: params.minSimilarity ?? 0.0,
    });

    if (error) {
      throw new EliasError(`Falha na busca de memória: ${error.message}`, "MEMORY_SEARCH_ERROR");
    }

    return (data ?? []).map((hit) => ({
      id: hit.id,
      content: hit.content,
      source: hit.source,
      similarity: hit.similarity,
      metadata: hit.metadata,
    }));
  }

  /** Registra uma ação no audit log. Falha de auditoria não derruba a operação. */
  private async audit(
    userId: UserId,
    action: string,
    target: string | null,
    metadata: Json,
  ): Promise<void> {
    const { error } = await this.client.from("audit_log").insert({
      user_id: userId,
      actor: "core",
      action,
      target,
      metadata,
    });
    if (error) {
      // Não lança: a operação principal já ocorreu. Apenas sinaliza.
      console.warn(`[audit] falha ao registrar ${action}: ${error.message}`);
    }
  }
}
