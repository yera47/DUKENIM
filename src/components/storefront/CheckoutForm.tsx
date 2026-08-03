"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { placeOrderAction } from "@/lib/actions/orders";
import { formatPrice } from "@/lib/format-price";
import type { PublicDeliveryZone, PublicSettings } from "@/lib/queries/catalog";
import { useCartStore } from "@/lib/store/cart";

type CheckoutFormProps = {
  tenantId: string;
  tenantSlug: string;
  settings: PublicSettings;
  zones: PublicDeliveryZone[];
  pickupCity: string;
};

type Step = 1 | 2 | 3;

export function CheckoutForm({
  tenantId,
  tenantSlug,
  settings,
  zones,
  pickupCity,
}: CheckoutFormProps) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const subtotal = useCartStore((s) => s.subtotal);

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<"pickup" | "courier">(
    settings.pickup_enabled ? "pickup" : "courier",
  );
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");
  const [address, setAddress] = useState("");
  const [payOnline, setPayOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedZone = zones.find((z) => z.id === zoneId) ?? null;
  const cartSubtotal = subtotal();

  const deliveryCost = useMemo(() => {
    if (method !== "courier" || !selectedZone) return 0;
    if (
      selectedZone.free_from != null &&
      cartSubtotal >= selectedZone.free_from
    ) {
      return 0;
    }
    return selectedZone.cost;
  }, [method, selectedZone, cartSubtotal]);

  const total = cartSubtotal + deliveryCost;

  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--sf-muted)]">
        Корзина пуста.{" "}
        <Link href={`/s/${tenantSlug}/catalog`} className="underline">
          В каталог
        </Link>
      </p>
    );
  }

  function goNext() {
    setError(null);
    if (step === 1) {
      if (!name.trim() || phone.replace(/\D/g, "").length < 10) {
        setError("Укажите имя и телефон");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (method === "courier" && !address.trim()) {
        setError("Укажите адрес доставки");
        return;
      }
      if (method === "courier" && zones.length > 0 && !selectedZone) {
        setError("Выберите зону доставки");
        return;
      }
      if (settings.min_order > 0 && cartSubtotal < settings.min_order) {
        setError(`Минимальная сумма заказа: ${formatPrice(settings.min_order)}`);
        return;
      }
      setStep(3);
    }
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await placeOrderAction({
        tenantId,
        tenantSlug,
        customerName: name,
        customerPhone: phone,
        deliveryMethod: method,
        deliveryAddress: method === "courier" ? address.trim() : null,
        deliveryCost,
        items: items.map((item) => ({
          variantId: item.variantId,
          qty: item.qty,
        })),
        payOnline: settings.payment_online ? payOnline : false,
      });

      if ("error" in result) {
        setError(result.error ?? "Не удалось оформить заказ");
        return;
      }

      clear();
      navigator.vibrate?.(12);
      const qs = result.whatsappUrl
        ? `?wa=${encodeURIComponent(result.whatsappUrl)}`
        : "";
      router.push(`/s/${tenantSlug}/order/${result.orderNumber}${qs}`);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 text-[11px] tracking-[0.14em] uppercase text-[var(--sf-muted)]">
        <span className={step === 1 ? "font-medium text-[var(--sf-fg)]" : ""}>
          1. Контакты
        </span>
        <span>·</span>
        <span className={step === 2 ? "font-medium text-[var(--sf-fg)]" : ""}>
          2. Получение
        </span>
        <span>·</span>
        <span className={step === 3 ? "font-medium text-[var(--sf-fg)]" : ""}>
          3. Подтверждение
        </span>
      </div>

      {error ? (
        <p className="rounded-[11px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Имя</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Айгерим"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Телефон</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+77001234567"
              inputMode="tel"
              required
            />
          </div>
          <button type="button" className="sf-btn sf-btn-primary w-full" onClick={goNext}>
            Далее
          </button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <div className="space-y-2">
            {settings.pickup_enabled ? (
              <label className="flex items-start gap-2 rounded-[11px] border border-[var(--sf-line)] p-3 text-sm">
                <input
                  type="radio"
                  name="method"
                  checked={method === "pickup"}
                  onChange={() => setMethod("pickup")}
                />
                <span>
                  <span className="font-medium">Самовывоз</span>
                  <span className="mt-1 block text-[var(--sf-muted)]">
                    {pickupCity}
                  </span>
                </span>
              </label>
            ) : null}
            {settings.delivery_enabled ? (
              <label className="flex items-start gap-2 rounded-[11px] border border-[var(--sf-line)] p-3 text-sm">
                <input
                  type="radio"
                  name="method"
                  checked={method === "courier"}
                  onChange={() => setMethod("courier")}
                />
                <span className="font-medium">Доставка курьером</span>
              </label>
            ) : null}
          </div>

          {method === "courier" ? (
            <div className="space-y-4">
              {zones.length > 0 ? (
                <div className="space-y-2">
                  <Label>Зона</Label>
                  <select
                    className="h-9 w-full rounded-[11px] border border-[var(--sf-line)] bg-[var(--sf-surface)] px-3 text-sm"
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                  >
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name} — {formatPrice(zone.cost)}
                        {zone.eta_text ? ` · ${zone.eta_text}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="address">Адрес</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  required
                />
              </div>
            </div>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              className="sf-btn sf-btn-ghost border border-[var(--sf-line)]"
              onClick={() => setStep(1)}
            >
              Назад
            </button>
            <button
              type="button"
              className="sf-btn sf-btn-primary flex-1"
              onClick={goNext}
            >
              Далее
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <div className="space-y-2 rounded-[14px] border border-[var(--sf-line)] p-4 text-sm">
            <p>
              <span className="text-[var(--sf-muted)]">Имя:</span> {name}
            </p>
            <p>
              <span className="text-[var(--sf-muted)]">Телефон:</span> {phone}
            </p>
            <p>
              <span className="text-[var(--sf-muted)]">Получение:</span>{" "}
              {method === "pickup" ? "Самовывоз" : "Курьер"}
            </p>
            {method === "courier" ? (
              <p>
                <span className="text-[var(--sf-muted)]">Адрес:</span> {address}
              </p>
            ) : null}
            <ul className="border-t border-[var(--sf-line)] pt-2">
              {items.map((item) => (
                <li key={item.variantId}>
                  {item.title}
                  {item.size ? ` (${item.size})` : ""} × {item.qty} —{" "}
                  {formatPrice(item.unitPrice * item.qty)}
                </li>
              ))}
            </ul>
            <p className="pt-2 font-medium">
              Доставка: {formatPrice(deliveryCost)}
            </p>
            <p className="text-lg font-medium tracking-[-0.02em]">
              Итого: {formatPrice(total)}
            </p>
          </div>

          {settings.payment_online ? (
            <label className="flex items-start gap-2 rounded-[11px] border border-[var(--sf-line)] p-3 text-sm">
              <input
                type="checkbox"
                checked={payOnline}
                onChange={(e) => setPayOnline(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium">Оплатить онлайн</span>
                <span className="mt-1 block text-[var(--sf-muted)]">
                  Можно оставить выключенным и оплатить позже
                </span>
              </span>
            </label>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              className="sf-btn sf-btn-ghost border border-[var(--sf-line)]"
              onClick={() => setStep(2)}
            >
              Назад
            </button>
            <button
              type="button"
              className="sf-btn sf-btn-primary flex-1 disabled:opacity-40"
              disabled={pending}
              onClick={submit}
            >
              {pending ? "Оформляем…" : "Подтвердить заказ"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
