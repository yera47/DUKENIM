import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireOwner } from "@/lib/queries/auth";
import { getProductForTenant, listCategoriesForTenant } from "@/lib/queries/products";
type Props = { params: Promise<{ id: string }> };
export default async function EditProductPage({ params }: Props) {
  const { membership } = await requireOwner();
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductForTenant(membership.tenant_id, id),
    listCategoriesForTenant(membership.tenant_id),
  ]);
  if (!product) notFound();
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link href="/admin/products" className="text-sm text-neutral-500">← К товарам</Link>
        <h1 className="text-2xl font-semibold">Редактирование</h1>
        <p className="text-sm text-neutral-600">{product.title}</p>
      </div>
      <ProductForm mode="edit" productId={product.id} categories={categories} initial={{
        title: product.title, price: product.price, category_id: product.category_id,
        description: product.description, images: product.images, is_active: product.is_active,
        variants: product.product_variants.filter((v) => v.is_active).map((v) => ({ id: v.id, size: v.size ?? "", stock_qty: v.stock_qty })),
      }} />
    </div>
  );
}