# CLAUDE.md — contexto do projeto para o Claude Code

Este arquivo orienta agentes Claude que trabalham neste repositório. Leia junto
com `docs/PROJECT_PRINCIPLES.md` e `docs/architecture/overview.md`.

## O que é o ELIAS

Sistema de IA pessoal e familiar, modular, seguro e extensível, projetado para
operar e evoluir por muitos anos. Não é "um app que chama LLMs": memória,
integrações e agentes são infraestrutura própria e duradoura; os LLMs são
motores plugáveis atrás de abstrações. Dados pessoais são o ativo mais sensível
— segurança e privacidade são prioridade, não opção.

## Papel do agente

O humano (Gil) define objetivos e aprova decisões de impacto (custo, privacidade,
irreversibilidade, ou preferência entre alternativas equivalentes). O Claude é o
Chief AI Architect: responsável pelas decisões arquiteturais. **Toda decisão
arquitetural relevante vira uma ADR** em `docs/adr/` (convenção em
`docs/adr/README.md`). Nunca registre só a decisão final — inclua contexto,
consequências e alternativas descartadas.

Os 10 princípios inegociáveis estão em `docs/PROJECT_PRINCIPLES.md` e prevalecem
sobre conveniência de curto prazo.

## Estrutura (monorepo pnpm + TypeScript)

```
apps/
  cli/            # CLI de chat no macOS (Fase 0)
  scripts/        # scripts operacionais (ex.: e2e de memória)
packages/
  core/           # orquestração mínima (ChatSession + fábrica de provedor)
  llm/            # LLMProvider plugável + adapter Claude (ADR-0006)
  embeddings/     # EmbeddingProvider plugável + adapter local (ADR-0009)
  memory/         # memória semântica: ingestão + retrieval (pgvector)
  shared/         # tipos, erros, utils comuns
infra/supabase/   # migrations do schema (RLS, pgvector) — fonte da verdade
docs/             # arquitetura, ADRs, princípios
```

Decisões já registradas: ADR-0001 a 0009. Antes de mudar arquitetura, leia as
ADRs relevantes.

## Comandos

```bash
corepack enable            # habilita o pnpm (vem com o Node)
pnpm install               # instala dependências
pnpm build                 # builda todos os pacotes (tsc -b, project references)
pnpm typecheck             # checagem de tipos
pnpm cli                   # inicia o CLI de chat (precisa de ANTHROPIC_API_KEY)
pnpm e2e:memory            # teste ponta a ponta da memória (precisa do Supabase)
```

Gerenciador de pacotes: **pnpm** (ADR-0008), via Corepack.

## Ambiente e segredos

- Copie `.env.example` para `.env` e preencha. **Nunca** comite `.env` (Princípio 3).
- `ANTHROPIC_API_KEY` — para o CLI/adapter Claude.
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
  - A `service_role` (JWT `eyJ...`, seção "Legacy API keys" no painel) **ignora RLS**;
    só no core/worker, jamais no cliente. As chaves novas `sb_secret_...` funcionam
    na Data API mas **não** no Auth admin — use a `service_role` legada para scripts
    que criam usuários.

## Supabase

- Projeto: `elias-core`, ref `zkldxpwufkaadnmvgjab`, região `sa-east-1`.
- Schema em `infra/supabase/migrations/` (infra as code). RLS em toda tabela desde
  a primeira migration (ADR-0005). O core usa `service_role` e **filtra por
  user_id explicitamente** — não confie em RLS quando a chave a ignora.
- Após mudanças de DDL, rode o linter de segurança (advisors) e corrija alertas.
- Regenere os tipos após mudar o schema:
  `supabase gen types typescript --project-id zkldxpwufkaadnmvgjab` →
  `packages/memory/src/database.types.ts`.

## Embeddings (ADR-0009)

- Local por padrão, in-process via `@huggingface/transformers` (ONNX). Nada sai
  da máquina. Modelo: `Xenova/multilingual-e5-large`, **1024 dimensões**, dtype
  `q8` (quantizado, leve). Configurável por env (`ELIAS_EMBEDDINGS_*`).
- Convenção e5: prefixos `query: ` / `passage: ` (encapsulados no adapter).
- Primeiro uso baixa ~500MB (q8) uma vez. Se aparecer `Protobuf parsing failed`
  ou `Abort trap`, o cache do modelo provavelmente corrompeu (download
  interrompido) — limpe e rebaixe:
  `find node_modules -path '*@huggingface/transformers/.cache' -type d -exec rm -rf {} +`
- Diagnóstico com progresso: `node packages/embeddings/diag.mjs`.

## Notas de ambiente

- **Node**: use uma versão LTS (ex.: 22) para o `onnxruntime-node`. Versões muito
  novas do Node podem causar crash nativo ao carregar o modelo de embeddings.
- Builds usam TypeScript project references; `tsc -b` respeita o grafo de deps.
- `node_modules` e `dist` não são versionados.

## Convenções de código

- ESM (`"type": "module"`), `verbatimModuleSyntax` — use `import type` para tipos.
- Cada camada isolada atrás de contratos (Princípio 8). Provedores concretos
  (LLM, embeddings) só são escolhidos nas fábricas (`*-factory.ts` / `factory.ts`).
- Um módulo, uma responsabilidade (Princípio 10). Comentários e mensagens em
  português do Brasil, como o restante do projeto.

## Roadmap (resumo)

Fase 0 (Fundação) ✅ · Fase 1 (Memória MVP) em andamento — pipeline de ingestão/
retrieval validado e2e; próximo: plugar memória no CLI. Fases seguintes em
`docs/architecture/overview.md#8-roadmap`.
