import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format-price";
import { getPublicOrderByNumber } from "@/lib/queries/orders";
import { getActiveTenantBySlug } from "@/lib/queries/tenants";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  new: "Новый",
  confirmed: "Подтверждён",
  assembled: "Собран",
  delivering: "В пути",
  done: "Выполнен",
  cancelled: "Отменён",
};

type OrderPageProps = {
  params: Promise<{ slug: string; number: string }>;
  searchParams: Promise<{ wa?: string }>;
};

export default async function OrderStatusPage({
  params,
  searchParams,
}: OrderPageProps) {
  const { slug, number } = await params;
  const { wa } = await searchParams;
  const tenant = await getActiveTenantBySlug(slug);
  if (!tenant) notFound();

  const orderNumber = Number.parseInt(number, 10);
  if (!Number.isFinite(orderNumber)) notFound();

  const order = await getPublicOrderByNumber(tenant.id, orderNumber);
  if (!order) notFound();

  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm">Заказ оформлен</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          №{order.order_number}
        </h1>
        <p className="text-sm">
          Статус: {STATUS_LABEL[order.status] ?? order.status}
        </p>
      </div>

      <ul className="space-y-1 rounded-xl border p-4 text-sm">
        {order.order_items.map((item, index) => (
          <li key={`${item.title_snapshot}-${index}`}>
            {item.title_snapshot} × {item.qty} —{" "}
            {formatPrice(item.price_snapshot * item.qty)}
          </li>
        ))}
        <li className="border-t pt-2 font-medium">
          Итого: {formatPrice(order.total)}
        </li>
      </ul>

      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ size: "lg" }), "w-full")}
          style={{ backgroundColor: "#25D366", color: "white" }}
        >
          Написать в WhatsApp
        </a>
      ) : null}

      <Link
        href={`/s/${tenant.slug}/catalog`}
        className={cn(buttonVariants({ variant: "outline" }), "w-full")}
      >
        В каталог
      </Link>
    </main>
  );
}
