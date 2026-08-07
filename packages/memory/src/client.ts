import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "@elias/shared";
import type { Database } from "./database.types.js";

export type EliasSupabaseClient = SupabaseClient<Database>;

/**
 * Cliente Supabase do core, autenticado com a service_role key.
 *
 * ATENÇÃO: a service_role IGNORA RLS. Toda consulta feita por este cliente
 * DEVE filtrar por user_id explicitamente (ADR-0005). Este cliente vive apenas
 * no core/worker — nunca no cliente/navegador (Princípio 3).
 */
export function createServiceClient(
  url = requireEnv("SUPABASE_URL"),
  serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
): EliasSupabaseClient {
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
