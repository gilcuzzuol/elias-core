-- ELIAS — Fundação do schema: extensions e tipos base.
-- pgvector para memória semântica (ADR-0003). RLS entra a partir da 0002.

-- pgvector fica em um schema dedicado (boa prática de isolamento).
create schema if not exists extensions;
create extension if not exists vector with schema extensions;

-- Classificação de dados por sensibilidade. Determina onde o dado pode ser
-- processado (worker local vs. core) e o que pode ir a um LLM externo.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'data_sensitivity') then
    create type public.data_sensitivity as enum (
      'public',    -- sem restrição
      'internal',  -- uso interno do sistema
      'sensitive', -- dado pessoal; processamento preferencial no worker local
      'secret'     -- segredo/credencial; nunca enviado a LLM externo
    );
  end if;
end$$;

-- Ator que originou uma ação registrada no audit log.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'actor_kind') then
    create type public.actor_kind as enum ('user', 'core', 'worker', 'agent');
  end if;
end$$;

-- Trigger genérico para manter updated_at.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
