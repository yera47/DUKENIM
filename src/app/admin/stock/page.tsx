import { FeatureGate } from "@/components/admin/FeatureGate";
import { formatPrice } from "@/lib/format-price";
import { planHas } from "@/lib/plans";
import { requireOwner } from "@/lib/queries/auth";
import { listProductsForTenant } from "@/lib/queries/products";

export default async function StockPage() {
  const { membership } = await requireOwner();
  const products = await listProductsForTenant(membership.tenant_id);

  const rows = products.flatMap((p) =>
    p.product_variants
      .filter((v) => v.is_active)
      .map((v) => ({
        id: v.id,
        title: p.title,
        size: v.size,
        stock: v.stock_qty,
        price: p.price,
      })),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Склад</h1>
      <FeatureGate
        allowed={planHas(membership.tenant.plan, "warehouse")}
        feature="warehouse"
      >
        <ul className="divide-y rounded-xl border bg-white">
          {rows.map((row) => (
            <li
              key={row.id}
              className={`flex justify-between px-4 py-3 text-sm ${
                row.stock <= 3 ? "bg-amber-50" : ""
              }`}
            >
              <span>
                {row.title}
                {row.size ? ` · ${row.size}` : ""}
              </span>
              <span>
                {row.stock} шт · {formatPrice(row.price)}
              </span>
            </li>
          ))}
        </ul>
      </FeatureGate>
    </div>
  );
}
