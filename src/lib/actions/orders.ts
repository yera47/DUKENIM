"use server";

import { revalidatePath } from "next/cache";

import { requireAdminMembership } from "@/lib/actions/auth";
import {
  createOnlineOrder,
  updateOrderStatus,
  type CreateOrderInput,
} from "@/lib/queries/orders";
import type { Enums } from "@/types/database";

export type CheckoutActionState = {
  error?: string;
  orderNumber?: number;
  whatsappUrl?: string | null;
};

export async function placeOrderAction(
  input: CreateOrderInput & { tenantSlug: string },
): Promise<CheckoutActionState> {
  const result = await createOnlineOrder(input);
  if (!result.ok) {
    return { error: result.error };
  }

  return {
    orderNumber: result.orderNumber,
    whatsappUrl: result.whatsappUrl,
  };
}

export async function changeOrderStatusAction(
  orderId: string,
  status: Enums<"order_status">,
): Promise<{ ok: true } | { error: string }> {
  const membership = await requireAdminMembership();
  const result = await updateOrderStatus(
    membership.tenant_id,
    orderId,
    status,
  );
  if ("error" in result) return result;
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}
