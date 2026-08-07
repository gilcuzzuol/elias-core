import { EliasError } from "@elias/shared";
import type { ChatRole, TokenUsage, UserId } from "@elias/shared";
import type { EliasSupabaseClient } from "./client.js";
import type { Database } from "./database.types.js";

type Sensitivity = Database["public"]["Enums"]["data_sensitivity"];

export interface StartConversationParams {
  userId: UserId;
  title?: string;
}

export interface AppendMessageParams {
  conversationId: string;
  userId: UserId;
  role: ChatRole;
  content: string;
  model?: string;
  usage?: TokenUsage;
  sensitivity?: Sensitivity;
}

/**
 * Memória episódica do ELIAS: conversas e mensagens (camada 2 da estratégia
 * de memória, migration 0003). Todo acesso é escopado por user_id
 * explicitamente, porque o core usa service_role e não pode depender de RLS
 * (ADR-0005).
 */
export class ConversationStore {
  private readonly client: EliasSupabaseClient;

  constructor(deps: { client: EliasSupabaseClient }) {
    this.client = deps.client;
  }

  async startConversation(params: StartConversationParams): Promise<{ id: string }> {
    const { data, error } = await this.client
      .from("conversations")
      .insert({ user_id: params.userId, title: params.title ?? null })
      .select("id")
      .single();

    if (error || !data) {
      throw new EliasError(
        `Falha ao iniciar conversa: ${error?.message ?? "sem retorno"}`,
        "CONVERSATION_WRITE_ERROR",
      );
    }

    return { id: data.id };
  }

  async appendMessage(params: AppendMessageParams): Promise<void> {
    const { error } = await this.client.from("messages").insert({
      conversation_id: params.conversationId,
      user_id: params.userId,
      role: params.role,
      content: params.content,
      model: params.model ?? null,
      input_tokens: params.usage?.inputTokens ?? null,
      output_tokens: params.usage?.outputTokens ?? null,
      sensitivity: params.sensitivity ?? "sensitive",
    });

    if (error) {
      throw new EliasError(`Falha ao gravar mensagem: ${error.message}`, "MESSAGE_WRITE_ERROR");
    }
  }
}
