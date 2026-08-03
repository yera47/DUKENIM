import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { formatPrice } from "@/lib/format-price";
import { requireOwner } from "@/lib/queries/auth";
import { getOrderForTenant } from "@/lib/queries/orders";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderPage({ params }: Props) {
  const { membership } = await requireOwner();
  const { id } = await params;
  const order = await getOrderForTenant(membership.tenant_id, id);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href="/admin/orders" className="text-sm text-neutral-500">
        ← К заказам
      </Link>
      <h1 className="text-2xl font-semibold">Заказ #{order.order_number}</h1>
      <p className="text-sm text-neutral-600">
        {order.customers?.name ?? "—"} · {order.customers?.phone ?? "—"}
      </p>
      <ul className="space-y-2 rounded-xl border bg-white p-4 text-sm">
        {order.order_items.map((item) => (
          <li key={item.id} className="flex justify-between">
            <span>
              {item.title_snapshot} × {item.qty}
            </span>
            <span>{formatPrice(item.price_snapshot * item.qty)}</span>
          </li>
        ))}
      </ul>
      <p className="text-lg font-semibold">Итого {formatPrice(order.total)}</p>
      <OrderStatusForm orderId={order.id} currentStatus={order.status} />
    </div>
  );
}
