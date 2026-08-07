# ELIAS

Sistema de IA pessoal e familiar, modular, seguro e extensível, projetado para operar e evoluir por muitos anos.

- Princípios do projeto: [`docs/PROJECT_PRINCIPLES.md`](docs/PROJECT_PRINCIPLES.md)
- Arquitetura: [`docs/architecture/overview.md`](docs/architecture/overview.md)
- Decisões técnicas registradas: [`docs/adr/`](docs/adr/README.md)

## Status

**Fase 0 — Fundação** iniciada. Monorepo escafoldado com um CLI de chat mínimo falando com o Claude, de ponta a ponta. VPS, worker local e Supabase ainda não integrados.

## Estrutura

```
apps/
  cli/            # CLI de chat no macOS (Fase 0)
packages/
  core/           # orquestração mínima (ChatSession + fábrica de provedor)
  llm/            # LLMProvider plugável + adapter Claude (ADR-0006)
  embeddings/     # EmbeddingProvider plugável + adapter local (ADR-0009)
  shared/         # tipos, erros e utils comuns
infra/
  supabase/       # migrations do schema (RLS, pgvector) — ADR-0003
docs/             # arquitetura, ADRs, princípios
```

Estrutura-alvo completa em [`docs/architecture/overview.md`](docs/architecture/overview.md#2-estrutura-de-diret%C3%B3rios).

## Requisitos

- Node.js ≥ 20 (inclui Corepack)
- pnpm (via Corepack) — ver [ADR-0008](docs/adr/0008-pnpm-workspaces-monorepo.md)

## Setup

```bash
corepack enable
pnpm install
cp .env.example .env      # preencha ANTHROPIC_API_KEY
pnpm build
```

## Rodar o CLI

```bash
pnpm cli
```

Você conversa no terminal; `/sair` ou Ctrl+C encerra. Sem `ANTHROPIC_API_KEY` no `.env`, o CLI avisa e sai com instruções.

## Scripts

- `pnpm build` — builda todos os pacotes (TypeScript project references)
- `pnpm typecheck` — checagem de tipos sem emitir
- `pnpm clean` — remove `dist/` e artefatos de build
- `pnpm cli` — inicia o CLI de chat

## Segurança

Segredos nunca no repositório (Princípio 3). `.env` é ignorado pelo Git; use `.env.example` como referência.
