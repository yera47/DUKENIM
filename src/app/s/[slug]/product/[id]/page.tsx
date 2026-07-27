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
    <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-2">
      <div className="space-y-3">
        <Link
          href={`/s/${tenant.slug}/catalog`}
          className="text-muted-foreground text-sm"
        >
          ← Каталог
        </Link>
        <div className="bg-muted aspect-[4/5] overflow-hidden rounded-xl">
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0]}
              alt={product.title}
              className="size-full object-cover"
            />
          ) : (
            <div className="text-muted-foreground flex size-full items-center justify-center text-sm">
              Нет фото
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
                className="size-16 rounded-md object-cover"
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          {product.title}
        </h1>
        {product.description ? (
          <p className="text-muted-foreground whitespace-pre-wrap text-sm">
            {product.description}
          </p>
        ) : null}
        <ProductBuyBox product={product} tenantSlug={tenant.slug} />
      </div>
    </main>
  );
}
