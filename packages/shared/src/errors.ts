/** Erro base do ELIAS. Todo erro esperado do sistema herda daqui. */
export class EliasError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** Configuração ausente ou inválida (ex.: variável de ambiente faltando). */
export class ConfigError extends EliasError {
  constructor(message: string) {
    super(message, "CONFIG_ERROR");
  }
}

/** Falha ao chamar um provedor de LLM. */
export class LLMError extends EliasError {
  constructor(message: string) {
    super(message, "LLM_ERROR");
  }
}
