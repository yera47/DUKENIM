import Link from "next/link";

import { formatPrice } from "@/lib/format-price";
import type { PublicProduct } from "@/lib/queries/catalog";

type ProductCardProps = {
  product: PublicProduct;
  tenantSlug: string;
  index?: number;
};

export function ProductCard({
  product,
  tenantSlug,
  index = 0,
}: ProductCardProps) {
  const image = product.images[0] ?? null;
  const inStock = product.product_variants.some(
    (v) => v.is_active && v.stock_qty > 0,
  );

  return (
    <Link
      href={`/s/${tenantSlug}/product/${product.id}`}
      className="sf-fade-up group block"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div
        className="overflow-hidden bg-[var(--sf-soft)] shadow-[var(--sf-shadow)]"
        style={{ borderRadius: "var(--sf-radius-card)" }}
      >
        <div className="aspect-[4/5] overflow-hidden">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={product.title}
              className="size-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <svg
                width="28"
                height="28"
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
      </div>
      <div className="space-y-1 pt-3">
        <p className="line-clamp-2 text-[13px] leading-snug tracking-[-0.01em] text-[var(--sf-fg)]">
          {product.title}
        </p>
        <p className="text-[13px] text-[var(--sf-muted)]">
          {formatPrice(product.price)}
        </p>
        {!inStock ? (
          <p className="text-[11px] text-[var(--sf-muted)]">Нет в наличии</p>
        ) : null}
      </div>
    </Link>
  );
}
