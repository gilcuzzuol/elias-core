-- ELIAS — Memória episódica: conversas e mensagens (camada 2 da estratégia
-- de memória). Escopada por usuário, com RLS.

create table public.conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index conversations_user_id_idx on public.conversations (user_id);

alter table public.conversations enable row level security;

create policy "conversations: dono lê" on public.conversations
  for select using (auth.uid() = user_id);
create policy "conversations: dono insere" on public.conversations
  for insert with check (auth.uid() = user_id);
create policy "conversations: dono atualiza" on public.conversations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "conversations: dono apaga" on public.conversations
  for delete using (auth.uid() = user_id);

create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  role            text not null check (role in ('system', 'user', 'assistant')),
  content         text not null,
  sensitivity     public.data_sensitivity not null default 'sensitive',
  input_tokens    integer,
  output_tokens   integer,
  model           text,
  created_at      timestamptz not null default now()
);

create index messages_conversation_id_idx on public.messages (conversation_id, created_at);
create index messages_user_id_idx on public.messages (user_id);

alter table public.messages enable row level security;

create policy "messages: dono lê" on public.messages
  for select using (auth.uid() = user_id);
create policy "messages: dono insere" on public.messages
  for insert with check (auth.uid() = user_id);
create policy "messages: dono apaga" on public.messages
  for delete using (auth.uid() = user_id);
-- Sem policy de update: mensagens são imutáveis depois de gravadas.
