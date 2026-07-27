import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { requireAdminMembership } from "@/lib/actions/auth";
import { formatPrice } from "@/lib/format-price";
import { getTenantStats, type ChannelStats } from "@/lib/queries/stats";
import { cn } from "@/lib/utils";

function ChannelBlock({
  title,
  stats,
}: {
  title: string;
  stats: ChannelStats;
}) {
  return (
    <section className="space-y-3 rounded-xl border bg-background p-4">
      <h2 className="text-lg font-medium">{title}</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-muted-foreground text-xs">Заказы</p>
          <p className="text-2xl font-semibold">{stats.ordersCount}</p>
        </div>
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-muted-foreground text-xs">Выручка</p>
          <p className="text-2xl font-semibold">{formatPrice(stats.revenue)}</p>
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Топ товаров</p>
        {stats.topProducts.length === 0 ? (
          <p className="text-muted-foreground text-sm">Пока пусто</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {stats.topProducts.map((item) => (
              <li key={item.title} className="flex justify-between gap-3">
                <span className="truncate">
                  {item.title} × {item.qty}
                </span>
                <span className="shrink-0">{formatPrice(item.revenue)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default async function AdminDashboardPage() {
  const membership = await requireAdminMembership();
  const stats = await getTenantStats(membership.tenant_id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Дашборд</h1>
        <p className="text-muted-foreground text-sm">
          {membership.tenant.name} · статистика раздельно по каналам
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChannelBlock title="Онлайн" stats={stats.online} />
        <ChannelBlock title="Офлайн (зал)" stats={stats.offline} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/products/new"
          className={cn(buttonVariants({ size: "lg" }))}
        >
          Добавить товар
        </Link>
        <Link
          href="/admin/orders"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          Заказы
        </Link>
        <Link
          href="/admin/sell"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          Продали в зале
        </Link>
        <Link
          href="/admin/settings"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          Настройки
        </Link>
        <Link
          href={`/s/${membership.tenant.slug}`}
          className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
        >
          Открыть витрину
        </Link>
      </div>
    </div>
  );
}
