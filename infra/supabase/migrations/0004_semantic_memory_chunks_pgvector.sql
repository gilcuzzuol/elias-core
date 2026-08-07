-- ELIAS — Memória semântica (camada 3): chunks com embeddings via pgvector.
-- Dimensão 1536 (compatível com OpenAI text-embedding-3-small e afins). Se um
-- modelo de outra dimensão for adotado, será uma nova migration + reindex —
-- decisão a registrar em ADR quando o provedor de embeddings for escolhido.

create table public.memory_chunks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  content     text not null,
  embedding   extensions.vector(1536),
  source      text,                       -- ex: 'gdrive', 'filesystem', 'conversation'
  source_ref  text,                       -- id/caminho da origem
  sensitivity public.data_sensitivity not null default 'sensitive',
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index memory_chunks_user_id_idx on public.memory_chunks (user_id);
-- Índice ANN por similaridade de cosseno. HNSW: boa recuperação e latência.
create index memory_chunks_embedding_idx on public.memory_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

alter table public.memory_chunks enable row level security;

create policy "memory_chunks: dono lê" on public.memory_chunks
  for select using (auth.uid() = user_id);
create policy "memory_chunks: dono insere" on public.memory_chunks
  for insert with check (auth.uid() = user_id);
create policy "memory_chunks: dono apaga" on public.memory_chunks
  for delete using (auth.uid() = user_id);

-- Busca por similaridade escopada ao usuário chamador. SECURITY INVOKER: a RLS
-- do chamador é aplicada, então nunca retorna chunk de outro usuário.
create or replace function public.match_memory_chunks(
  query_embedding extensions.vector(1536),
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
