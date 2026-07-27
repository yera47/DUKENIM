"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteZoneAction,
  saveBrandAction,
  saveDeliverySettingsAction,
  saveZoneAction,
  uploadLogoAction,
  type SettingsActionState,
} from "@/lib/actions/settings";
import { formatPrice } from "@/lib/format-price";
import type {
  AdminDeliveryZone,
  BrandSettings,
  SafeDeliverySettings,
} from "@/lib/queries/settings";

const initial: SettingsActionState = {};

type SettingsFormsProps = {
  brand: BrandSettings;
  delivery: SafeDeliverySettings;
  zones: AdminDeliveryZone[];
};

export function SettingsForms({ brand, delivery, zones }: SettingsFormsProps) {
  const router = useRouter();
  const [brandState, brandAction, brandPending] = useActionState(
    saveBrandAction,
    initial,
  );
  const [deliveryState, deliveryAction, deliveryPending] = useActionState(
    saveDeliverySettingsAction,
    initial,
  );
  const [zoneState, zoneAction, zonePending] = useActionState(
    saveZoneAction,
    initial,
  );
  const [logoUrl, setLogoUrl] = useState(brand.logo_url ?? "");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [zoneMsg, setZoneMsg] = useState<string | null>(null);

  function onLogo(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    const body = new FormData();
    body.set("file", file);
    startUpload(async () => {
      setUploadError(null);
      const result = await uploadLogoAction(body);
      if ("error" in result) {
        setUploadError(result.error);
        return;
      }
      setLogoUrl(result.url);
    });
  }

  return (
    <div className="space-y-10">
      <section className="space-y-4 rounded-xl border bg-background p-4">
        <h2 className="text-lg font-medium">Бренд</h2>
        {brandState.error ? (
          <p className="text-sm text-destructive">{brandState.error}</p>
        ) : null}
        {brandState.success ? (
          <p className="text-sm text-emerald-700">{brandState.success}</p>
        ) : null}

        <form action={brandAction} className="space-y-4">
          <input type="hidden" name="logo_url" value={logoUrl} />
          <div className="space-y-2">
            <Label>Логотип</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => onLogo(e.target.files)}
            />
            {uploading ? (
              <p className="text-muted-foreground text-xs">Загружаем…</p>
            ) : null}
            {uploadError ? (
              <p className="text-sm text-destructive">{uploadError}</p>
            ) : null}
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="size-16 rounded-md object-cover"
              />
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Название</Label>
              <Input id="name" name="name" required defaultValue={brand.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accent_color">Цвет</Label>
              <Input
                id="accent_color"
                name="accent_color"
                type="color"
                defaultValue={brand.accent_color || "#1F5F4E"}
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
              <Label htmlFor="city">Город</Label>
              <Input id="city" name="city" defaultValue={brand.city} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                name="phone"
                required
                defaultValue={brand.phone}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                defaultValue={brand.whatsapp ?? ""}
                placeholder="77001234567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                name="instagram"
                defaultValue={brand.instagram ?? ""}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Адрес (самовывоз)</Label>
              <Input
                id="address"
                name="address"
                defaultValue={brand.address ?? ""}
              />
            </div>
          </div>
          <Button type="submit" disabled={brandPending}>
            {brandPending ? "Сохраняем…" : "Сохранить бренд"}
          </Button>
        </form>
      </section>

      <section className="space-y-4 rounded-xl border bg-background p-4">
        <h2 className="text-lg font-medium">Доставка и самовывоз</h2>
        {deliveryState.error ? (
          <p className="text-sm text-destructive">{deliveryState.error}</p>
        ) : null}
        {deliveryState.success ? (
          <p className="text-sm text-emerald-700">{deliveryState.success}</p>
        ) : null}
        <form action={deliveryAction} className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="pickup_enabled"
              defaultChecked={delivery.pickup_enabled}
            />
            Самовывоз включён
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="delivery_enabled"
              defaultChecked={delivery.delivery_enabled}
            />
            Доставка курьером включена
          </label>
          <div className="space-y-2">
            <Label htmlFor="min_order">Минимальный заказ, ₸</Label>
            <Input
              id="min_order"
              name="min_order"
              type="number"
              min={0}
              step={1}
              defaultValue={delivery.min_order}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delivery_note">Текст про доставку</Label>
            <Textarea
              id="delivery_note"
              name="delivery_note"
              rows={3}
              defaultValue={delivery.delivery_note ?? ""}
              placeholder="Доставка по городу в день заказа"
            />
          </div>
          <Button type="submit" disabled={deliveryPending}>
            {deliveryPending ? "Сохраняем…" : "Сохранить доставку"}
          </Button>
        </form>
      </section>

      <section className="space-y-4 rounded-xl border bg-background p-4">
        <h2 className="text-lg font-medium">Зоны доставки</h2>
        {zoneState.error ? (
          <p className="text-sm text-destructive">{zoneState.error}</p>
        ) : null}
        {zoneState.success ? (
          <p className="text-sm text-emerald-700">{zoneState.success}</p>
        ) : null}
        {zoneMsg ? <p className="text-sm text-emerald-700">{zoneMsg}</p> : null}

        <ul className="space-y-2 text-sm">
          {zones.map((zone) => (
            <li
              key={zone.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
            >
              <div>
                <p className="font-medium">
                  {zone.name} {!zone.is_active ? "(выкл)" : ""}
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatPrice(zone.cost)}
                  {zone.free_from != null
                    ? ` · бесплатно от ${formatPrice(zone.free_from)}`
                    : ""}
                  {zone.eta_text ? ` · ${zone.eta_text}` : ""}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={deleting}
                onClick={() => {
                  startDelete(async () => {
                    const result = await deleteZoneAction(zone.id);
                    setZoneMsg(result.success ?? result.error ?? null);
                    router.refresh();
                  });
                }}
              >
                Удалить
              </Button>
            </li>
          ))}
        </ul>

        <form action={zoneAction} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="zone_name">Новая зона</Label>
            <Input id="zone_name" name="name" required placeholder="Астана" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost">Стоимость, ₸</Label>
            <Input id="cost" name="cost" type="number" min={0} defaultValue={0} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="free_from">Бесплатно от, ₸</Label>
            <Input id="free_from" name="free_from" type="number" min={0} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eta_text">Срок</Label>
            <Input id="eta_text" name="eta_text" placeholder="1–3 часа" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sort_order">Порядок</Label>
            <Input
              id="sort_order"
              name="sort_order"
              type="number"
              defaultValue={0}
            />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="is_active" defaultChecked />
            Активна
          </label>
          <Button type="submit" disabled={zonePending} className="sm:col-span-2">
            {zonePending ? "Добавляем…" : "Добавить зону"}
          </Button>
        </form>
      </section>
    </div>
  );
}
