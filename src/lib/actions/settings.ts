"use server";

import { revalidatePath } from "next/cache";

import { requireAdminMembership } from "@/lib/actions/auth";
import {
  deleteDeliveryZone,
  updateBrandSettings,
  updateSafeDeliverySettings,
  uploadBrandLogo,
  upsertDeliveryZone,
} from "@/lib/queries/settings";

export type SettingsActionState = {
  error?: string;
  success?: string;
};

export async function saveBrandAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const membership = await requireAdminMembership();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name || !phone) {
    return { error: "Название и телефон обязательны" };
  }

  const result = await updateBrandSettings(membership.tenant_id, {
    name,
    tagline: String(formData.get("tagline") ?? "") || null,
    logo_url: String(formData.get("logo_url") ?? "") || null,
    accent_color: String(formData.get("accent_color") ?? "#1F5F4E"),
    city: String(formData.get("city") ?? "Астана"),
    address: String(formData.get("address") ?? "") || null,
    phone,
    whatsapp: String(formData.get("whatsapp") ?? "") || null,
    instagram: String(formData.get("instagram") ?? "") || null,
  });

  if ("error" in result) return { error: result.error };

  revalidatePath("/admin/settings");
  revalidatePath(`/s/${membership.tenant.slug}`);
  return { success: "Бренд сохранён" };
}

export async function saveDeliverySettingsAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const membership = await requireAdminMembership();
  const result = await updateSafeDeliverySettings(membership.tenant_id, {
    delivery_enabled: formData.get("delivery_enabled") === "on",
    pickup_enabled: formData.get("pickup_enabled") === "on",
    delivery_note: String(formData.get("delivery_note") ?? "") || null,
    min_order: Number.parseInt(String(formData.get("min_order") ?? "0"), 10) || 0,
  });

  if ("error" in result) return { error: result.error };
  revalidatePath("/admin/settings");
  return { success: "Доставка сохранена" };
}

export async function saveZoneAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const membership = await requireAdminMembership();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Укажите название зоны" };

  const freeFromRaw = String(formData.get("free_from") ?? "").trim();
  const result = await upsertDeliveryZone({
    tenantId: membership.tenant_id,
    id: String(formData.get("id") ?? "") || undefined,
    name,
    cost: Number.parseInt(String(formData.get("cost") ?? "0"), 10) || 0,
    free_from: freeFromRaw
      ? Number.parseInt(freeFromRaw, 10) || 0
      : null,
    eta_text: String(formData.get("eta_text") ?? "") || null,
    is_active: formData.get("is_active") === "on",
    sort_order:
      Number.parseInt(String(formData.get("sort_order") ?? "0"), 10) || 0,
  });

  if ("error" in result) return { error: result.error };
  revalidatePath("/admin/settings");
  return { success: "Зона сохранена" };
}

export async function deleteZoneAction(
  zoneId: string,
): Promise<SettingsActionState> {
  const membership = await requireAdminMembership();
  const result = await deleteDeliveryZone(membership.tenant_id, zoneId);
  if ("error" in result) return { error: result.error };
  revalidatePath("/admin/settings");
  return { success: "Зона удалена" };
}

export async function uploadLogoAction(
  formData: FormData,
): Promise<{ url: string } | { error: string }> {
  const membership = await requireAdminMembership();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Выберите файл" };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "Логотип больше 5 МБ" };
  }
  return uploadBrandLogo(membership.tenant_id, file);
}
