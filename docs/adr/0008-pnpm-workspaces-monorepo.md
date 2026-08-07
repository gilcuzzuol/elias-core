# ADR-0008: pnpm workspaces como gestor do monorepo

**Status:** Aceita
**Data:** 2026-08-07
**Decidida por:** Chief AI Architect (decisão técnica sem impacto de custo/privacidade/irreversibilidade significativos; tooling escolhido em consulta ao usuário entre alternativas equivalentes)

## Contexto

Com TypeScript como runtime principal (ADR-0002) e uma estrutura-alvo de múltiplos pacotes e apps (`packages/*`, `apps/*`) compartilhando tipos e contratos, é preciso um gestor de monorepo que faça a ligação entre pacotes internos, instale dependências e orquestre builds. A escolha precisa favorecer manutenção solo de longo prazo e simplicidade (Princípios 1 e 2).

## Decisão

**pnpm workspaces** é o gestor do monorepo. Pacotes internos se referenciam via protocolo `workspace:*`; builds são orquestrados por `pnpm -r` sobre TypeScript project references (`tsc -b`). Nenhuma camada extra de orquestração de build (ex.: Turborepo) é adicionada nesta fase.

## Consequências

**Positivas:**
- Padrão consolidado da indústria para monorepos JS/TS (Princípio 7), com resolução estrita de dependências que evita "phantom dependencies".
- Instalação rápida e store com conteúdo endereçável, economizando espaço em disco.
- `workspace:*` + project references dão navegação de tipos e builds incrementais entre pacotes sem ferramenta adicional (Princípio 2).
- Fácil adicionar Turborepo por cima depois, se o número de pacotes justificar, sem migração disruptiva.

**Negativas:**
- pnpm usa symlinks/hardlinks a partir de um store global; ambientes de filesystem restritos (ex.: alguns mounts) podem exigir configuração de `store-dir`. Mitigado documentando o setup e mantendo `node_modules`/`dist` fora do versionamento.
- Requer pnpm instalado (via Corepack, incluído no Node ≥ 20) — uma dependência de tooling a mais que npm puro.

## Alternativas consideradas

- **npm workspaces:** já vem com o Node, zero setup, mas resolução mais lenta, sem store compartilhado e com hoisting menos estrito — pior para um monorepo que deve crescer por anos.
- **Turborepo + pnpm:** adiciona cache de build e orquestração de tarefas, útil em muitos pacotes/CI pesado. Descartado agora por complexidade especulativa (Princípio 2); reavaliável quando o volume de pacotes ou o tempo de CI justificar.
- **Yarn (Berry/PnP):** capaz, mas o modo PnP tem atritos de compatibilidade com algumas ferramentas e é menos comum em 2026 do que pnpm para novos projetos.
