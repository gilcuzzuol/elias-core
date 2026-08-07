import type { ConversationStore, MemoryStore } from "@elias/memory";
import type { LLMProvider } from "@elias/llm";
import type { ChatMessage, UserId } from "@elias/shared";

const DEFAULT_SYSTEM_PROMPT =
  "Você é o ELIAS, um assistente pessoal. Responda de forma clara, direta e útil, em português do Brasil.";

const DEFAULT_MATCH_COUNT = 5;
const DEFAULT_MIN_SIMILARITY = 0.5;

export interface ChatSessionMemoryOptions {
  matchCount?: number;
  minSimilarity?: number;
}

export interface ChatSessionOptions {
  provider: LLMProvider;
  /** Usuário dono da sessão. Toda memória é escopada por ele (ADR-0005). */
  userId: UserId;
  systemPrompt?: string;
  /** Memória semântica (retrieval). Omitido = chat roda sem contexto injetado. */
  memoryStore?: MemoryStore;
  /** Memória episódica (persistência de conversation/messages). Omitido = não persiste. */
  conversationStore?: ConversationStore;
  memory?: ChatSessionMemoryOptions;
  /** Título inicial da conversation, se persistida. */
  conversationTitle?: string;
}

/**
 * Sessão de chat do ELIAS.
 *
 * Mantém o histórico em memória de trabalho e roteia cada turno para o
 * LLMProvider. Quando memoryStore/conversationStore são informados (ADR-0010):
 * - injeta trechos relevantes recuperados da memória semântica como contexto
 *   efêmero de cada chamada ao LLM (não entra no histórico persistido);
 * - persiste cada turno (user + assistant) na memória episódica
 *   (conversations/messages).
 * Ambas as integrações são best-effort: falha nelas não derruba a conversa.
 */
export class ChatSession {
  private readonly provider: LLMProvider;
  private readonly history: ChatMessage[] = [];
  private readonly memoryStore: MemoryStore | undefined;
  private readonly conversationStore: ConversationStore | undefined;
  private readonly memoryConfig: Required<ChatSessionMemoryOptions>;
  private readonly conversationTitle: string | undefined;
  private conversationId: string | undefined;
  readonly userId: UserId;

  constructor(options: ChatSessionOptions) {
    this.provider = options.provider;
    this.userId = options.userId;
    this.memoryStore = options.memoryStore;
    this.conversationStore = options.conversationStore;
    this.conversationTitle = options.conversationTitle;
    this.memoryConfig = {
      matchCount: options.memory?.matchCount ?? DEFAULT_MATCH_COUNT,
      minSimilarity: options.memory?.minSimilarity ?? DEFAULT_MIN_SIMILARITY,
    };
    this.history.push({
      role: "system",
      content: options.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
    });
  }

  /** Envia uma mensagem do usuário e devolve a resposta do assistente. */
  async send(userMessage: string): Promise<string> {
    await this.ensureConversation();

    const context = await this.retrieveContext(userMessage);
    const requestMessages: ChatMessage[] = context
      ? [...this.history, { role: "system", content: context }, { role: "user", content: userMessage }]
      : [...this.history, { role: "user", content: userMessage }];

    const result = await this.provider.complete({ messages: requestMessages });

    this.history.push({ role: "user", content: userMessage });
    this.history.push({ role: "assistant", content: result.text });

    await this.persistTurn(userMessage, result.text, result.model, result.usage);

    return result.text;
  }

  /** Cópia somente-leitura do histórico atual (inclui o system prompt). */
  get messages(): readonly ChatMessage[] {
    return [...this.history];
  }

  private async ensureConversation(): Promise<void> {
    if (!this.conversationStore || this.conversationId !== undefined) return;
    try {
      const conversation = await this.conversationStore.startConversation({
        userId: this.userId,
        title: this.conversationTitle,
      });
      this.conversationId = conversation.id;
    } catch (error) {
      console.warn(`[memória] falha ao iniciar conversa: ${errorMessage(error)}`);
    }
  }

  private async retrieveContext(query: string): Promise<string | undefined> {
    if (!this.memoryStore) return undefined;
    try {
      const hits = await this.memoryStore.search({
        userId: this.userId,
        query,
        matchCount: this.memoryConfig.matchCount,
        minSimilarity: this.memoryConfig.minSimilarity,
      });
      if (hits.length === 0) return undefined;

      const bullets = hits
        .map((hit) => `- (${hit.source ?? "memória"}) ${hit.content}`)
        .join("\n");
      return `Contexto relevante recuperado da memória do usuário (pode ou não ser útil; use com discernimento):\n${bullets}`;
    } catch (error) {
      console.warn(`[memória] falha ao buscar contexto: ${errorMessage(error)}`);
      return undefined;
    }
  }

  private async persistTurn(
    userMessage: string,
    assistantMessage: string,
    model: string,
    usage: { inputTokens: number; outputTokens: number } | undefined,
  ): Promise<void> {
    if (!this.conversationStore || this.conversationId === undefined) return;
    const conversationId = this.conversationId;
    try {
      await this.conversationStore.appendMessage({
        conversationId,
        userId: this.userId,
        role: "user",
        content: userMessage,
      });
      await this.conversationStore.appendMessage({
        conversationId,
        userId: this.userId,
        role: "assistant",
        content: assistantMessage,
        model,
        usage,
      });
    } catch (error) {
      console.warn(`[memória] falha ao persistir turno: ${errorMessage(error)}`);
    }
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
