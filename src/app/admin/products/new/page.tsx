import Link from "next/link";

import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdminMembership } from "@/lib/actions/auth";
import { listCategoriesForTenant } from "@/lib/queries/products";

export default async function NewProductPage() {
  const membership = await requireAdminMembership();
  const categories = await listCategoriesForTenant(membership.tenant_id);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="space-y-1">
        <Link href="/admin/products" className="text-muted-foreground text-sm">
          ← К товарам
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Новый товар</h1>
        <p className="text-muted-foreground text-sm">
          Фото → название → раздел → цена → размеры с остатками
        </p>
      </div>
      <ProductForm mode="create" categories={categories} />
    </div>
  );
}
