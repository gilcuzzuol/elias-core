# Architecture Decision Records (ADR)

Este diretório contém o registro histórico das decisões arquiteturais do ELIAS.

## Convenção

- Um arquivo por decisão: `NNNN-titulo-curto.md`, numeração sequencial, nunca reutilizada.
- Toda ADR segue o template: **Status**, **Contexto**, **Decisão**, **Consequências**, **Alternativas consideradas**.
- Status possíveis: `Proposta`, `Aceita`, `Substituída por ADR-NNNN`, `Obsoleta`.
- ADRs não são editadas retroativamente para "corrigir" uma decisão — se a decisão muda, cria-se uma nova ADR que substitui a anterior e referencia o motivo da mudança.
- Decisões tomadas autonomamente pelo Chief AI Architect (Claude) seguem os critérios definidos com o usuário: só são levadas para consulta humana quando há impacto significativo de custo, impacto em privacidade/segurança, irreversibilidade relevante, ou alternativas tecnicamente equivalentes que dependem de preferência pessoal.

## Índice

| ADR | Título | Status |
|---|---|---|
| [0001](0001-hybrid-hosting-topology.md) | Topologia de hospedagem híbrida | Aceita |
| [0002](0002-typescript-as-primary-runtime.md) | TypeScript como runtime principal | Aceita |
| [0003](0003-supabase-as-data-backbone.md) | Supabase como espinha dorsal de dados | Aceita |
| [0004](0004-mcp-as-connector-standard.md) | MCP como padrão de conector | Aceita |
| [0005](0005-multi-user-first-data-model.md) | Modelo de dados multiusuário desde o início | Aceita |
| [0006](0006-pluggable-llm-provider-abstraction.md) | Abstração plugável de provedores de LLM | Aceita |
| [0007](0007-android-client-pwa-first.md) | Cliente Android: PWA primeiro | Aceita |
| [0008](0008-pnpm-workspaces-monorepo.md) | pnpm workspaces como gestor do monorepo | Aceita |
| [0009](0009-local-embeddings-provider.md) | Embeddings locais como padrão da memória semântica | Aceita |
| [0010](0010-memory-context-injection.md) | Injeção de contexto de memória semântica nas chamadas ao LLM | Aceita |
| [0011](0011-ollama-local-llm-provider.md) | Provedor de LLM local gratuito via Ollama | Aceita |
| [0012](0012-local-desktop-api-and-pwa.md) | Servidor HTTP local + PWA instalável como interface de desktop | Aceita |
