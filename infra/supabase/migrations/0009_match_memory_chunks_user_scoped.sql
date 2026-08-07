-- ELIAS — Torna a busca semântica explicitamente escopada por usuário.
-- O core acessa o banco com service_role, que IGNORA RLS; sem um filtro
-- explícito por user_id a busca vazaria chunks de outros usuários. A versão
-- anterior (só RLS) era segura apenas para clientes autenticados.

drop function if exists public.match_memory_chunks(extensions.vector, int, float);

create or replace function public.match_memory_chunks(
  filter_user_id uuid,
  query_embedding extensions.vector(1024),
  match_count int default 8,
  min_similarity float default 0.0
)
returns table (
  id uuid,
  content text,
  source text,
  similarity float,
  metadata jsonb
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    mc.id,
    mc.content,
    mc.source,
    1 - (mc.embedding <=> query_embedding) as similarity,
    mc.metadata
  from public.memory_chunks mc
  where mc.user_id = filter_user_id            -- escopo explícito (seguro p/ service_role)
    and mc.embedding is not null
    and 1 - (mc.embedding <=> query_embedding) >= min_similarity
  order by mc.embedding <=> query_embedding
  limit match_count;
$$;
