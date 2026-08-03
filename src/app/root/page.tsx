import Link from "next/link";

import { CreateShopForm } from "@/components/root/CreateShopForm";
import { formatPrice } from "@/lib/format-price";
import { PLAN_LABEL } from "@/lib/plans";
import { requireSuperadmin } from "@/lib/queries/auth";
import { getPlatformStats } from "@/lib/queries/stats";
import { setShopStatusAction } from "@/lib/actions/settings";

export default async function RootHomePage() {
  await requireSuperadmin();
  const stats = await getPlatformStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Платформа</h1>
        <p className="text-sm text-neutral-600">
          {stats.activeTenants}/{stats.tenantsCount} активных ·{" "}
          {stats.ordersCount} заказов · {formatPrice(stats.revenue)}
        </p>
      </div>

      <CreateShopForm />

      <ul className="divide-y rounded-xl border bg-white">
        {stats.tenants.map((tenant) => (
          <li
            key={tenant.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
          >
            <div>
              <p className="font-medium">{tenant.name}</p>
              <p className="text-neutral-500">
                {tenant.status} · {PLAN_LABEL[tenant.plan]} ·{" "}
                {formatPrice(tenant.revenue)}
              </p>
            </div>
            <div className="flex gap-2">
              <Link className="underline" href={`/s/${tenant.slug ?? ""}`}>
                витрина
              </Link>
              <form
                action={async () => {
                  "use server";
                  await setShopStatusAction(
                    tenant.id,
                    tenant.status === "active" ? "paused" : "active",
                  );
                }}
              >
                <button type="submit" className="underline">
                  {tenant.status === "active" ? "выкл" : "вкл"}
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
