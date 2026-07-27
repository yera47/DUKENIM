"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format-price";
import { useCartStore } from "@/lib/store/cart";

type CartViewProps = {
  tenantSlug: string;
};

export function CartView({ tenantSlug }: CartViewProps) {
  const items = useCartStore((s) => s.items);
  const setQty = useCartStore((s) => s.setQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotal);

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">Корзина пуста</p>
        <Link href={`/s/${tenantSlug}/catalog`}>
          <Button variant="outline">В каталог</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.variantId}
            className="flex gap-3 rounded-xl border bg-background p-3"
          >
            <div className="bg-muted size-20 shrink-0 overflow-hidden rounded-lg">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-muted-foreground text-xs">
                  {item.size ? `Размер ${item.size}` : "Без размера"} ·{" "}
                  {formatPrice(item.unitPrice)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setQty(item.variantId, item.qty - 1)}
                >
                  −
                </Button>
                <span className="w-6 text-center text-sm">{item.qty}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setQty(item.variantId, item.qty + 1)}
                >
                  +
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeItem(item.variantId)}
                >
                  Удалить
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t pt-4">
        <p className="text-sm">Итого</p>
        <p className="text-lg font-semibold">{formatPrice(subtotal())}</p>
      </div>

      <Link href={`/s/${tenantSlug}/checkout`} className="block">
        <Button
          className="w-full"
          size="lg"
          style={{ backgroundColor: "var(--accent)", color: "white" }}
        >
          Оформить
        </Button>
      </Link>
    </div>
  );
}
