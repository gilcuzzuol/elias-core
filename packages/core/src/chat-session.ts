import type { LLMProvider } from "@elias/llm";
import type { ChatMessage, UserId } from "@elias/shared";

const DEFAULT_SYSTEM_PROMPT =
  "Você é o ELIAS, um assistente pessoal. Responda de forma clara, direta e útil, em português do Brasil.";

export interface ChatSessionOptions {
  provider: LLMProvider;
  /** Usuário dono da sessão. Toda memória futura será escopada por ele (ADR-0005). */
  userId: UserId;
  systemPrompt?: string;
}

/**
 * Sessão de chat mínima (memória de trabalho da Fase 0).
 *
 * Mantém o histórico em memória e roteia cada turno para o LLMProvider. É o
 * embrião do Core Orchestrator; camadas de memória persistente, agentes e
 * roteamento por intenção entram nas fases seguintes sem mudar esta interface.
 */
export class ChatSession {
  private readonly provider: LLMProvider;
  private readonly history: ChatMessage[] = [];
  readonly userId: UserId;

  constructor(options: ChatSessionOptions) {
    this.provider = options.provider;
    this.userId = options.userId;
    this.history.push({
      role: "system",
      content: options.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
    });
  }

  /** Envia uma mensagem do usuário e devolve a resposta do assistente. */
  async send(userMessage: string): Promise<string> {
    this.history.push({ role: "user", content: userMessage });

    const result = await this.provider.complete({ messages: this.history });

    this.history.push({ role: "assistant", content: result.text });
    return result.text;
  }

  /** Cópia somente-leitura do histórico atual (inclui o system prompt). */
  get messages(): readonly ChatMessage[] {
    return [...this.history];
  }
}
