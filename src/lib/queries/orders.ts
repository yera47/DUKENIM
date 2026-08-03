import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Enums, Tables } from "@/types/database";

export type CreateOrderInput = {
  tenantId: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: "pickup" | "courier";
  deliveryAddress: string | null;
  deliveryCost: number;
  items: Array<{ variantId: string; qty: number }>;
  payOnline?: boolean;
};

export type CreateOrderResult =
  | {
      ok: true;
      orderId: string;
      orderNumber: number;
      total: number;
      whatsappUrl: string | null;
      paymentPending?: boolean;
    }
  | { ok: false; error: string };

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function createOnlineOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const service = createServiceClient();

  if (!input.items.length) return { ok: false, error: "Корзина пуста" };

  const variantIds = input.items.map((i) => i.variantId);
  const { data: variants, error: vErr } = await service
    .from("product_variants")
    .select("id, stock_qty, is_active, product_id, products(title, price, is_active)")
    .eq("tenant_id", input.tenantId)
    .in("id", variantIds);

  if (vErr || !variants?.length) {
    return { ok: false, error: "Товары не найдены" };
  }

  type VRow = {
    id: string;
    stock_qty: number;
    is_active: boolean;
    product_id: string;
    products:
      | { title: string; price: number; is_active: boolean }
      | { title: string; price: number; is_active: boolean }[]
      | null;
  };

  const byId = new Map((variants as unknown as VRow[]).map((v) => [v.id, v]));
  let subtotal = 0;
  const lineItems: Array<{
    variant_id: string;
    title_snapshot: string;
    price_snapshot: number;
    qty: number;
  }> = [];

  for (const item of input.items) {
    const variant = byId.get(item.variantId);
    const productRaw = variant?.products;
    const product = Array.isArray(productRaw) ? productRaw[0] : productRaw;
    if (!variant || !product || !variant.is_active || !product.is_active) {
      return { ok: false, error: "Товар недоступен" };
    }
    if (variant.stock_qty < item.qty) {
      return { ok: false, error: `Недостаточно остатка: ${product.title}` };
    }
    subtotal += product.price * item.qty;
    lineItems.push({
      variant_id: variant.id,
      title_snapshot: product.title,
      price_snapshot: product.price,
      qty: item.qty,
    });
  }

  const total = subtotal + Math.max(0, input.deliveryCost);
  const phone = normalizePhone(input.customerPhone);
  if (phone.length < 10) return { ok: false, error: "Некорректный телефон" };

  const { data: existingCustomer } = await service
    .from("customers")
    .select("id, orders_count, total_spent")
    .eq("tenant_id", input.tenantId)
    .eq("phone", phone)
    .maybeSingle();

  let customerId = existingCustomer?.id;
  if (!customerId) {
    const { data: created, error } = await service
      .from("customers")
      .insert({
        tenant_id: input.tenantId,
        phone,
        name: input.customerName.trim(),
        first_order: new Date().toISOString(),
        last_order: new Date().toISOString(),
        orders_count: 0,
        total_spent: 0,
      })
      .select("id")
      .single();
    if (error || !created) return { ok: false, error: "Не удалось сохранить клиента" };
    customerId = created.id;
  } else {
    await service
      .from("customers")
      .update({
        name: input.customerName.trim(),
        last_order: new Date().toISOString(),
      })
      .eq("id", customerId);
  }

  const paymentStatus: Enums<"payment_status"> = input.payOnline
    ? "pending"
    : "pending";

  const { data: order, error: oErr } = await service
    .from("orders")
    .insert({
      tenant_id: input.tenantId,
      customer_id: customerId,
      source: "online",
      status: "new",
      delivery_method: input.deliveryMethod,
      delivery_address: input.deliveryAddress,
      delivery_cost: Math.max(0, input.deliveryCost),
      subtotal,
      total,
      payment_method: input.payOnline ? "online" : "kaspi",
      payment_status: paymentStatus,
    })
    .select("id, order_number")
    .single();

  if (oErr || !order) return { ok: false, error: "Не удалось создать заказ" };

  const { error: itemsErr } = await service.from("order_items").insert(
    lineItems.map((line) => ({
      order_id: order.id,
      tenant_id: input.tenantId,
      variant_id: line.variant_id,
      title_snapshot: line.title_snapshot,
      price_snapshot: line.price_snapshot,
      qty: line.qty,
    })),
  );
  if (itemsErr) return { ok: false, error: "Не удалось сохранить позиции" };

  const { error: stockErr } = await service.from("stock_movements").insert(
    lineItems.map((line) => ({
      tenant_id: input.tenantId,
      variant_id: line.variant_id,
      delta: -line.qty,
      reason: "sale" as const,
      order_id: order.id,
    })),
  );
  if (stockErr) return { ok: false, error: "Не удалось списать остаток" };

  await service
    .from("customers")
    .update({
      orders_count: (existingCustomer?.orders_count ?? 0) + 1,
      total_spent: (existingCustomer?.total_spent ?? 0) + total,
      last_order: new Date().toISOString(),
    })
    .eq("id", customerId);

  const { data: tenant } = await service
    .from("tenants")
    .select("whatsapp, name")
    .eq("id", input.tenantId)
    .maybeSingle();

  let whatsappUrl: string | null = null;
  if (tenant?.whatsapp) {
    const text = encodeURIComponent(
      `Заказ #${order.order_number} в ${tenant.name}\nСумма: ${total} ₸\n${input.customerName}, ${phone}`,
    );
    whatsappUrl = `https://wa.me/${tenant.whatsapp.replace(/\D/g, "")}?text=${text}`;
  }

  return {
    ok: true,
    orderId: order.id,
    orderNumber: order.order_number ?? 0,
    total,
    whatsappUrl,
    paymentPending: Boolean(input.payOnline),
  };
}

export async function createOfflineSale(input: {
  tenantId: string;
  staffId: string;
  variantId: string;
  qty: number;
}): Promise<
  | { ok: true; orderNumber: number; total: number }
  | { ok: false; error: string }
> {
  const service = createServiceClient();
  const { data: variant } = await service
    .from("product_variants")
    .select("id, stock_qty, is_active, products(title, price, is_active)")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.variantId)
    .maybeSingle();

  const productRaw = variant?.products as
    | { title: string; price: number; is_active: boolean }
    | { title: string; price: number; is_active: boolean }[]
    | null
    | undefined;
  const product = Array.isArray(productRaw) ? productRaw[0] : productRaw;

  if (!variant || !product || !variant.is_active || !product.is_active) {
    return { ok: false, error: "Товар недоступен" };
  }
  if (variant.stock_qty < input.qty) {
    return { ok: false, error: "Недостаточно остатка" };
  }

  const total = product.price * input.qty;
  const { data: order, error } = await service
    .from("orders")
    .insert({
      tenant_id: input.tenantId,
      source: "offline",
      status: "done",
      delivery_method: "pickup",
      delivery_cost: 0,
      subtotal: total,
      total,
      payment_method: "cash",
      payment_status: "paid",
      staff_id: input.staffId,
    })
    .select("id, order_number")
    .single();
  if (error || !order) return { ok: false, error: "Не удалось создать продажу" };

  await service.from("order_items").insert({
    order_id: order.id,
    tenant_id: input.tenantId,
    variant_id: variant.id,
    title_snapshot: product.title,
    price_snapshot: product.price,
    qty: input.qty,
  });

  await service.from("stock_movements").insert({
    tenant_id: input.tenantId,
    variant_id: variant.id,
    delta: -input.qty,
    reason: "sale",
    order_id: order.id,
    staff_id: input.staffId,
  });

  return { ok: true, orderNumber: order.order_number ?? 0, total };
}

export type AdminOrder = Tables<"orders"> & {
  customers: Pick<Tables<"customers">, "name" | "phone"> | null;
  order_items: Array<
    Pick<
      Tables<"order_items">,
      "id" | "title_snapshot" | "price_snapshot" | "qty"
    >
  >;
};

export async function listOrdersForTenant(
  tenantId: string,
): Promise<AdminOrder[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "*, customers(name, phone), order_items(id, title_snapshot, price_snapshot, qty)",
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data as AdminOrder[]) ?? [];
}

export async function getOrderForTenant(
  tenantId: string,
  orderId: string,
): Promise<AdminOrder | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "*, customers(name, phone), order_items(id, title_snapshot, price_snapshot, qty)",
    )
    .eq("tenant_id", tenantId)
    .eq("id", orderId)
    .maybeSingle();
  return (data as AdminOrder) ?? null;
}

export async function getPublicOrderByNumber(
  tenantId: string,
  orderNumber: number,
) {
  const service = createServiceClient();
  const { data } = await service
    .from("orders")
    .select(
      "id, order_number, status, total, subtotal, delivery_cost, payment_status, created_at, order_items(title_snapshot, price_snapshot, qty)",
    )
    .eq("tenant_id", tenantId)
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!data) return null;

  return data as {
    id: string;
    order_number: number;
    status: Enums<"order_status">;
    total: number;
    subtotal: number;
    delivery_cost: number;
    payment_status: Enums<"payment_status">;
    created_at: string;
    order_items: Array<{
      title_snapshot: string;
      price_snapshot: number;
      qty: number;
    }>;
  };
}

export async function updateOrderStatus(
  tenantId: string,
  orderId: string,
  status: Enums<"order_status">,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .eq("tenant_id", tenantId);
  if (error) return { error: "Не удалось обновить статус" };
  return { ok: true };
}

export async function markOrderPaid(
  tenantId: string,
  orderId: string,
): Promise<{ ok: true } | { error: string }> {
  const service = createServiceClient();
  const { error } = await service
    .from("orders")
    .update({ payment_status: "paid", payment_method: "online" })
    .eq("id", orderId)
    .eq("tenant_id", tenantId);
  if (error) return { error: "Не удалось отметить оплату" };
  return { ok: true };
}
