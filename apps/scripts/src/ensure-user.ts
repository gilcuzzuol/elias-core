/**
 * Provisiona (ou encontra) o usuário real do Supabase Auth usado pelo CLI
 * local do ELIAS (ADR-0005: mesmo com um único usuário ativo, é um usuário
 * real, não um placeholder).
 *
 * ATENÇÃO — dado pessoal real (não sintético): roda apenas com confirmação
 * explícita do dono do e-mail informado.
 *
 * Uso:
 *   pnpm --filter @elias/scripts build
 *   ELIAS_USER_EMAIL=voce@exemplo.com pnpm --filter @elias/scripts ensure-user
 *
 * Imprime o user_id resultante — cole em ELIAS_USER_ID no seu .env.
 */
import { createServiceClient, type EliasSupabaseClient } from "@elias/memory";
import { requireEnv } from "@elias/shared";

async function findUserByEmail(
  client: EliasSupabaseClient,
  email: string,
): Promise<string | null> {
  const perPage = 200;
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Falha ao listar usuários: ${error.message}`);
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found.id;
    if (data.users.length < perPage) break;
  }
  return null;
}

async function main(): Promise<void> {
  const email = requireEnv("ELIAS_USER_EMAIL");
  const client = createServiceClient();

  console.log(`\n[1/2] Procurando usuário existente: ${email}`);
  const existingId = await findUserByEmail(client, email);
  if (existingId !== null) {
    console.log(`      já existe. user_id: ${existingId}`);
    console.log(`\nCole no .env: ELIAS_USER_ID=${existingId}\n`);
    return;
  }

  console.log("      não encontrado. Criando...");
  const created = await client.auth.admin.createUser({ email, email_confirm: true });
  if (created.error || !created.data.user) {
    throw new Error(`Falha ao criar usuário: ${created.error?.message ?? "sem retorno"}`);
  }

  console.log(`\n[2/2] Usuário criado. user_id: ${created.data.user.id}`);
  console.log(`\nCole no .env: ELIAS_USER_ID=${created.data.user.id}\n`);
}

main().catch((error: unknown) => {
  console.error(`\n❌ Falha: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
