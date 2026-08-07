# Supabase — infra do ELIAS

Projeto dedicado ao ELIAS (separado do restante da conta), backbone de dados
do sistema: Postgres + pgvector + Auth + RLS ([ADR-0003](../../docs/adr/0003-supabase-as-data-backbone.md)).

## Projeto

- **Nome:** `elias-core`
- **Região:** `sa-east-1` (São Paulo)
- **Ref:** `zkldxpwufkaadnmvgjab`
- **API URL:** `https://zkldxpwufkaadnmvgjab.supabase.co`

As chaves ficam em `.env` (nunca versionadas). A `service_role` key só vive no
core/worker, jamais no cliente (Princípio 3).

## Migrations

O diretório `migrations/` é a fonte da verdade do schema (infra as code). Cada
arquivo `NNNN_descricao.sql` é aplicado em ordem. O schema atual cobre:

| # | Migration | Conteúdo |
|---|---|---|
| 0001 | extensions_and_base_types | pgvector, enums (`data_sensitivity`, `actor_kind`), `set_updated_at()` |
| 0002 | identity_profiles_and_devices | `profiles` (1:1 com auth.users) + `authorized_devices` |
| 0003 | episodic_memory_conversations_messages | `conversations` + `messages` |
| 0004 | semantic_memory_chunks_pgvector | `memory_chunks` (embeddings, HNSW) + `match_memory_chunks()` |
| 0005 | structured_memory_facts_preferences | `facts` + `preferences` |
| 0006 | immutable_audit_log | `audit_log` append-only |
| 0007 | harden_functions | fix de `search_path` e revoke de execução |
| 0008 | embedding_dim_1024 | dimensão do embedding 1536 → 1024 ([ADR-0009](../../docs/adr/0009-local-embeddings-provider.md)) |
| 0009 | match_memory_chunks_user_scoped | busca semântica com `filter_user_id` explícito (segura para `service_role`) |

## Princípios refletidos no schema

- **RLS em toda tabela desde a primeira migration** ([ADR-0005](../../docs/adr/0005-multi-user-first-data-model.md)): toda linha é escopada por `auth.uid()`. O `service_role` (core) ignora RLS por design.
- **Imutabilidade onde importa:** `messages` sem update; `audit_log` sem update/delete.
- **Classificação de dados:** coluna `sensitivity` (`data_sensitivity`) em messages/chunks/facts, base para decidir o que pode ir a um LLM externo.
- **Segurança verificada:** `get_advisors(security)` sem alertas após 0007.

## Aplicar em um novo ambiente

Via Supabase CLI (recomendado para reprodutibilidade):

```bash
supabase link --project-ref zkldxpwufkaadnmvgjab
supabase db push
```

Alternativamente, rodar os arquivos de `migrations/` em ordem no SQL editor.
