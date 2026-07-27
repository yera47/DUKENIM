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
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Каталог</h1>

      {categories.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/s/${tenant.slug}/catalog`}
            className="rounded-full border px-3 py-1 text-sm"
            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            Все
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/s/${tenant.slug}/category/${category.slug}`}
              className="rounded-full border px-3 py-1 text-sm hover:bg-muted"
            >
              {category.name}
            </Link>
          ))}
        </div>
      ) : null}

      {products.length === 0 ? (
        <p className="text-muted-foreground text-sm">Товаров пока нет</p>
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
