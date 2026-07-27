import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Tables } from "@/types/database";

export const TEST_TENANT_ID = "00000000-0000-4000-8000-000000000001";

export type TenantMembership = {
  tenant_id: string;
  role: Tables<"tenant_users">["role"];
  tenant: Pick<
    Tables<"tenants">,
    "id" | "slug" | "name" | "accent_color" | "status"
  >;
};

export async function getCurrentUserMemberships(): Promise<TenantMembership[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: links, error: linksError } = await supabase
    .from("tenant_users")
    .select("tenant_id, role")
    .eq("user_id", user.id);

  if (linksError || !links || links.length === 0) return [];

  const tenantIds = links.map((link) => link.tenant_id);
  const { data: tenants, error: tenantsError } = await supabase
    .from("tenants")
    .select("id, slug, name, accent_color, status")
    .in("id", tenantIds);

  if (tenantsError || !tenants) return [];

  const tenantsById = new Map(tenants.map((tenant) => [tenant.id, tenant]));

  return links.flatMap((link) => {
    const tenant = tenantsById.get(link.tenant_id);
    if (!tenant) return [];
    return [
      {
        tenant_id: link.tenant_id,
        role: link.role,
        tenant,
      },
    ];
  });
}

export async function getPrimaryMembership(): Promise<TenantMembership | null> {
  const memberships = await getCurrentUserMemberships();
  return memberships[0] ?? null;
}

/**
 * Первый владелец тестового магазина: если у tenant ещё нет пользователей —
 * привязываем текущего через service role.
 */
export async function claimTestTenantOwnership(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const service = createServiceClient();

  const { count, error: countError } = await service
    .from("tenant_users")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", TEST_TENANT_ID);

  if (countError) {
    return { ok: false, error: "Не удалось проверить владельцев магазина" };
  }

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: "У магазина уже есть владелец. Попросите доступ у администратора.",
    };
  }

  const { error } = await service.from("tenant_users").insert({
    tenant_id: TEST_TENANT_ID,
    user_id: userId,
    role: "owner",
  });

  if (error) {
    return { ok: false, error: "Не удалось привязать аккаунт к магазину" };
  }

  return { ok: true };
}
