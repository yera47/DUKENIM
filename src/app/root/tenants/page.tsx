import Link from "next/link";

import { PLAN_LABEL } from "@/lib/plans";
import { requireSuperadmin } from "@/lib/queries/auth";
import { listAllTenants } from "@/lib/queries/tenants";
import { setShopPlanAction } from "@/lib/actions/settings";
import type { PlanId } from "@/lib/plans";

export default async function RootTenantsPage() {
  await requireSuperadmin();
  const tenants = await listAllTenants();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Магазины</h1>
      <ul className="space-y-3">
        {tenants.map((tenant) => (
          <li key={tenant.id} className="rounded-xl border bg-white p-4 text-sm">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="font-medium">{tenant.name}</p>
                <p className="text-neutral-500">
                  /s/{tenant.slug} · {tenant.status} · {PLAN_LABEL[tenant.plan]}
                </p>
              </div>
              <Link className="underline" href={`/root/messages?tenant=${tenant.id}`}>
                чат
              </Link>
            </div>
            <div className="mt-3 flex gap-2">
              {(["basic", "standard", "pro"] as PlanId[]).map((plan) => (
                <form
                  key={plan}
                  action={async () => {
                    "use server";
                    await setShopPlanAction(tenant.id, plan);
                  }}
                >
                  <button
                    type="submit"
                    className="rounded border px-2 py-1 text-xs"
                    disabled={tenant.plan === plan}
                  >
                    {PLAN_LABEL[plan]}
                  </button>
                </form>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
