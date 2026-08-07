/**
 * Contrato plugável de provedor de embeddings (ADR-0009).
 *
 * Espelha o LLMProvider (ADR-0006): a camada de memória depende apenas desta
 * interface, nunca de um modelo/SDK concreto. Trocar o backend de embeddings
 * (local, OpenAI, híbrido) é adicionar um adapter, não reescrever o sistema.
 *
 * A distinção documento/consulta existe porque alguns modelos (ex.: e5) exigem
 * prefixos diferentes para texto indexado vs. texto de busca. Adapters que não
 * precisam disso simplesmente tratam os dois casos igual.
 */
export interface EmbeddingProvider {
  /** Nome curto do provedor, para logs (ex.: "local-e5-large"). */
  readonly name: string;

  /** Dimensão dos vetores gerados. Deve casar com a coluna em memory_chunks. */
  readonly dimensions: number;

  /** Gera embeddings para textos que serão armazenados/indexados. */
  embedDocuments(texts: string[]): Promise<number[][]>;

  /** Gera o embedding de uma consulta de busca. */
  embedQuery(text: string): Promise<number[]>;
}
