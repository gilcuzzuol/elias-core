-- ELIAS — Log de auditoria imutável para toda ação de agente, especialmente
-- escrita/destrutiva, correlacionando ambiente, usuário e dispositivo.
-- Append-only: sem policies de update/delete => negado por padrão pela RLS.

create table public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  actor      public.actor_kind not null,      -- user | core | worker | agent
  actor_ref  text,                             -- nome do agente, se aplicável
  device_id  uuid references public.authorized_devices (id) on delete set null,
  action     text not null,                    -- ex: 'memory.write', 'connector.github.push'
  target     text,                             -- recurso afetado
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_user_id_idx on public.audit_log (user_id, created_at);

alter table public.audit_log enable row level security;

-- Dono pode ler e inserir; ninguém altera ou apaga (imutabilidade).
create policy "audit_log: dono lê" on public.audit_log
  for select using (auth.uid() = user_id);
create policy "audit_log: dono insere" on public.audit_log
  for insert with check (auth.uid() = user_id);

-- Defesa extra além da RLS: revoga update/delete até para o owner do row via API.
revoke update, delete on public.audit_log from authenticated;
