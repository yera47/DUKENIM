import Link from "next/link";

import { formatPrice } from "@/lib/format-price";
import type { PublicProduct } from "@/lib/queries/catalog";

type ProductCardProps = {
  product: PublicProduct;
  tenantSlug: string;
};

export function ProductCard({ product, tenantSlug }: ProductCardProps) {
  const image = product.images[0] ?? null;
  const inStock = product.product_variants.some(
    (v) => v.is_active && v.stock_qty > 0,
  );

  return (
    <Link
      href={`/s/${tenantSlug}/product/${product.id}`}
      className="group block overflow-hidden rounded-xl border bg-background"
    >
      <div className="bg-muted aspect-[4/5] overflow-hidden">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.title}
            className="size-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center text-sm">
            Нет фото
          </div>
        )}
      </div>
      <div className="space-y-1 p-3">
        <p className="line-clamp-2 text-sm font-medium">{product.title}</p>
        <p className="text-sm" style={{ color: "var(--accent)" }}>
          {formatPrice(product.price)}
        </p>
        {!inStock ? (
          <p className="text-muted-foreground text-xs">Нет в наличии</p>
        ) : null}
      </div>
    </Link>
  );
}
