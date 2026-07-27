"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
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
  pickupAddress: string | null;
};

type Step = 1 | 2 | 3;

export function CheckoutForm({
  tenantId,
  tenantSlug,
  settings,
  zones,
  pickupAddress,
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
  const [comment, setComment] = useState("");
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
      <p className="text-muted-foreground text-sm">
        Корзина пуста.{" "}
        <a href={`/s/${tenantSlug}/catalog`} className="underline">
          В каталог
        </a>
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
      if (method === "courier" && !selectedZone) {
        setError("Выберите зону доставки");
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
        deliveryAddress: method === "courier" ? address : pickupAddress,
        deliveryComment: comment,
        deliveryCost,
        items: items.map((item) => ({
          variantId: item.variantId,
          qty: item.qty,
        })),
      });

      if (result.error || !result.orderNumber) {
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
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
          <Button type="button" className="w-full" onClick={goNext}>
            Далее
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <div className="space-y-2">
            {settings.pickup_enabled ? (
              <label className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                <input
                  type="radio"
                  name="method"
                  checked={method === "pickup"}
                  onChange={() => setMethod("pickup")}
                />
                <span>
                  <span className="font-medium">Самовывоз</span>
                  {pickupAddress ? (
                    <span className="text-muted-foreground mt-1 block">
                      {pickupAddress}
                    </span>
                  ) : null}
                </span>
              </label>
            ) : null}
            {settings.delivery_enabled ? (
              <label className="flex items-start gap-2 rounded-lg border p-3 text-sm">
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
                    className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm"
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
              {settings.delivery_note ? (
                <p className="text-muted-foreground text-xs">
                  {settings.delivery_note}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="comment">Комментарий</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Назад
            </Button>
            <Button type="button" className="flex-1" onClick={goNext}>
              Далее
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <div className="space-y-2 rounded-xl border p-4 text-sm">
            <p>
              <span className="text-muted-foreground">Имя:</span> {name}
            </p>
            <p>
              <span className="text-muted-foreground">Телефон:</span> {phone}
            </p>
            <p>
              <span className="text-muted-foreground">Получение:</span>{" "}
              {method === "pickup" ? "Самовывоз" : "Курьер"}
            </p>
            {method === "courier" ? (
              <p>
                <span className="text-muted-foreground">Адрес:</span> {address}
              </p>
            ) : null}
            <ul className="border-t pt-2">
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
            <p className="text-lg font-semibold">Итого: {formatPrice(total)}</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>
              Назад
            </Button>
            <Button
              type="button"
              className="sf-btn sf-btn-primary flex-1"
              disabled={pending}
              onClick={submit}
            >
              {pending ? "Оформляем…" : "Подтвердить заказ"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
