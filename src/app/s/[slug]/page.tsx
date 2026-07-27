import { notFound } from "next/navigation";

import { ProductCard } from "@/components/storefront/ProductCard";
import { CatalogLink } from "@/components/storefront/StorefrontShell";
import { listPublicProducts } from "@/lib/queries/catalog";
import { getActiveTenantBySlug } from "@/lib/queries/tenants";

type StorefrontPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function StorefrontPage({ params }: StorefrontPageProps) {
  const { slug } = await params;
  const tenant = await getActiveTenantBySlug(slug);
  if (!tenant) notFound();

  const products = await listPublicProducts(tenant.id);
  const featured = products.filter((p) => p.is_featured).slice(0, 4);
  const showcase = featured.length > 0 ? featured : products.slice(0, 4);

  return (
    <main className="mx-auto max-w-5xl space-y-10 px-4 py-8">
      <section className="space-y-4 py-6">
        <div
          className="h-1.5 w-16 rounded-full"
          style={{ backgroundColor: "var(--accent)" }}
          aria-hidden
        />
        <h1
          className="text-4xl font-semibold tracking-tight"
          style={{ color: "var(--accent)" }}
        >
          {tenant.name}
        </h1>
        {tenant.tagline ? (
          <p className="text-muted-foreground max-w-xl text-lg">
            {tenant.tagline}
          </p>
        ) : null}
        <p className="text-sm text-foreground/70">{tenant.city}</p>
        <CatalogLink href={`/s/${tenant.slug}/catalog`}>В каталог</CatalogLink>
      </section>

      {showcase.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Товары</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {showcase.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                tenantSlug={tenant.slug}
              />
            ))}
          </div>
        </section>
      ) : (
        <p className="text-muted-foreground text-sm">
          Пока нет товаров. Добавьте их в кабинете.
        </p>
      )}
    </main>
  );
}
