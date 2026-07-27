import Link from "next/link";

import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdminMembership } from "@/lib/actions/auth";

export default async function NewProductPage() {
  await requireAdminMembership();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="space-y-1">
        <Link href="/admin/products" className="text-muted-foreground text-sm">
          ← К товарам
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Новый товар</h1>
        <p className="text-muted-foreground text-sm">
          Фото → название → цена → размеры с остатками
        </p>
      </div>
      <ProductForm mode="create" />
    </div>
  );
}
