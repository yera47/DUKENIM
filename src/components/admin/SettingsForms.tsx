"use client";

import { useActionState, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteZoneAction,
  saveBrandAction,
  saveDeliveryAction,
  saveZoneAction,
  type SettingsState,
} from "@/lib/actions/settings";
import { formatPrice } from "@/lib/format-price";
import type {
  AdminDeliveryZone,
  SafeDeliverySettings,
} from "@/lib/queries/settings";

const initialState: SettingsState = {};

type BrandValues = {
  name: string;
  tagline: string | null;
  accent_color: string;
  city: string;
  phone: string;
  whatsapp: string | null;
  instagram: string | null;
};

type SettingsFormsProps = {
  brand: BrandValues;
  delivery: SafeDeliverySettings;
  zones: AdminDeliveryZone[];
};

export function SettingsForms({ brand, delivery, zones }: SettingsFormsProps) {
  const [brandState, brandAction, brandPending] = useActionState(
    saveBrandAction,
    initialState,
  );
  const [deliveryState, deliveryAction, deliveryPending] = useActionState(
    saveDeliveryAction,
    initialState,
  );
  const [zoneState, zoneAction, zonePending] = useActionState(
    saveZoneAction,
    initialState,
  );
  const [zoneError, setZoneError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, startDelete] = useTransition();

  function onDeleteZone(zoneId: string) {
    setZoneError(null);
    setDeletingId(zoneId);
    startDelete(async () => {
      const result = await deleteZoneAction(zoneId);
      setDeletingId(null);
      if ("error" in result) setZoneError(result.error);
    });
  }

  return (
    <div className="space-y-8">
      <form
        action={brandAction}
        className="space-y-4 rounded-xl border bg-white p-4"
      >
        <div>
          <h2 className="text-lg font-semibold">Бренд</h2>
          <p className="text-muted-foreground text-sm">
            Название, контакты и цвет витрины
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Название магазина</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={brand.name}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="tagline">Слоган</Label>
            <Input
              id="tagline"
              name="tagline"
              defaultValue={brand.tagline ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accent_color">Цвет акцента</Label>
            <Input
              id="accent_color"
              name="accent_color"
              type="color"
              defaultValue={brand.accent_color || "#0E5C4A"}
              className="h-10 w-20 p-1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Город</Label>
            <Input id="city" name="city" defaultValue={brand.city} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Телефон</Label>
            <Input id="phone" name="phone" required defaultValue={brand.phone} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              defaultValue={brand.whatsapp ?? ""}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              name="instagram"
              defaultValue={brand.instagram ?? ""}
            />
          </div>
        </div>

        {brandState.error ? (
          <p className="text-sm text-destructive">{brandState.error}</p>
        ) : null}
        {brandState.success ? (
          <p className="text-sm text-emerald-700">{brandState.success}</p>
        ) : null}

        <Button
          type="submit"
          disabled={brandPending}
          className="bg-[#0E5C4A] text-white hover:bg-[#0E5C4A]/90"
        >
          {brandPending ? "Сохраняем…" : "Сохранить бренд"}
        </Button>
      </form>

      <form
        action={deliveryAction}
        className="space-y-4 rounded-xl border bg-white p-4"
      >
        <div>
          <h2 className="text-lg font-semibold">Доставка и оплата</h2>
          <p className="text-muted-foreground text-sm">
            Что доступно покупателю на витрине
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="delivery_enabled"
            defaultChecked={delivery.delivery_enabled}
            className="size-4 rounded border"
          />
          Курьерская доставка
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="pickup_enabled"
            defaultChecked={delivery.pickup_enabled}
            className="size-4 rounded border"
          />
          Самовывоз
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="payment_online"
            defaultChecked={delivery.payment_online}
            className="size-4 rounded border"
          />
          Онлайн-оплата
        </label>
        <div className="space-y-2">
          <Label htmlFor="min_order">Минимальный заказ, ₸</Label>
          <Input
            id="min_order"
            name="min_order"
            type="text"
            inputMode="numeric"
            defaultValue={String(delivery.min_order)}
          />
        </div>

        {deliveryState.error ? (
          <p className="text-sm text-destructive">{deliveryState.error}</p>
        ) : null}
        {deliveryState.success ? (
          <p className="text-sm text-emerald-700">{deliveryState.success}</p>
        ) : null}

        <Button
          type="submit"
          disabled={deliveryPending}
          className="bg-[#0E5C4A] text-white hover:bg-[#0E5C4A]/90"
        >
          {deliveryPending ? "Сохраняем…" : "Сохранить доставку"}
        </Button>
      </form>

      <section className="space-y-4 rounded-xl border bg-white p-4">
        <div>
          <h2 className="text-lg font-semibold">Зоны доставки</h2>
          <p className="text-muted-foreground text-sm">
            Стоимость и бесплатный порог по районам
          </p>
        </div>

        {zones.length === 0 ? (
          <p className="text-muted-foreground text-sm">Зон пока нет</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {zones.map((zone) => (
              <li
                key={zone.id}
                className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{zone.name}</p>
                  <p className="text-muted-foreground">
                    {formatPrice(zone.cost)}
                    {zone.free_from != null
                      ? ` · бесплатно от ${formatPrice(zone.free_from)}`
                      : ""}
                    {zone.eta_text ? ` · ${zone.eta_text}` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pendingDelete && deletingId === zone.id}
                  onClick={() => onDeleteZone(zone.id)}
                >
                  Удалить
                </Button>
              </li>
            ))}
          </ul>
        )}

        {zoneError ? (
          <p className="text-sm text-destructive">{zoneError}</p>
        ) : null}

        <form action={zoneAction} className="space-y-3 border-t pt-4">
          <p className="text-sm font-medium">Добавить зону</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="zone_name">Название</Label>
              <Input id="zone_name" name="name" required placeholder="Центр" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Стоимость, ₸</Label>
              <Input
                id="cost"
                name="cost"
                type="text"
                inputMode="numeric"
                defaultValue="1000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="free_from">Бесплатно от, ₸</Label>
              <Input
                id="free_from"
                name="free_from"
                type="text"
                inputMode="numeric"
                placeholder="20000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eta_text">Срок</Label>
              <Input
                id="eta_text"
                name="eta_text"
                placeholder="1–2 часа"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort_order">Порядок</Label>
              <Input
                id="sort_order"
                name="sort_order"
                type="text"
                inputMode="numeric"
                defaultValue="0"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked
              className="size-4 rounded border"
            />
            Активна
          </label>
          {zoneState.error ? (
            <p className="text-sm text-destructive">{zoneState.error}</p>
          ) : null}
          {zoneState.success ? (
            <p className="text-sm text-emerald-700">{zoneState.success}</p>
          ) : null}
          <Button
            type="submit"
            disabled={zonePending}
            variant="outline"
          >
            {zonePending ? "Добавляем…" : "Добавить зону"}
          </Button>
        </form>
      </section>
    </div>
  );
}
