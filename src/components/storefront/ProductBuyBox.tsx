"use client";

import { useMemo, useState } from "react";

import { formatPrice } from "@/lib/format-price";
import type { PublicProduct } from "@/lib/queries/catalog";
import { useCartStore } from "@/lib/store/cart";

type ProductBuyBoxProps = {
  product: PublicProduct;
  tenantSlug: string;
};

export function ProductBuyBox({ product, tenantSlug }: ProductBuyBoxProps) {
  const variants = useMemo(
    () => product.product_variants.filter((v) => v.is_active),
    [product.product_variants],
  );
  const addItem = useCartStore((s) => s.addItem);
  const setTenantSlug = useCartStore((s) => s.setTenantSlug);

  const defaultVariant =
    variants.find((v) => v.stock_qty > 0) ?? variants[0] ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(
    defaultVariant?.id ?? null,
  );
  const [added, setAdded] = useState(false);

  const selected = variants.find((v) => v.id === selectedId) ?? null;
  const unitPrice = product.price;
  const canAdd = Boolean(selected && selected.stock_qty > 0);

  function handleAdd() {
    if (!selected || selected.stock_qty <= 0) return;
    setTenantSlug(tenantSlug);
    addItem({
      productId: product.id,
      variantId: selected.id,
      title: product.title,
      size: selected.size,
      unitPrice,
      imageUrl: product.images[0] ?? null,
    });
    navigator.vibrate?.(10);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-2xl font-medium tracking-[-0.03em] text-[var(--sf-fg)]">
          {formatPrice(unitPrice)}
        </p>
        {product.old_price ? (
          <p className="mt-1 text-sm text-[var(--sf-muted)] line-through">
            {formatPrice(product.old_price)}
          </p>
        ) : null}
      </div>

      {variants.length > 0 ? (
        <div className="space-y-3">
          <p className="text-[13px] font-medium tracking-wide text-[var(--sf-fg)]">
            Размер
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const unavailable = variant.stock_qty <= 0;
              const isSelected = selectedId === variant.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={unavailable}
                  onClick={() => setSelectedId(variant.id)}
                  className="min-w-12 rounded-[10px] border border-[var(--sf-line)] px-3.5 py-2.5 text-sm transition duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-35"
                  style={
                    isSelected && !unavailable
                      ? {
                          borderColor: "var(--accent)",
                          backgroundColor: "var(--accent)",
                          color: "white",
                        }
                      : undefined
                  }
                  title={unavailable ? "Нет в наличии" : undefined}
                >
                  {variant.size ?? "One size"}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="sf-btn sf-btn-primary w-full disabled:opacity-40"
        disabled={!canAdd}
        onClick={handleAdd}
      >
        {added ? "Добавлено" : canAdd ? "В корзину" : "Нет в наличии"}
      </button>
    </div>
  );
}
