import { LLMError } from "@elias/shared";
import type { CompletionRequest, CompletionResult, LLMProvider } from "./provider.js";

export interface OllamaProviderOptions {
  model: string;
  /** URL base do servidor Ollama local. Padrão: http://localhost:11434 */
  baseUrl?: string;
}

interface OllamaChatResponse {
  model: string;
  message: { role: string; content: string };
  prompt_eval_count?: number;
  eval_count?: number;
}

const DEFAULT_BASE_URL = "http://localhost:11434";

/**
 * Adapter do Ollama para o contrato LLMProvider (ADR-0011).
 *
 * Fala com a API HTTP local do Ollama (`/api/chat`) — modelo roda inteiramente
 * na máquina do usuário, sem custo por token e sem dado saindo dela. Ao
 * contrário do Claude, o Ollama já aceita mensagens `system` diretamente no
 * array `messages`, então não é preciso extraí-las separadamente.
 */
export class OllamaProvider implements LLMProvider {
  readonly name = "ollama";
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(options: OllamaProviderOptions) {
    this.model = options.model;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  }

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    const messages = request.messages.map((m) => ({ role: m.role, content: m.content }));

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          options: {
            temperature: request.temperature,
            num_predict: request.maxTokens,
          },
        }),
      });
    } catch (cause) {
      throw new LLMError(
        `Não foi possível conectar ao Ollama em ${this.baseUrl}. Ele está rodando? ` +
          `Inicie com \`ollama serve\` (ou abra o app Ollama). Causa: ` +
          `${cause instanceof Error ? cause.message : String(cause)}`,
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new LLMError(
        `Falha ao chamar o Ollama (HTTP ${response.status}): ${body || response.statusText}. ` +
          `Verifique se o modelo "${this.model}" foi baixado (\`ollama pull ${this.model}\`).`,
      );
    }

    const data = (await response.json()) as OllamaChatResponse;

    return {
      text: data.message?.content ?? "",
      model: data.model ?? this.model,
      usage:
        data.prompt_eval_count !== undefined && data.eval_count !== undefined
          ? { inputTokens: data.prompt_eval_count, outputTokens: data.eval_count }
          : undefined,
    };
  }
}
