# ADR-0009: Embeddings locais como padrão da memória semântica

**Status:** Aceita
**Data:** 2026-08-07
**Decidida por:** Chief AI Architect, consultando o usuário (decisão com impacto em privacidade/segurança e alternativas com trade-off — critério de consulta humana, Princípio 5)

## Contexto

A memória semântica (ADR-0003, `memory_chunks` + pgvector) precisa de um provedor de embeddings. Os dados do ELIAS entram classificados como `sensitive` por padrão — é um assistente pessoal e familiar. É preciso escolher onde e como os embeddings são gerados, equilibrando qualidade, custo e, sobretudo, o Princípio 3 (segurança por padrão) e o Princípio 4 (local-first quando tecnicamente viável).

Enviar todo conteúdo pessoal a uma API externa (ex.: OpenAI) para gerar embeddings contraria o local-first justamente para o dado que mais importa proteger. Por outro lado, gerar embeddings de qualidade localmente num Mac é tecnicamente viável hoje.

## Decisão

**Embeddings são gerados localmente por padrão**, atrás de uma abstração `EmbeddingProvider` (espelha o `LLMProvider` do ADR-0006, mantendo o provedor plugável — Princípio 9).

- Implementação padrão: **`multilingual-e5-large` (1024 dimensões)** executado dentro do processo Node via `@huggingface/transformers` (ONNX Runtime), sem daemon externo. Escolhido por qualidade multilíngue (incl. português), dimensão 1024 e export ONNX mantido e disponível.
- A dimensão do vetor em `memory_chunks` é **1024** (migration `0008`), alinhada ao modelo.
- Convenção do e5: textos a indexar recebem o prefixo `passage: ` e consultas recebem `query: ` — encapsulada no adapter, transparente para o resto do sistema.

## Consequências

**Positivas:**
- Nenhum conteúdo sensível sai da máquina para gerar embeddings (Princípios 3 e 4).
- Sem custo por token e sem dependência de disponibilidade de API externa.
- `EmbeddingProvider` permite adicionar outros backends (OpenAI, híbrido por sensibilidade) depois, como novos adapters, sem reescrever a camada de memória (Princípio 9).
- Executa in-process (ONNX), sem exigir que o usuário instale/rode um serviço separado.

**Negativas:**
- Primeiro uso baixa os pesos do modelo (algumas centenas de MB) uma vez; depois roda offline.
- Embedding local consome CPU/RAM do worker; para volumes altos, avaliar batching e, se necessário, um modelo menor (e5-base, 768d) ou GPU/MLX — reavaliação de escala fica para a Fase 6.
- Dimensão 1024 é menor que os 1536 iniciais; diferença irrelevante para a qualidade de recuperação neste caso de uso.

## Alternativas consideradas

- **OpenAI `text-embedding-3-small` (1536d):** mais simples e barato, alta qualidade, mas envia conteúdo pessoal a um terceiro — conflita com o Princípio 4 para o dado predominante (sensível). Fica disponível como adapter futuro para dados `public`/`internal`.
- **Híbrido por sensibilidade (local para sensível, API para o resto):** o mais fiel aos princípios no limite, mas introduz dois caminhos de embedding desde o dia 1 — complexidade especulativa que o Princípio 2 pede evitar. Não descartado: com a abstração pronta, vira só um roteador + segundo adapter quando houver justificativa.
- **`bge-m3` (1024d):** qualidade multilíngue equivalente e mesma dimensão; preterido apenas por disponibilidade/manutenção de export ONNX menos garantida para execução in-process no Node. Substituível pelo mesmo adapter caso se prefira depois.
