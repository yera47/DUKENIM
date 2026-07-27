"use server";

import { revalidatePath } from "next/cache";

import { requireAdminMembership } from "@/lib/actions/auth";
import {
  createOfflineSale,
  createOnlineOrder,
  updateOrderStatus,
  type CreateOrderInput,
} from "@/lib/queries/orders";
import { createClient } from "@/lib/supabase/server";
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

export async function sellOfflineAction(input: {
  variantId: string;
  qty?: number;
}): Promise<
  | { ok: true; orderNumber: number; total: number }
  | { ok: false; error: string }
> {
  const membership = await requireAdminMembership();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Нужно войти" };
  }

  const result = await createOfflineSale({
    tenantId: membership.tenant_id,
    variantId: input.variantId,
    qty: input.qty ?? 1,
    staffId: user.id,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/sell");
  revalidatePath("/admin/products");

  return {
    ok: true,
    orderNumber: result.orderNumber,
    total: result.total,
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
