import { FeatureGate } from "@/components/admin/FeatureGate";
import { formatPrice } from "@/lib/format-price";
import { planHas } from "@/lib/plans";
import { requireOwner } from "@/lib/queries/auth";
import { getTenantStats } from "@/lib/queries/stats";

export default async function AnalyticsPage() {
  const { membership } = await requireOwner();
  const stats = await getTenantStats(membership.tenant_id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Аналитика</h1>
      <FeatureGate
        allowed={planHas(membership.tenant.plan, "fullAnalytics")}
        feature="fullAnalytics"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs uppercase text-neutral-500">Онлайн</p>
            <p className="mt-2 text-2xl font-semibold">
              {formatPrice(stats.online.revenue)}
            </p>
            <p className="text-sm">{stats.online.ordersCount} заказов</p>
            <ul className="mt-4 space-y-1 text-sm">
              {stats.online.topProducts.map((p) => (
                <li key={p.title} className="flex justify-between">
                  <span>{p.title}</span>
                  <span>{p.qty}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs uppercase text-neutral-500">Офлайн</p>
            <p className="mt-2 text-2xl font-semibold">
              {formatPrice(stats.offline.revenue)}
            </p>
            <p className="text-sm">{stats.offline.ordersCount} продаж</p>
            <ul className="mt-4 space-y-1 text-sm">
              {stats.offline.topProducts.map((p) => (
                <li key={p.title} className="flex justify-between">
                  <span>{p.title}</span>
                  <span>{p.qty}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </FeatureGate>
    </div>
  );
}
