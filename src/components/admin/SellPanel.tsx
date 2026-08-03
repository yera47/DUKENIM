"use client";

import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sellOfflineAction } from "@/lib/actions/orders";
import { formatPrice } from "@/lib/format-price";
import type { ProductWithVariants } from "@/lib/queries/products";

type SellPanelProps = {
  products: ProductWithVariants[];
};

export function SellPanel({ products }: SellPanelProps) {
  const [query, setQuery] = useState("");
  const [variantId, setVariantId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) =>
      product.title.toLowerCase().includes(q),
    );
  }, [products, query]);

  const selected = useMemo(() => {
    for (const product of products) {
      const variant = product.product_variants.find((v) => v.id === variantId);
      if (variant) return { product, variant };
    }
    return null;
  }, [products, variantId]);

  function onSell() {
    if (!variantId) {
      setError("Выберите размер");
      return;
    }
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await sellOfflineAction({ variantId, qty: 1 });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(`Продано · заказ #${result.orderNumber}`);
      setVariantId("");
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Продажа в зале</h2>
        <p className="text-muted-foreground text-sm">
          Найдите товар, выберите размер и спишите 1 шт.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="search">Поиск</Label>
        <Input
          id="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Название товара"
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      <ul className="divide-y rounded-xl border bg-white">
        {filtered.length === 0 ? (
          <li className="text-muted-foreground px-4 py-6 text-sm">
            Ничего не найдено
          </li>
        ) : (
          filtered.map((product) => {
            const variants = product.product_variants.filter(
              (v) => v.is_active && v.stock_qty > 0,
            );
            return (
              <li key={product.id} className="space-y-3 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{product.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </div>
                {variants.length === 0 ? (
                  <p className="text-muted-foreground text-xs">Нет в наличии</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {variants.map((variant) => {
                      const label = variant.size?.trim() || "Без размера";
                      const active = variant.id === variantId;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => setVariantId(variant.id)}
                          className={
                            active
                              ? "rounded-lg bg-[#0E5C4A] px-3 py-1.5 text-sm text-white"
                              : "rounded-lg border px-3 py-1.5 text-sm hover:bg-[#0E5C4A]/10"
                          }
                        >
                          {label} · {variant.stock_qty}
                        </button>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })
        )}
      </ul>

      <div className="sticky bottom-4 rounded-xl border bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm">
          {selected
            ? `${selected.product.title}${
                selected.variant.size ? ` · ${selected.variant.size}` : ""
              }`
            : "Размер не выбран"}
        </p>
        <Button
          type="button"
          disabled={pending || !variantId}
          onClick={onSell}
          className="w-full bg-[#0E5C4A] text-white hover:bg-[#0E5C4A]/90"
        >
          {pending ? "Продаём…" : "Продать 1 шт"}
        </Button>
      </div>
    </div>
  );
}
