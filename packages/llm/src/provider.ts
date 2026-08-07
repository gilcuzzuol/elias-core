import type { ChatMessage, TokenUsage } from "@elias/shared";

/**
 * Contrato plugável de provedor de LLM (ADR-0006).
 *
 * Claude, ChatGPT e modelos futuros ficam atrás desta interface. O resto do
 * ELIAS nunca importa um SDK de provedor diretamente — depende apenas daqui,
 * de modo que trocar de modelo não exige reescrever o sistema (Princípios 8 e 9).
 */
export interface LLMProvider {
  /** Nome curto do provedor, para logs e roteamento (ex.: "claude"). */
  readonly name: string;

  /** Uma resposta completa (não-streaming) para uma conversa. */
  complete(request: CompletionRequest): Promise<CompletionResult>;
}

export interface CompletionRequest {
  /** Histórico da conversa. Mensagens `system` são extraídas pelo adapter. */
  messages: ChatMessage[];
  /** Máximo de tokens a gerar. */
  maxTokens?: number;
  /** Temperatura de amostragem (0–1). */
  temperature?: number;
}

export interface CompletionResult {
  /** Texto gerado pelo modelo. */
  text: string;
  /** Modelo efetivamente usado. */
  model: string;
  /** Uso de tokens, quando o provedor reporta. */
  usage?: TokenUsage;
}
