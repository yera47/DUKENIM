import { createClient } from "@/lib/supabase/server";
import type { Enums, Tables } from "@/types/database";

export type SafeDeliverySettings = {
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  payment_online: boolean;
  min_order: number;
};

export type AdminDeliveryZone = Pick<
  Tables<"delivery_zones">,
  "id" | "name" | "cost" | "free_from" | "eta_text" | "is_active" | "sort_order"
>;

export async function getSafeDeliverySettings(
  tenantId: string,
): Promise<SafeDeliverySettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenant_settings")
    .select("delivery_enabled, pickup_enabled, payment_online, min_order")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  return {
    delivery_enabled: data?.delivery_enabled ?? true,
    pickup_enabled: data?.pickup_enabled ?? true,
    payment_online: data?.payment_online ?? false,
    min_order: data?.min_order ?? 0,
  };
}

export async function updateSafeDeliverySettings(
  tenantId: string,
  input: SafeDeliverySettings,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tenant_settings")
    .update({
      delivery_enabled: input.delivery_enabled,
      pickup_enabled: input.pickup_enabled,
      payment_online: input.payment_online,
      min_order: Math.max(0, Math.round(input.min_order)),
    })
    .eq("tenant_id", tenantId);
  if (error) return { error: "Не удалось сохранить настройки" };
  return { ok: true };
}

export async function listAdminDeliveryZones(
  tenantId: string,
): Promise<AdminDeliveryZone[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("delivery_zones")
    .select("id, name, cost, free_from, eta_text, is_active, sort_order")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function upsertDeliveryZone(input: {
  tenantId: string;
  id?: string;
  name: string;
  cost: number;
  free_from: number | null;
  eta_text: string | null;
  is_active: boolean;
  sort_order: number;
}): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const payload = {
    tenant_id: input.tenantId,
    name: input.name.trim(),
    cost: Math.max(0, Math.round(input.cost)),
    free_from:
      input.free_from == null ? null : Math.max(0, Math.round(input.free_from)),
    eta_text: input.eta_text?.trim() || null,
    is_active: input.is_active,
    sort_order: input.sort_order,
  };

  if (input.id) {
    const { error } = await supabase
      .from("delivery_zones")
      .update(payload)
      .eq("id", input.id)
      .eq("tenant_id", input.tenantId);
    if (error) return { error: "Не удалось обновить зону" };
    return { ok: true };
  }

  const { error } = await supabase.from("delivery_zones").insert(payload);
  if (error) return { error: "Не удалось добавить зону" };
  return { ok: true };
}

export async function deleteDeliveryZone(
  tenantId: string,
  zoneId: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("delivery_zones")
    .delete()
    .eq("id", zoneId)
    .eq("tenant_id", tenantId);
  if (error) return { error: "Не удалось удалить зону" };
  return { ok: true };
}

export async function updateTenantBrand(
  tenantId: string,
  input: {
    name: string;
    tagline: string | null;
    accent_color: string;
    city: string;
    phone: string;
    whatsapp: string | null;
    instagram: string | null;
  },
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({
      name: input.name.trim(),
      tagline: input.tagline?.trim() || null,
      accent_color: input.accent_color.trim() || "#0E5C4A",
      city: input.city.trim() || "Астана",
      phone: input.phone.trim(),
      whatsapp: input.whatsapp?.trim() || null,
      instagram: input.instagram?.trim() || null,
    })
    .eq("id", tenantId);
  if (error) return { error: "Не удалось сохранить бренд" };
  return { ok: true };
}

export async function changeTenantPlan(
  tenantId: string,
  plan: Enums<"tenant_plan">,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({ plan })
    .eq("id", tenantId);
  if (error) return { error: "Не удалось сменить тариф" };

  await supabase.from("subscriptions").insert({
    tenant_id: tenantId,
    plan,
    status: "active",
    current_period_end: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString(),
  });

  return { ok: true };
}
