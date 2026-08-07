/** Identificador de usuário. Toda memória e ação é escopada por ele (ADR-0005). */
export type UserId = string;

/** Papéis numa conversa com um LLM. */
export type ChatRole = "system" | "user" | "assistant";

/** Uma mensagem única numa conversa. */
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** Uso de tokens reportado por um provedor de LLM, quando disponível. */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}
