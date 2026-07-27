import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdminMembership } from "@/lib/actions/auth";
import { getProductForTenant } from "@/lib/queries/products";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const membership = await requireAdminMembership();
  const { id } = await params;
  const product = await getProductForTenant(membership.tenant_id, id);

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="space-y-1">
        <Link href="/admin/products" className="text-muted-foreground text-sm">
          ← К товарам
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Редактирование</h1>
        <p className="text-muted-foreground text-sm">{product.title}</p>
      </div>
      <ProductForm
        mode="edit"
        productId={product.id}
        initial={{
          title: product.title,
          price: product.price,
          description: product.description,
          images: product.images,
          is_active: product.is_active,
          variants: product.product_variants
            .filter((v) => v.is_active)
            .map((v) => ({
              id: v.id,
              size: v.size ?? "",
              stock_qty: v.stock_qty,
            })),
        }}
      />
    </div>
  );
}
