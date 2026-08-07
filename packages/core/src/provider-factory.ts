import { ClaudeProvider, type LLMProvider } from "@elias/llm";
import { ConfigError, optionalEnv, requireEnv } from "@elias/shared";

/**
 * Cria o LLMProvider ativo a partir do ambiente.
 *
 * É aqui — e só aqui — que a escolha de provedor concreto acontece. O resto
 * do core recebe um LLMProvider e não sabe qual é (ADR-0006). Na Fase 0 só
 * o Claude está implementado; openai entra na Fase 3.
 */
export function createLLMProvider(): LLMProvider {
  const provider = optionalEnv("ELIAS_LLM_PROVIDER", "claude");

  switch (provider) {
    case "claude":
      return new ClaudeProvider({
        apiKey: requireEnv("ANTHROPIC_API_KEY"),
        model: optionalEnv("ELIAS_LLM_MODEL", "claude-sonnet-5"),
      });
    default:
      throw new ConfigError(
        `Provedor de LLM não suportado nesta fase: "${provider}". Use "claude".`,
      );
  }
}
