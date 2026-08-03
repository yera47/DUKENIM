import { formatPrice } from "@/lib/format-price";
import { PLAN_LABEL } from "@/lib/plans";
import { requireSuperadmin } from "@/lib/queries/auth";
import { getPlatformStats } from "@/lib/queries/stats";

export default async function RootAnalyticsPage() {
  await requireSuperadmin();
  const stats = await getPlatformStats();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Аналитика платформы</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase text-neutral-500">Выручка</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatPrice(stats.revenue)}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase text-neutral-500">Заказы</p>
          <p className="mt-2 text-2xl font-semibold">{stats.ordersCount}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase text-neutral-500">Магазины</p>
          <p className="mt-2 text-2xl font-semibold">
            {stats.activeTenants}/{stats.tenantsCount}
          </p>
        </div>
      </div>
      <ul className="divide-y rounded-xl border bg-white">
        {stats.tenants
          .slice()
          .sort((a, b) => b.revenue - a.revenue)
          .map((t) => (
            <li key={t.id} className="flex justify-between px-4 py-3 text-sm">
              <span>
                {t.name} · {PLAN_LABEL[t.plan]}
              </span>
              <span>{formatPrice(t.revenue)}</span>
            </li>
          ))}
      </ul>
    </div>
  );
}
