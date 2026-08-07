import { ConfigError } from "./errors.js";

/**
 * Lê uma variável de ambiente obrigatória. Lança ConfigError se ausente,
 * em vez de deixar o sistema falhar de forma silenciosa mais adiante.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    throw new ConfigError(
      `Variável de ambiente obrigatória ausente: ${name}. Veja .env.example.`,
    );
  }
  return value;
}

/** Lê uma variável de ambiente opcional, com valor padrão. */
export function optionalEnv(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value.trim() === "" ? fallback : value;
}
