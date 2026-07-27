import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type BrandSettings = Pick<
  Tables<"tenants">,
  | "id"
  | "slug"
  | "name"
  | "tagline"
  | "logo_url"
  | "accent_color"
  | "city"
  | "address"
  | "phone"
  | "whatsapp"
  | "instagram"
>;

/** Безопасные поля delivery — без merchant_key / merchant_id / payment secrets. */
export type SafeDeliverySettings = {
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  delivery_note: string | null;
  min_order: number;
};

export type AdminDeliveryZone = Pick<
  Tables<"delivery_zones">,
  "id" | "name" | "cost" | "free_from" | "eta_text" | "is_active" | "sort_order"
>;

export async function getBrandSettings(
  tenantId: string,
): Promise<BrandSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select(
      "id, slug, name, tagline, logo_url, accent_color, city, address, phone, whatsapp, instagram",
    )
    .eq("id", tenantId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function updateBrandSettings(
  tenantId: string,
  input: {
    name: string;
    tagline: string | null;
    logo_url: string | null;
    accent_color: string;
    city: string;
    address: string | null;
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
      logo_url: input.logo_url?.trim() || null,
      accent_color: input.accent_color.trim() || "#1F5F4E",
      city: input.city.trim() || "Астана",
      address: input.address?.trim() || null,
      phone: input.phone.trim(),
      whatsapp: input.whatsapp?.trim() || null,
      instagram: input.instagram?.trim() || null,
    })
    .eq("id", tenantId);

  if (error) return { error: "Не удалось сохранить бренд" };
  return { ok: true };
}

export async function getSafeDeliverySettings(
  tenantId: string,
): Promise<SafeDeliverySettings> {
  const supabase = await createClient();
  // Явно только безопасные колонки — merchant_key не читаем
  const { data, error } = await supabase
    .from("tenant_settings")
    .select("delivery_enabled, pickup_enabled, delivery_note, min_order")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error || !data) {
    return {
      delivery_enabled: true,
      pickup_enabled: true,
      delivery_note: null,
      min_order: 0,
    };
  }

  return {
    delivery_enabled: data.delivery_enabled,
    pickup_enabled: data.pickup_enabled,
    delivery_note: data.delivery_note,
    min_order: data.min_order,
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
      delivery_note: input.delivery_note?.trim() || null,
      min_order: Math.max(0, Math.round(input.min_order)),
    })
    .eq("tenant_id", tenantId);

  if (error) return { error: "Не удалось сохранить настройки доставки" };
  return { ok: true };
}

export async function listAdminDeliveryZones(
  tenantId: string,
): Promise<AdminDeliveryZone[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("id, name, cost, free_from, eta_text, is_active, sort_order")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data;
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

export async function uploadBrandLogo(
  tenantId: string,
  file: File,
): Promise<{ url: string } | { error: string }> {
  const { createServiceClient } = await import("@/lib/supabase/service");
  const supabase = createServiceClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${tenantId}/brand/logo-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/png",
    });

  if (error) return { error: "Не удалось загрузить логотип" };

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return { url: data.publicUrl };
}
