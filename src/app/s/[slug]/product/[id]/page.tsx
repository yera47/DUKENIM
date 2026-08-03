import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductBuyBox } from "@/components/storefront/ProductBuyBox";
import { getPublicProduct } from "@/lib/queries/catalog";
import { getActiveTenantBySlug } from "@/lib/queries/tenants";

type ProductPageProps = {
  params: Promise<{ slug: string; id: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug, id } = await params;
  const tenant = await getActiveTenantBySlug(slug);
  if (!tenant) notFound();

  const product = await getPublicProduct(tenant.id, id);
  if (!product) notFound();

  return (
    <main className="sf-container grid gap-10 py-8 pb-28 md:grid-cols-2 md:gap-14 md:py-12">
      <div className="space-y-4">
        <Link
          href={`/s/${tenant.slug}/catalog`}
          className="text-[13px] text-[var(--sf-muted)] transition hover:text-[var(--sf-fg)]"
        >
          ← Каталог
        </Link>
        <div
          className="aspect-[4/5] overflow-hidden bg-[var(--sf-soft)] shadow-[var(--sf-shadow)]"
          style={{ borderRadius: "var(--sf-radius-card)" }}
        >
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0]}
              alt={product.title}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                className="text-[var(--sf-muted)] opacity-50"
                aria-hidden
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="8.5" cy="10" r="1.5" />
                <path d="M21 16l-5.5-5.5L6 20" />
              </svg>
            </div>
          )}
        </div>
        {product.images.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto">
            {product.images.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt=""
                className="size-16 rounded-[10px] object-cover"
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-5 md:pt-10">
        <h1 className="text-[2rem] leading-tight font-medium tracking-[-0.035em] text-[var(--sf-fg)] md:text-4xl">
          {product.title}
        </h1>
        {product.description ? (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--sf-muted)]">
            {product.description}
          </p>
        ) : null}
        <ProductBuyBox product={product} tenantSlug={tenant.slug} />
      </div>
    </main>
  );
}
