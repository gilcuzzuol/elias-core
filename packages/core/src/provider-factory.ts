import { ClaudeProvider, OllamaProvider, type LLMProvider } from "@elias/llm";
import { ConfigError, optionalEnv, requireEnv } from "@elias/shared";

/**
 * Cria o LLMProvider ativo a partir do ambiente.
 *
 * É aqui — e só aqui — que a escolha de provedor concreto acontece. O resto
 * do core recebe um LLMProvider e não sabe qual é (ADR-0006). "claude" (pago,
 * na nuvem) e "ollama" (gratuito, local — ADR-0011) estão disponíveis; openai
 * entra em fase futura.
 */
export function createLLMProvider(): LLMProvider {
  const provider = optionalEnv("ELIAS_LLM_PROVIDER", "claude");

  switch (provider) {
    case "claude":
      return new ClaudeProvider({
        apiKey: requireEnv("ANTHROPIC_API_KEY"),
        model: optionalEnv("ELIAS_LLM_MODEL", "claude-sonnet-5"),
      });
    case "ollama":
      return new OllamaProvider({
        model: optionalEnv("ELIAS_OLLAMA_MODEL", "llama3.1"),
        baseUrl: optionalEnv("ELIAS_OLLAMA_URL", "http://localhost:11434"),
      });
    default:
      throw new ConfigError(
        `Provedor de LLM não suportado nesta fase: "${provider}". Use "claude" ou "ollama".`,
      );
  }
}
