import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/storefront/ProductCard";
import {
  getPublicCategoryBySlug,
  listPublicProducts,
} from "@/lib/queries/catalog";
import { getActiveTenantBySlug } from "@/lib/queries/tenants";

type CategoryPageProps = {
  params: Promise<{ slug: string; categorySlug: string }>;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug, categorySlug } = await params;
  const tenant = await getActiveTenantBySlug(slug);
  if (!tenant) notFound();

  const category = await getPublicCategoryBySlug(tenant.id, categorySlug);
  if (!category) notFound();

  const products = await listPublicProducts(tenant.id, {
    categoryId: category.id,
  });

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="space-y-1">
        <Link
          href={`/s/${tenant.slug}/catalog`}
          className="text-muted-foreground text-sm"
        >
          ← Каталог
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {category.name}
        </h1>
      </div>

      {products.length === 0 ? (
        <p className="text-muted-foreground text-sm">В категории пока пусто</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              tenantSlug={tenant.slug}
            />
          ))}
        </div>
      )}
    </main>
  );
}
