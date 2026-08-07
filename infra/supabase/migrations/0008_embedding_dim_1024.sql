-- ELIAS — Ajuste da dimensão de embedding de 1536 para 1024 (ADR-0009:
-- embeddings locais via multilingual-e5-large, 1024d). Tabelas vazias, então
-- é seguro recriar coluna, índice e função de busca.

drop function if exists public.match_memory_chunks(extensions.vector, int, float);
drop index if exists public.memory_chunks_embedding_idx;

alter table public.memory_chunks
  alter column embedding type extensions.vector(1024);

create index memory_chunks_embedding_idx on public.memory_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

create or replace function public.match_memory_chunks(
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
  where mc.embedding is not null
    and 1 - (mc.embedding <=> query_embedding) >= min_similarity
  order by mc.embedding <=> query_embedding
  limit match_count;
$$;
