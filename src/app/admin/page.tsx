import Link from "next/link";

import { FeatureGate } from "@/components/admin/FeatureGate";
import { formatPrice } from "@/lib/format-price";
import { planHas, PLAN_LABEL } from "@/lib/plans";
import { requireOwner } from "@/lib/queries/auth";
import { getTenantStats } from "@/lib/queries/stats";

export default async function AdminDashboardPage() {
  const { membership } = await requireOwner();
  const stats = await getTenantStats(membership.tenant_id);
  const plan = membership.tenant.plan;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Дашборд</h1>
        <p className="text-sm text-neutral-600">
          Тариф {PLAN_LABEL[plan]} · сегодня
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs tracking-wide text-neutral-500 uppercase">
            Онлайн сегодня
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {formatPrice(stats.todayOnline.revenue)}
          </p>
          <p className="text-sm text-neutral-600">
            {stats.todayOnline.ordersCount} заказов
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs tracking-wide text-neutral-500 uppercase">
            Офлайн сегодня
          </p>
          {planHas(plan, "fullAnalytics") ? (
            <>
              <p className="mt-2 text-2xl font-semibold">
                {formatPrice(stats.todayOffline.revenue)}
              </p>
              <p className="text-sm text-neutral-600">
                {stats.todayOffline.ordersCount} продаж
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-neutral-500">
              Доступно на Standard/Pro
            </p>
          )}
        </div>
      </div>

      <FeatureGate allowed={planHas(plan, "warehouse")} feature="warehouse">
        <section className="space-y-3">
          <h2 className="font-medium">Заканчивается</h2>
          {stats.lowStock.length === 0 ? (
            <p className="text-sm text-neutral-500">Всё в порядке</p>
          ) : (
            <ul className="divide-y rounded-xl border bg-white">
              {stats.lowStock.map((row, i) => (
                <li
                  key={`${row.title}-${row.size}-${i}`}
                  className="flex justify-between px-4 py-3 text-sm"
                >
                  <span>
                    {row.title}
                    {row.size ? ` · ${row.size}` : ""}
                  </span>
                  <span className="font-medium text-amber-700">
                    {row.stock_qty} шт.
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </FeatureGate>

      <section className="space-y-3">
        <h2 className="font-medium">Топ онлайн</h2>
        <ul className="space-y-2 text-sm">
          {stats.online.topProducts.map((p) => (
            <li key={p.title} className="flex justify-between">
              <span>{p.title}</span>
              <span className="text-neutral-600">
                {p.qty} · {formatPrice(p.revenue)}
              </span>
            </li>
          ))}
          {stats.online.topProducts.length === 0 ? (
            <li className="text-neutral-500">Пока нет продаж</li>
          ) : null}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link className="underline" href={`/s/${membership.tenant.slug}`}>
          Открыть витрину
        </Link>
        <Link className="underline" href="/admin/products/new">
          Добавить товар
        </Link>
      </div>
    </div>
  );
}
