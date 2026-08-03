"use client";

import Link from "next/link";

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
      <div className="space-y-5">
        <p className="text-sm text-[var(--sf-muted)]">Корзина пуста</p>
        <Link href={`/s/${tenantSlug}/catalog`} className="sf-btn sf-btn-primary">
          В каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.variantId}
            className="flex gap-4 border-b border-[var(--sf-line)] pb-4"
          >
            <div
              className="size-20 shrink-0 overflow-hidden bg-[var(--sf-soft)]"
              style={{ borderRadius: "10px" }}
            >
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="text-[15px] font-medium tracking-[-0.01em]">
                  {item.title}
                </p>
                <p className="mt-1 text-[12px] text-[var(--sf-muted)]">
                  {item.size ? `Размер ${item.size}` : "Без размера"} ·{" "}
                  {formatPrice(item.unitPrice)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="sf-btn h-8 min-h-8 rounded-[10px] border border-[var(--sf-line)] px-3"
                  onClick={() => setQty(item.variantId, item.qty - 1)}
                >
                  −
                </button>
                <span className="w-6 text-center text-sm">{item.qty}</span>
                <button
                  type="button"
                  className="sf-btn h-8 min-h-8 rounded-[10px] border border-[var(--sf-line)] px-3"
                  onClick={() => setQty(item.variantId, item.qty + 1)}
                >
                  +
                </button>
                <button
                  type="button"
                  className="ml-auto text-[12px] text-[var(--sf-muted)]"
                  onClick={() => removeItem(item.variantId)}
                >
                  Удалить
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-[var(--sf-muted)]">Итого</p>
        <p className="text-lg font-medium tracking-[-0.02em]">
          {formatPrice(subtotal())}
        </p>
      </div>

      <Link
        href={`/s/${tenantSlug}/checkout`}
        className="sf-btn sf-btn-primary w-full"
      >
        Оформить
      </Link>
    </div>
  );
}
