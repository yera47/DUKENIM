import { FeatureGate } from "@/components/admin/FeatureGate";
import { SellPanel } from "@/components/admin/SellPanel";
import { planHas } from "@/lib/plans";
import { requireOwner } from "@/lib/queries/auth";
import { listProductsForTenant } from "@/lib/queries/products";

export default async function SellPage() {
  const { membership } = await requireOwner();
  const products = await listProductsForTenant(membership.tenant_id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Продали в зале</h1>
      <FeatureGate
        allowed={planHas(membership.tenant.plan, "offlineSell")}
        feature="offlineSell"
      >
        <SellPanel products={products} />
      </FeatureGate>
    </div>
  );
}
