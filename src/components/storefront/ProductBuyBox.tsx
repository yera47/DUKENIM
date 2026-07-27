"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
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
  const unitPrice = selected
    ? product.price + selected.price_delta
    : product.price;
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
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-2xl font-semibold" style={{ color: "var(--accent)" }}>
          {formatPrice(unitPrice)}
        </p>
        {product.old_price ? (
          <p className="text-muted-foreground text-sm line-through">
            {formatPrice(product.old_price)}
          </p>
        ) : null}
      </div>

      {variants.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Размер</p>
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
                  className="min-w-12 rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
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
          <p className="text-muted-foreground text-xs">
            Серые размеры недоступны, но остаются видимыми.
          </p>
        </div>
      ) : null}

      <Button
        type="button"
        className="w-full"
        size="lg"
        disabled={!canAdd}
        onClick={handleAdd}
        style={
          canAdd
            ? { backgroundColor: "var(--accent)", color: "white" }
            : undefined
        }
      >
        {added ? "Добавлено" : canAdd ? "В корзину" : "Нет в наличии"}
      </Button>
    </div>
  );
}
