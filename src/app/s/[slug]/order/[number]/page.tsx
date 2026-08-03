import Link from "next/link";
import { notFound } from "next/navigation";

import { formatPrice } from "@/lib/format-price";
import { getPublicOrderByNumber } from "@/lib/queries/orders";
import { getActiveTenantBySlug } from "@/lib/queries/tenants";
import type { Enums } from "@/types/database";

type OrderPageProps = {
  params: Promise<{ slug: string; number: string }>;
  searchParams: Promise<{ wa?: string }>;
};

const STATUS_LABEL: Record<Enums<"order_status">, string> = {
  new: "Новый",
  confirmed: "Подтверждён",
  assembled: "Собран",
  delivering: "Доставляется",
  done: "Выполнен",
  cancelled: "Отменён",
};

export default async function OrderPage({
  params,
  searchParams,
}: OrderPageProps) {
  const { slug, number } = await params;
  const { wa } = await searchParams;
  const tenant = await getActiveTenantBySlug(slug);
  if (!tenant) notFound();

  const orderNumber = Number.parseInt(number, 10);
  if (!Number.isFinite(orderNumber) || orderNumber <= 0) notFound();

  const order = await getPublicOrderByNumber(tenant.id, orderNumber);
  if (!order) notFound();

  const items = order.order_items ?? [];

  return (
    <main className="sf-container max-w-lg space-y-8 py-10 pb-28">
      <div className="space-y-2">
        <p className="text-[12px] tracking-[0.14em] uppercase text-[var(--sf-muted)]">
          Заказ оформлен
        </p>
        <h1 className="text-3xl font-medium tracking-[-0.03em] text-[var(--sf-fg)]">
          №{order.order_number}
        </h1>
        <p className="text-sm text-[var(--sf-muted)]">
          Статус: {STATUS_LABEL[order.status]} ·{" "}
          {order.payment_status === "paid" ? "Оплачен" : "Ожидает оплаты"}
        </p>
      </div>

      <ul className="space-y-2 border-y border-[var(--sf-line)] py-4 text-sm">
        {items.map((item, index) => (
          <li key={`${item.title_snapshot}-${index}`} className="flex justify-between gap-3">
            <span>
              {item.title_snapshot} × {item.qty}
            </span>
            <span className="shrink-0 text-[var(--sf-muted)]">
              {formatPrice(item.price_snapshot * item.qty)}
            </span>
          </li>
        ))}
      </ul>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--sf-muted)]">Товары</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--sf-muted)]">Доставка</span>
          <span>{formatPrice(order.delivery_cost)}</span>
        </div>
        <div className="flex justify-between pt-2 text-base font-medium">
          <span>Итого</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="sf-btn sf-btn-primary w-full"
          >
            Написать в WhatsApp
          </a>
        ) : null}
        <Link
          href={`/s/${tenant.slug}/catalog`}
          className="sf-btn sf-btn-ghost w-full border border-[var(--sf-line)]"
        >
          В каталог
        </Link>
      </div>
    </main>
  );
}
