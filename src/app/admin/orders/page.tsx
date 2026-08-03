import Link from "next/link";

import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { formatPrice } from "@/lib/format-price";
import { requireOwner } from "@/lib/queries/auth";
import { listOrdersForTenant } from "@/lib/queries/orders";

export default async function AdminOrdersPage() {
  const { membership } = await requireOwner();
  const orders = await listOrdersForTenant(membership.tenant_id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Заказы</h1>
      <ul className="space-y-3">
        {orders.map((order) => (
          <li key={order.id} className="rounded-xl border bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="font-medium hover:underline"
                >
                  #{order.order_number} · {order.source === "online" ? "онлайн" : "зал"}
                </Link>
                <p className="text-sm text-neutral-600">
                  {order.customers?.name ?? "—"} · {order.customers?.phone ?? "—"}
                </p>
                <p className="text-sm">{formatPrice(order.total)}</p>
              </div>
              <OrderStatusForm orderId={order.id} currentStatus={order.status} />
            </div>
          </li>
        ))}
        {orders.length === 0 ? (
          <li className="text-sm text-neutral-500">Заказов пока нет</li>
        ) : null}
      </ul>
    </div>
  );
}
