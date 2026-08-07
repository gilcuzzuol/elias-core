import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { ChatSession, createLLMProvider } from "@elias/core";
import { EliasError } from "@elias/shared";

/**
 * CLI de chat do ELIAS (Fase 0 — macOS).
 *
 * REPL simples: lê linhas do usuário e responde via ChatSession. Ponto de
 * entrada humano mais leve possível para exercitar core + llm de ponta a ponta.
 * Interfaces mais ricas (PWA Android, etc.) entram nas fases seguintes.
 */
async function main(): Promise<void> {
  let provider;
  try {
    provider = createLLMProvider();
  } catch (error) {
    if (error instanceof EliasError) {
      console.error(`\n[configuração] ${error.message}\n`);
      console.error("Dica: copie .env.example para .env e preencha ANTHROPIC_API_KEY.\n");
      process.exit(1);
    }
    throw error;
  }

  // Fase 0: usuário único local. Multiusuário real (ADR-0005) entra na Fase 4.
  const session = new ChatSession({ provider, userId: "local" });

  const rl = createInterface({ input: stdin, output: stdout });
  rl.on("SIGINT", () => {
    rl.close();
  });

  console.log("ELIAS (Fase 0) — chat local via Claude.");
  console.log('Digite sua mensagem. Use "/sair" ou Ctrl+C para encerrar.\n');

  try {
    while (true) {
      const input = (await rl.question("você › ")).trim();
      if (input === "") continue;
      if (input === "/sair" || input === "/exit") break;

      try {
        const reply = await session.send(input);
        console.log(`\nELIAS › ${reply}\n`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`\n[erro] ${message}\n`);
      }
    }
  } finally {
    rl.close();
    console.log("\nAté logo.");
  }
}

void main();
