-- ELIAS — Hardening de funções apontado pelo linter de segurança do Supabase.
-- (set_updated_at já é criada com search_path fixo na 0001; handle_new_user já
-- tem o revoke na 0002. Esta migration existe para bancos criados antes desses
-- ajustes serem incorporados às migrations anteriores — idempotente.)

alter function public.set_updated_at() set search_path = '';
revoke execute on function public.handle_new_user() from public, anon, authenticated;
