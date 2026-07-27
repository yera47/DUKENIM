import { createServiceClient } from "@/lib/supabase/service";
import type { Enums, Tables } from "@/types/database";

export type CheckoutItemInput = {
  variantId: string;
  qty: number;
};

export type CreateOrderInput = {
  tenantId: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: Enums<"delivery_method">;
  deliveryAddress?: string | null;
  deliveryComment?: string | null;
  deliveryCost: number;
  comment?: string | null;
  items: CheckoutItemInput[];
};

export type CreateOrderResult =
  | {
      ok: true;
      orderId: string;
      orderNumber: number;
      total: number;
      whatsappUrl: string | null;
    }
  | { ok: false; error: string };

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

export async function createOnlineOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const service = createServiceClient();

  if (!input.items.length) {
    return { ok: false, error: "Корзина пуста" };
  }

  const name = input.customerName.trim();
  const phone = normalizePhone(input.customerPhone);
  if (!name || phone.length < 10) {
    return { ok: false, error: "Укажите имя и корректный телефон" };
  }

  if (
    input.deliveryMethod === "courier" &&
    !input.deliveryAddress?.trim()
  ) {
    return { ok: false, error: "Укажите адрес доставки" };
  }

  const variantIds = input.items.map((item) => item.variantId);
  const { data: variants, error: variantsError } = await service
    .from("product_variants")
    .select(
      "id, stock_qty, price_delta, is_active, product:products!inner(id, title, price, is_active, tenant_id)",
    )
    .eq("tenant_id", input.tenantId)
    .in("id", variantIds);

  if (variantsError || !variants) {
    return { ok: false, error: "Не удалось проверить товары" };
  }

  type VariantRow = {
    id: string;
    stock_qty: number;
    price_delta: number;
    is_active: boolean;
    product: {
      id: string;
      title: string;
      price: number;
      is_active: boolean;
      tenant_id: string;
    };
  };

  const byId = new Map(
    (variants as unknown as VariantRow[]).map((row) => [row.id, row]),
  );

  const lines: Array<{
    variantId: string;
    qty: number;
    titleSnapshot: string;
    priceSnapshot: number;
  }> = [];

  let subtotal = 0;

  for (const item of input.items) {
    const variant = byId.get(item.variantId);
    if (!variant || !variant.is_active || !variant.product.is_active) {
      return { ok: false, error: "Один из товаров больше недоступен" };
    }
    if (variant.product.tenant_id !== input.tenantId) {
      return { ok: false, error: "Товар из другого магазина" };
    }
    if (item.qty <= 0) {
      return { ok: false, error: "Некорректное количество" };
    }
    if (variant.stock_qty < item.qty) {
      return {
        ok: false,
        error: `Недостаточно остатка: ${variant.product.title}`,
      };
    }

    const priceSnapshot = variant.product.price + variant.price_delta;
    lines.push({
      variantId: variant.id,
      qty: item.qty,
      titleSnapshot: variant.product.title,
      priceSnapshot,
    });
    subtotal += priceSnapshot * item.qty;
  }

  const deliveryCost = Math.max(0, Math.round(input.deliveryCost));
  const total = subtotal + deliveryCost;

  const { data: existingCustomer } = await service
    .from("customers")
    .select("id, orders_count, total_spent")
    .eq("tenant_id", input.tenantId)
    .eq("phone", phone)
    .maybeSingle();

  let customerId = existingCustomer?.id ?? null;

  if (existingCustomer) {
    await service
      .from("customers")
      .update({
        name,
        last_order: new Date().toISOString(),
      })
      .eq("id", existingCustomer.id);
  } else {
    const { data: createdCustomer, error: customerError } = await service
      .from("customers")
      .insert({
        tenant_id: input.tenantId,
        phone,
        name,
        first_order: new Date().toISOString(),
        last_order: new Date().toISOString(),
        orders_count: 0,
        total_spent: 0,
      })
      .select("id")
      .single();

    if (customerError || !createdCustomer) {
      return { ok: false, error: "Не удалось сохранить клиента" };
    }
    customerId = createdCustomer.id;
  }

  // order_number не передаём — BEFORE INSERT триггер set_order_number
  const { data: order, error: orderError } = await service
    .from("orders")
    .insert({
      tenant_id: input.tenantId,
      customer_id: customerId,
      source: "online",
      status: "new",
      delivery_method: input.deliveryMethod,
      delivery_address: input.deliveryAddress?.trim() || null,
      delivery_comment: input.deliveryComment?.trim() || null,
      delivery_cost: deliveryCost,
      subtotal,
      bonus_used: 0,
      bonus_earned: 0,
      total,
      payment_method: null,
      payment_status: "pending",
      comment: input.comment?.trim() || null,
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) {
    return { ok: false, error: "Не удалось создать заказ" };
  }

  const orderItems = lines.map((line) => ({
    order_id: order.id,
    tenant_id: input.tenantId,
    variant_id: line.variantId,
    title_snapshot: line.titleSnapshot,
    price_snapshot: line.priceSnapshot,
    qty: line.qty,
  }));

  const { error: itemsError } = await service
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    await service.from("orders").delete().eq("id", order.id);
    return { ok: false, error: "Не удалось сохранить позиции заказа" };
  }

  const movements = lines.map((line) => ({
    tenant_id: input.tenantId,
    variant_id: line.variantId,
    delta: -line.qty,
    reason: "sale" as const,
    order_id: order.id,
  }));

  const { error: stockError } = await service
    .from("stock_movements")
    .insert(movements);

  if (stockError) {
    await service.from("order_items").delete().eq("order_id", order.id);
    await service.from("orders").delete().eq("id", order.id);
    return { ok: false, error: "Не удалось списать остаток" };
  }

  if (customerId) {
    const prevCount = existingCustomer?.orders_count ?? 0;
    const prevSpent = existingCustomer?.total_spent ?? 0;
    await service
      .from("customers")
      .update({
        orders_count: prevCount + 1,
        total_spent: prevSpent + total,
        last_order: new Date().toISOString(),
        name,
      })
      .eq("id", customerId);
  }

  const { data: tenant } = await service
    .from("tenants")
    .select("name, whatsapp, phone")
    .eq("id", input.tenantId)
    .maybeSingle();

  const whatsappRaw = tenant?.whatsapp || tenant?.phone || null;
  const whatsappDigits = whatsappRaw
    ? whatsappRaw.replace(/\D/g, "")
    : null;

  const linesText = lines
    .map(
      (line) =>
        `• ${line.titleSnapshot} × ${line.qty} = ${line.priceSnapshot * line.qty} ₸`,
    )
    .join("\n");

  const message = [
    `Новый заказ #${order.order_number} — ${tenant?.name ?? "магазин"}`,
    `${name}, ${phone}`,
    input.deliveryMethod === "pickup" ? "Самовывоз" : "Курьер",
    input.deliveryAddress ? `Адрес: ${input.deliveryAddress}` : null,
    "",
    linesText,
    "",
    `Итого: ${total} ₸`,
  ]
    .filter(Boolean)
    .join("\n");

  const whatsappUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(message)}`
    : null;

  return {
    ok: true,
    orderId: order.id,
    orderNumber: order.order_number,
    total,
    whatsappUrl,
  };
}

export type AdminOrder = Tables<"orders"> & {
  order_items: Tables<"order_items">[];
  customers: Pick<Tables<"customers">, "id" | "name" | "phone"> | null;
};

export async function listOrdersForTenant(
  tenantId: string,
): Promise<AdminOrder[]> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "*, order_items(*), customers(id, name, phone)",
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as unknown as AdminOrder[];
}

export async function getOrderForTenant(
  tenantId: string,
  orderId: string,
): Promise<AdminOrder | null> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "*, order_items(*), customers(id, name, phone)",
    )
    .eq("tenant_id", tenantId)
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as AdminOrder;
}

export async function getPublicOrderByNumber(
  tenantId: string,
  orderNumber: number,
): Promise<
  | (Pick<
      Tables<"orders">,
      | "id"
      | "order_number"
      | "status"
      | "total"
      | "subtotal"
      | "delivery_cost"
      | "delivery_method"
      | "created_at"
    > & { order_items: Pick<Tables<"order_items">, "title_snapshot" | "price_snapshot" | "qty">[] })
  | null
> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("orders")
    .select(
      "id, order_number, status, total, subtotal, delivery_cost, delivery_method, created_at, order_items(title_snapshot, price_snapshot, qty)",
    )
    .eq("tenant_id", tenantId)
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function updateOrderStatus(
  tenantId: string,
  orderId: string,
  status: Enums<"order_status">,
): Promise<{ ok: true } | { error: string }> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("tenant_id", tenantId)
    .eq("id", orderId);

  if (error) return { error: "Не удалось сменить статус" };
  return { ok: true };
}
