"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sellOfflineAction } from "@/lib/actions/orders";
import { formatPrice } from "@/lib/format-price";
import type { PublicProduct, PublicVariant } from "@/lib/queries/catalog";

type SellPanelProps = {
  initialProducts: PublicProduct[];
};

type Step = "search" | "size" | "done";

export function SellPanel({ initialProducts }: SellPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [step, setStep] = useState<Step>("search");
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialProducts.slice(0, 12);
    return initialProducts
      .filter((item) => item.title.toLowerCase().includes(q))
      .slice(0, 12);
  }, [initialProducts, query]);

  const variants = useMemo(
    () =>
      (product?.product_variants ?? []).filter(
        (variant) => variant.is_active,
      ),
    [product],
  );

  function pickProduct(next: PublicProduct) {
    setProduct(next);
    setError(null);
    setMessage(null);
    setStep("size");
  }

  function sell(variant: PublicVariant) {
    if (variant.stock_qty <= 0) return;
    setError(null);
    startTransition(async () => {
      const result = await sellOfflineAction({ variantId: variant.id, qty: 1 });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(
        `Продано · заказ #${result.orderNumber} · ${formatPrice(result.total)}`,
      );
      setStep("done");
      setProduct(null);
      setQuery("");
      router.refresh();
    });
  }

  function reset() {
    setStep("search");
    setProduct(null);
    setError(null);
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
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

      {step === "search" || step === "done" ? (
        <div className="space-y-3">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setStep("search");
              setMessage(null);
            }}
            placeholder="Поиск товара…"
            autoFocus
          />
          <ul className="space-y-2">
            {filtered.map((item) => {
              const stock = item.product_variants
                .filter((v) => v.is_active)
                .reduce((sum, v) => sum + v.stock_qty, 0);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => pickProduct(item)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3 text-left hover:bg-muted/40"
                  >
                    <span>
                      <span className="block font-medium">{item.title}</span>
                      <span className="text-muted-foreground text-xs">
                        {formatPrice(item.price)} · остаток {stock}
                      </span>
                    </span>
                    <span className="text-muted-foreground text-xs">→</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {step === "size" && product ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-medium">{product.title}</p>
              <p className="text-muted-foreground text-sm">
                Выберите размер
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              Назад
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {variants.map((variant) => {
              const unavailable = variant.stock_qty <= 0;
              return (
                <Button
                  key={variant.id}
                  type="button"
                  size="lg"
                  disabled={unavailable || pending}
                  variant={unavailable ? "outline" : "default"}
                  onClick={() => sell(variant)}
                >
                  {variant.size ?? "One size"}
                  {unavailable ? " · нет" : ` · ${variant.stock_qty}`}
                </Button>
              );
            })}
          </div>
          <p className="text-muted-foreground text-xs">
            Тап по размеру сразу фиксирует продажу.
          </p>
        </div>
      ) : null}
    </div>
  );
}
