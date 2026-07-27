import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { requireAdminMembership } from "@/lib/actions/auth";
import { formatPrice } from "@/lib/format-price";
import { getOrderForTenant } from "@/lib/queries/orders";

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const membership = await requireAdminMembership();
  const { id } = await params;
  const order = await getOrderForTenant(membership.tenant_id, id);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <Link href="/admin/orders" className="text-muted-foreground text-sm">
          ← К заказам
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Заказ #{order.order_number}
        </h1>
        <p className="text-muted-foreground text-sm">
          {order.source === "online" ? "Онлайн" : "Зал"} ·{" "}
          {new Date(order.created_at).toLocaleString("ru-RU")}
        </p>
      </div>

      <div className="space-y-2 rounded-xl border bg-background p-4 text-sm">
        <p>
          <span className="text-muted-foreground">Клиент:</span>{" "}
          {order.customers?.name ?? "—"} ({order.customers?.phone ?? "—"})
        </p>
        <p>
          <span className="text-muted-foreground">Получение:</span>{" "}
          {order.delivery_method === "pickup"
            ? "Самовывоз"
            : order.delivery_method === "courier"
              ? "Курьер"
              : order.delivery_method ?? "—"}
        </p>
        {order.delivery_address ? (
          <p>
            <span className="text-muted-foreground">Адрес:</span>{" "}
            {order.delivery_address}
          </p>
        ) : null}
        {order.comment ? (
          <p>
            <span className="text-muted-foreground">Комментарий:</span>{" "}
            {order.comment}
          </p>
        ) : null}
      </div>

      <ul className="space-y-2 rounded-xl border bg-background p-4 text-sm">
        {order.order_items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3">
            <span>
              {item.title_snapshot} × {item.qty}
            </span>
            <span>{formatPrice(item.price_snapshot * item.qty)}</span>
          </li>
        ))}
        <li className="flex justify-between border-t pt-2 font-medium">
          <span>Итого</span>
          <span>{formatPrice(order.total)}</span>
        </li>
      </ul>

      <OrderStatusForm orderId={order.id} current={order.status} />
    </div>
  );
}
