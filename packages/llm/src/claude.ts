import Anthropic from "@anthropic-ai/sdk";
import { LLMError } from "@elias/shared";
import type { ChatMessage } from "@elias/shared";
import type {
  CompletionRequest,
  CompletionResult,
  LLMProvider,
} from "./provider.js";

export interface ClaudeProviderOptions {
  apiKey: string;
  model: string;
}

/**
 * Adapter do Claude (Anthropic) para o contrato LLMProvider.
 *
 * É o único lugar do ELIAS que conhece o SDK da Anthropic. Mantém o
 * mapeamento entre o formato interno (ChatMessage) e a API da Anthropic.
 */
export class ClaudeProvider implements LLMProvider {
  readonly name = "claude";
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(options: ClaudeProviderOptions) {
    this.client = new Anthropic({ apiKey: options.apiKey });
    this.model = options.model;
  }

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    const system = request.messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n\n");

    const messages = request.messages
      .filter((m): m is ChatMessage & { role: "user" | "assistant" } =>
        m.role === "user" || m.role === "assistant",
      )
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: request.maxTokens ?? 1024,
        temperature: request.temperature,
        system: system === "" ? undefined : system,
        messages,
      });

      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("");

      return {
        text,
        model: response.model,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (cause) {
      throw new LLMError(
        `Falha ao chamar o Claude: ${cause instanceof Error ? cause.message : String(cause)}`,
      );
    }
  }
}
