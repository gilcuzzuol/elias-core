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
