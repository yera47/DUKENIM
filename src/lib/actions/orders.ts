"use server";

import { revalidatePath } from "next/cache";

import { processPayment } from "@/lib/payment";
import { planHas } from "@/lib/plans";
import { requireOwner } from "@/lib/queries/auth";
import {
  createOfflineSale,
  createOnlineOrder,
  markOrderPaid,
  updateOrderStatus,
} from "@/lib/queries/orders";
import { getActiveTenantBySlug } from "@/lib/queries/tenants";
import type { Enums } from "@/types/database";

export async function placeOrderAction(input: {
  tenantId: string;
  tenantSlug: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: "pickup" | "courier";
  deliveryAddress: string | null;
  deliveryCost: number;
  items: Array<{ variantId: string; qty: number }>;
  payOnline?: boolean;
}) {
  const tenant = await getActiveTenantBySlug(input.tenantSlug);
  if (!tenant || tenant.id !== input.tenantId) {
    return { error: "Магазин не найден" };
  }

  const wantPay = Boolean(input.payOnline);
  if (wantPay && !planHas(tenant.plan, "onlinePayments")) {
    return { error: "Онлайн-оплата доступна на тарифе Standard/Pro" };
  }

  const result = await createOnlineOrder({
    ...input,
    payOnline: wantPay,
  });

  if (!result.ok) return { error: result.error };

  if (wantPay) {
    const pay = await processPayment({
      amount: result.total,
      description: `Заказ #${result.orderNumber}`,
      metadata: { orderId: result.orderId },
    });
    if (!pay.ok) return { error: pay.error };
    await markOrderPaid(input.tenantId, result.orderId);
  }

  return {
    orderNumber: result.orderNumber,
    whatsappUrl: result.whatsappUrl,
    total: result.total,
  };
}

export async function changeOrderStatusAction(
  orderId: string,
  status: Enums<"order_status">,
) {
  const { membership } = await requireOwner();
  const result = await updateOrderStatus(
    membership.tenant_id,
    orderId,
    status,
  );
  revalidatePath("/admin/orders");
  return result;
}

export async function sellOfflineAction(input: {
  variantId: string;
  qty: number;
}) {
  const { user, membership } = await requireOwner();
  if (!planHas(membership.tenant.plan, "offlineSell")) {
    return { ok: false as const, error: "Доступно на тарифе Standard/Pro" };
  }
  const result = await createOfflineSale({
    tenantId: membership.tenant_id,
    staffId: user.id,
    variantId: input.variantId,
    qty: input.qty,
  });
  revalidatePath("/admin/sell");
  revalidatePath("/admin/stock");
  revalidatePath("/admin");
  return result;
}
