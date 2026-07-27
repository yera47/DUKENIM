import { SellPanel } from "@/components/admin/SellPanel";
import { requireAdminMembership } from "@/lib/actions/auth";
import { searchProductsForSell } from "@/lib/queries/sell";

export default async function AdminSellPage() {
  const membership = await requireAdminMembership();
  const products = await searchProductsForSell(membership.tenant_id, "");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Продали в зале</h1>
        <p className="text-muted-foreground text-sm">
          Поиск → размер → продано. Максимум 2–3 тапа.
        </p>
      </div>
      <SellPanel initialProducts={products} />
    </div>
  );
}
