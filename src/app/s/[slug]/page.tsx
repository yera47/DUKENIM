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
  const featured = products.filter((p) => p.is_featured).slice(0, 6);
  const showcase = featured.length > 0 ? featured : products.slice(0, 6);

  return (
    <main className="sf-container space-y-14 py-10 pb-24 md:py-14">
      <section className="sf-fade-up max-w-xl space-y-5 pt-4">
        <p className="text-[12px] tracking-[0.18em] uppercase text-[var(--sf-muted)]">
          {tenant.city}
        </p>
        <h1 className="text-[2.35rem] leading-[1.05] font-medium tracking-[-0.04em] text-[var(--sf-fg)] md:text-5xl">
          {tenant.name}
        </h1>
        {tenant.tagline ? (
          <p className="max-w-md text-[15px] leading-relaxed text-[var(--sf-muted)]">
            {tenant.tagline}
          </p>
        ) : null}
        <div className="pt-2">
          <CatalogLink href={`/s/${tenant.slug}/catalog`}>В каталог</CatalogLink>
        </div>
      </section>

      {showcase.length > 0 ? (
        <section className="space-y-6">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-[13px] tracking-[0.14em] uppercase text-[var(--sf-muted)]">
              Избранное
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
            {showcase.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                tenantSlug={tenant.slug}
                index={index}
              />
            ))}
          </div>
        </section>
      ) : (
        <p className="text-sm text-[var(--sf-muted)]">
          Пока нет товаров. Добавьте их в кабинете.
        </p>
      )}
    </main>
  );
}
