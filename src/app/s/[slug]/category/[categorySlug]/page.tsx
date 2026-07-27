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
    <main className="sf-container space-y-8 py-10 pb-24">
      <div className="space-y-2">
        <Link
          href={`/s/${tenant.slug}/catalog`}
          className="text-[13px] text-[var(--sf-muted)] transition hover:text-[var(--sf-fg)]"
        >
          ← Каталог
        </Link>
        <h1 className="text-3xl font-medium tracking-[-0.03em] text-[var(--sf-fg)]">
          {category.name}
        </h1>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-[var(--sf-muted)]">В категории пока пусто</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              tenantSlug={tenant.slug}
              index={index}
            />
          ))}
        </div>
      )}
    </main>
  );
}
