-- ELIAS — Identidade. Multiusuário desde o início (ADR-0005): toda tabela
-- tem RLS e é escopada por auth.uid(). O service_role (core) ignora RLS.

-- Perfil de aplicação, 1:1 com auth.users.
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: dono lê" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: dono insere" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles: dono atualiza" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Cria o profile automaticamente quando um usuário é criado no Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$;

-- SECURITY DEFINER necessário no signup, mas não deve ser chamável via API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Dispositivos autorizados: vinculados explicitamente a um usuário; não são
-- confiados apenas por estarem na rede Tailscale (estratégia de segurança).
create table public.authorized_devices (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text not null,
  platform     text,                       -- macos | android | ...
  last_seen_at timestamptz,
  revoked_at   timestamptz,                 -- revogação preserva histórico
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index authorized_devices_user_id_idx on public.authorized_devices (user_id);

alter table public.authorized_devices enable row level security;

create policy "devices: dono lê" on public.authorized_devices
  for select using (auth.uid() = user_id);
create policy "devices: dono insere" on public.authorized_devices
  for insert with check (auth.uid() = user_id);
create policy "devices: dono atualiza" on public.authorized_devices
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger authorized_devices_set_updated_at
  before update on public.authorized_devices
  for each row execute function public.set_updated_at();
