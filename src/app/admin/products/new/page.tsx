import Link from "next/link";

import { ProductForm } from "@/components/admin/ProductForm";
import { requireOwner } from "@/lib/queries/auth";
import { listCategoriesForTenant } from "@/lib/queries/products";

export default async function NewProductPage() {
  const { membership } = await requireOwner();
  const categories = await listCategoriesForTenant(membership.tenant_id);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link href="/admin/products" className="text-sm text-neutral-500">
          ← К товарам
        </Link>
        <h1 className="text-2xl font-semibold">Новый товар</h1>
      </div>
      <ProductForm mode="create" categories={categories} />
    </div>
  );
}
