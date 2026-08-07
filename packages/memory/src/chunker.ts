export interface ChunkOptions {
  /** Tamanho alvo de cada chunk, em caracteres. */
  maxChars?: number;
  /** Sobreposição entre chunks consecutivos, em caracteres. */
  overlap?: number;
}

const DEFAULT_MAX_CHARS = 1000;
const DEFAULT_OVERLAP = 150;

/**
 * Divide um texto em chunks para embedding/retrieval.
 *
 * Estratégia simples e previsível (Princípio 2): quebra em parágrafos e os
 * empacota até ~maxChars, mantendo uma pequena sobreposição para não perder
 * contexto na fronteira. Parágrafos maiores que maxChars são fatiados por
 * tamanho. Chunkers semânticos mais sofisticados podem substituir este sem
 * mudar a interface, se a qualidade exigir.
 */
export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
  const overlap = options.overlap ?? DEFAULT_OVERLAP;

  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (normalized === "") return [];
  if (normalized.length <= maxChars) return [normalized];

  const paragraphs = normalized.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  const flush = (): void => {
    const trimmed = current.trim();
    if (trimmed !== "") chunks.push(trimmed);
    // Semente do próximo chunk com o final do atual (sobreposição).
    current = overlap > 0 ? trimmed.slice(-overlap) : "";
  };

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChars) {
      flush();
      for (let i = 0; i < paragraph.length; i += maxChars - overlap) {
        chunks.push(paragraph.slice(i, i + maxChars).trim());
      }
      current = "";
      continue;
    }
    if (current !== "" && current.length + paragraph.length + 2 > maxChars) {
      flush();
    }
    current = current === "" ? paragraph : `${current}\n\n${paragraph}`;
  }

  const tail = current.trim();
  if (tail !== "") chunks.push(tail);

  return chunks;
}
