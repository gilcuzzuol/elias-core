-- ELIAS — Memória estruturada/explícita (camada 4): fatos e preferências.

create table public.facts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  subject     text not null,              -- entidade a que o fato se refere
  predicate   text not null,              -- atributo/relação
  object      text not null,              -- valor
  confidence  real not null default 1.0 check (confidence >= 0 and confidence <= 1),
  source      text,
  sensitivity public.data_sensitivity not null default 'sensitive',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, subject, predicate)
);

create index facts_user_id_idx on public.facts (user_id);

alter table public.facts enable row level security;

create policy "facts: dono lê" on public.facts
  for select using (auth.uid() = user_id);
create policy "facts: dono insere" on public.facts
  for insert with check (auth.uid() = user_id);
create policy "facts: dono atualiza" on public.facts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "facts: dono apaga" on public.facts
  for delete using (auth.uid() = user_id);

create trigger facts_set_updated_at
  before update on public.facts
  for each row execute function public.set_updated_at();

create table public.preferences (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  key        text not null,
  value      jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);

create index preferences_user_id_idx on public.preferences (user_id);

alter table public.preferences enable row level security;

create policy "preferences: dono lê" on public.preferences
  for select using (auth.uid() = user_id);
create policy "preferences: dono insere" on public.preferences
  for insert with check (auth.uid() = user_id);
create policy "preferences: dono atualiza" on public.preferences
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "preferences: dono apaga" on public.preferences
  for delete using (auth.uid() = user_id);

create trigger preferences_set_updated_at
  before update on public.preferences
  for each row execute function public.set_updated_at();
