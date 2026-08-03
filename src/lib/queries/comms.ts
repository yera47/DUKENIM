import { createClient } from "@/lib/supabase/server";
import type { Enums, Tables } from "@/types/database";

export type ChangeRequest = Tables<"change_requests">;
export type Message = Tables<"messages">;

export async function listChangeRequests(tenantId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("change_requests")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function createChangeRequest(
  tenantId: string,
  text: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("change_requests").insert({
    tenant_id: tenantId,
    text: text.trim(),
    status: "new",
  });
  if (error) return { error: "Не удалось отправить заявку" };
  return { ok: true };
}

export async function listAllChangeRequests(): Promise<
  Array<
    ChangeRequest & {
      tenants: { name: string; slug: string } | null;
    }
  >
> {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("change_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (!requests?.length) return [];

  const tenantIds = [...new Set(requests.map((r) => r.tenant_id))];
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .in("id", tenantIds);

  const byId = new Map((tenants ?? []).map((t) => [t.id, t]));
  return requests.map((r) => {
    const t = byId.get(r.tenant_id);
    return {
      ...r,
      tenants: t ? { name: t.name, slug: t.slug } : null,
    };
  });
}

export async function updateChangeRequestStatus(
  id: string,
  status: Enums<"change_request_status">,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("change_requests")
    .update({ status })
    .eq("id", id);
  if (error) return { error: "Не удалось обновить статус" };
  return { ok: true };
}

export async function listMessages(tenantId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function sendMessage(input: {
  tenantId: string;
  fromRole: Enums<"message_from_role">;
  text: string;
}): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    tenant_id: input.tenantId,
    from_role: input.fromRole,
    text: input.text.trim(),
  });
  if (error) return { error: "Не удалось отправить сообщение" };
  return { ok: true };
}

export async function createTenantWithOwner(input: {
  name: string;
  slug: string;
  phone: string;
  ownerEmail: string;
  ownerPassword: string;
  plan?: Enums<"tenant_plan">;
}): Promise<{ ok: true; tenantId: string } | { error: string }> {
  const { createServiceClient } = await import("@/lib/supabase/service");
  const service = createServiceClient();

  const { data: user, error: uErr } = await service.auth.admin.createUser({
    email: input.ownerEmail.trim(),
    password: input.ownerPassword,
    email_confirm: true,
  });
  if (uErr || !user.user) {
    return { error: uErr?.message ?? "Не удалось создать владельца" };
  }

  const { data: tenant, error: tErr } = await service
    .from("tenants")
    .insert({
      name: input.name.trim(),
      slug: input.slug.trim().toLowerCase(),
      phone: input.phone.trim(),
      plan: input.plan ?? "basic",
      status: "active",
    })
    .select("id")
    .single();

  if (tErr || !tenant) {
    return { error: "Не удалось создать магазин" };
  }

  await service.from("tenant_settings").insert({ tenant_id: tenant.id });
  await service.from("profiles").upsert({
    user_id: user.user.id,
    role: "owner",
  });
  await service.from("tenant_users").insert({
    tenant_id: tenant.id,
    user_id: user.user.id,
    role: "owner",
  });
  await service.from("subscriptions").insert({
    tenant_id: tenant.id,
    plan: input.plan ?? "basic",
    status: "active",
  });

  return { ok: true, tenantId: tenant.id };
}

export async function setTenantStatus(
  tenantId: string,
  status: Enums<"tenant_status">,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({ status })
    .eq("id", tenantId);
  if (error) return { error: "Не удалось обновить статус" };
  return { ok: true };
}
