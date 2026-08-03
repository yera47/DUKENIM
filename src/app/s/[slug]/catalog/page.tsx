import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/storefront/ProductCard";
import {
  listPublicCategories,
  listPublicProducts,
} from "@/lib/queries/catalog";
import { getActiveTenantBySlug } from "@/lib/queries/tenants";

type CatalogPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CatalogPage({ params }: CatalogPageProps) {
  const { slug } = await params;
  const tenant = await getActiveTenantBySlug(slug);
  if (!tenant) notFound();

  const [categories, products] = await Promise.all([
    listPublicCategories(tenant.id),
    listPublicProducts(tenant.id),
  ]);

  return (
    <main className="sf-container space-y-8 py-10 pb-24">
      <h1 className="text-3xl font-medium tracking-[-0.03em] text-[var(--sf-fg)]">
        Каталог
      </h1>

      {categories.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/s/${tenant.slug}/catalog`}
            className="rounded-full border border-[var(--sf-line)] px-3.5 py-1.5 text-[13px] text-[var(--sf-fg)]"
            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            Все
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/s/${tenant.slug}/category/${category.slug}`}
              className="rounded-full border border-[var(--sf-line)] px-3.5 py-1.5 text-[13px] text-[var(--sf-muted)] transition hover:text-[var(--sf-fg)]"
            >
              {category.name}
            </Link>
          ))}
        </div>
      ) : null}

      {products.length === 0 ? (
        <p className="text-sm text-[var(--sf-muted)]">Товаров пока нет</p>
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
