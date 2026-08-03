"use server";

import { revalidatePath } from "next/cache";

import { processPayment } from "@/lib/payment";
import { PLAN_LABEL, type PlanId } from "@/lib/plans";
import { requireOwner, requireSuperadmin } from "@/lib/queries/auth";
import {
  changeTenantPlan,
  deleteDeliveryZone,
  getSafeDeliverySettings,
  updateSafeDeliverySettings,
  updateTenantBrand,
  upsertDeliveryZone,
} from "@/lib/queries/settings";
import {
  createChangeRequest,
  createTenantWithOwner,
  sendMessage,
  setTenantStatus,
  updateChangeRequestStatus,
} from "@/lib/queries/comms";
import type { Enums } from "@/types/database";

export type SettingsState = { error?: string; success?: string };

export async function saveBrandAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { membership } = await requireOwner();
  const result = await updateTenantBrand(membership.tenant_id, {
    name: String(formData.get("name") ?? ""),
    tagline: String(formData.get("tagline") ?? "") || null,
    accent_color: String(formData.get("accent_color") ?? "#0E5C4A"),
    city: String(formData.get("city") ?? "Астана"),
    phone: String(formData.get("phone") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? "") || null,
    instagram: String(formData.get("instagram") ?? "") || null,
  });
  if ("error" in result) return { error: result.error };
  revalidatePath("/admin/settings");
  return { success: "Сохранено" };
}

export async function saveDeliveryAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { membership } = await requireOwner();
  const result = await updateSafeDeliverySettings(membership.tenant_id, {
    delivery_enabled: formData.get("delivery_enabled") === "on",
    pickup_enabled: formData.get("pickup_enabled") === "on",
    payment_online: formData.get("payment_online") === "on",
    min_order: Number.parseInt(String(formData.get("min_order") ?? "0"), 10) || 0,
  });
  if ("error" in result) return { error: result.error };
  revalidatePath("/admin/settings");
  return { success: "Доставка сохранена" };
}

export async function saveZoneAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { membership } = await requireOwner();
  const freeRaw = String(formData.get("free_from") ?? "").trim();
  const result = await upsertDeliveryZone({
    tenantId: membership.tenant_id,
    name: String(formData.get("name") ?? ""),
    cost: Number.parseInt(String(formData.get("cost") ?? "0"), 10) || 0,
    free_from: freeRaw ? Number.parseInt(freeRaw, 10) || 0 : null,
    eta_text: String(formData.get("eta_text") ?? "") || null,
    is_active: formData.get("is_active") === "on",
    sort_order:
      Number.parseInt(String(formData.get("sort_order") ?? "0"), 10) || 0,
  });
  if ("error" in result) return { error: result.error };
  revalidatePath("/admin/settings");
  return { success: "Зона сохранена" };
}

export async function deleteZoneAction(zoneId: string) {
  const { membership } = await requireOwner();
  const result = await deleteDeliveryZone(membership.tenant_id, zoneId);
  revalidatePath("/admin/settings");
  return result;
}

export async function upgradePlanAction(plan: PlanId) {
  const { membership } = await requireOwner();
  const prices: Record<PlanId, number> = {
    basic: 9900,
    standard: 19900,
    pro: 39900,
  };

  const pay = await processPayment({
    amount: prices[plan],
    description: `Подписка ${PLAN_LABEL[plan]}`,
    metadata: { tenantId: membership.tenant_id, plan },
  });
  if (!pay.ok) return { error: pay.error };

  const result = await changeTenantPlan(membership.tenant_id, plan);
  if ("error" in result) return { error: result.error };
  revalidatePath("/admin/plan");
  revalidatePath("/admin");
  return { success: `Тариф ${PLAN_LABEL[plan]} активирован (демо-оплата)` };
}

export async function createRequestAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { membership } = await requireOwner();
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { error: "Напишите, что нужно изменить" };
  const result = await createChangeRequest(membership.tenant_id, text);
  if ("error" in result) return { error: result.error };
  revalidatePath("/admin/requests");
  return { success: "Заявка отправлена" };
}

export async function sendOwnerMessageAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { membership } = await requireOwner();
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { error: "Пустое сообщение" };
  const result = await sendMessage({
    tenantId: membership.tenant_id,
    fromRole: "owner",
    text,
  });
  if ("error" in result) return { error: result.error };
  revalidatePath("/admin/requests");
  return { success: "Отправлено" };
}

export async function sendAdminMessageAction(
  tenantId: string,
  text: string,
) {
  await requireSuperadmin();
  const result = await sendMessage({
    tenantId,
    fromRole: "superadmin",
    text,
  });
  revalidatePath("/root/messages");
  return result;
}

export async function updateRequestStatusAction(
  id: string,
  status: Enums<"change_request_status">,
) {
  await requireSuperadmin();
  const result = await updateChangeRequestStatus(id, status);
  revalidatePath("/root/messages");
  return result;
}

export async function createShopAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  await requireSuperadmin();
  const result = await createTenantWithOwner({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    ownerEmail: String(formData.get("owner_email") ?? ""),
    ownerPassword: String(formData.get("owner_password") ?? ""),
    plan: (String(formData.get("plan") ?? "basic") as PlanId) || "basic",
  });
  if ("error" in result) return { error: result.error };
  revalidatePath("/root");
  return { success: "Магазин создан" };
}

export async function setShopStatusAction(
  tenantId: string,
  status: Enums<"tenant_status">,
) {
  await requireSuperadmin();
  const result = await setTenantStatus(tenantId, status);
  revalidatePath("/root");
  return result;
}

export async function setShopPlanAction(tenantId: string, plan: PlanId) {
  await requireSuperadmin();
  const result = await changeTenantPlan(tenantId, plan);
  revalidatePath("/root");
  return result;
}

export async function loadDeliverySettings() {
  const { membership } = await requireOwner();
  return getSafeDeliverySettings(membership.tenant_id);
}
