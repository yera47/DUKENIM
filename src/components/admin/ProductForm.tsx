"use client";

import { useActionState, useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createProductAction,
  updateProductAction,
  uploadProductImageAction,
  type ProductActionState,
} from "@/lib/actions/products";
import type { ProductCategory } from "@/lib/queries/products";

type VariantDraft = {
  id?: string;
  size: string;
  stockQty: string;
};

type ProductFormProps = {
  mode: "create" | "edit";
  productId?: string;
  categories: ProductCategory[];
  initial?: {
    title: string;
    price: number;
    category_id: string | null;
    description: string | null;
    images: string[];
    is_active: boolean;
    variants: Array<{ id?: string; size: string | null; stock_qty: number }>;
  };
};

const initialState: ProductActionState = {};

export function ProductForm({
  mode,
  productId,
  categories,
  initial,
}: ProductFormProps) {
  const action = mode === "create" ? createProductAction : updateProductAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [variants, setVariants] = useState<VariantDraft[]>(
    initial?.variants?.length
      ? initial.variants.map((variant) => ({
          id: variant.id,
          size: variant.size ?? "",
          stockQty: String(variant.stock_qty),
        }))
      : [{ size: "", stockQty: "0" }],
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();

  const categoryOptions = useMemo(
    () => categories.filter((category) => category.is_active),
    [categories],
  );

  function onFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    const body = new FormData();
    body.set("file", file);

    startUpload(async () => {
      setUploadError(null);
      const result = await uploadProductImageAction(body);
      if ("error" in result) {
        setUploadError(result.error);
        return;
      }
      setImages((prev) => [...prev, result.url]);
    });
  }

  return (
    <form action={formAction} className="space-y-6">
      {productId ? (
        <input type="hidden" name="product_id" value={productId} />
      ) : null}

      {state.error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label>Фото</Label>
        <Input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => onFileChange(e.target.files)}
          disabled={uploading}
        />
        {uploading ? (
          <p className="text-muted-foreground text-xs">Загрузка…</p>
        ) : null}
        {uploadError ? (
          <p className="text-sm text-destructive">{uploadError}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {images.map((url) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="size-20 rounded-md object-cover"
              />
              <input type="hidden" name="image_url" value={url} />
              <button
                type="button"
                className="absolute -top-1 -right-1 rounded-full bg-white px-1 text-xs shadow"
                onClick={() =>
                  setImages((prev) => prev.filter((item) => item !== url))
                }
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Название</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={initial?.title ?? ""}
          placeholder="Футболка oversize"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">Цена, ₸</Label>
          <Input
            id="price"
            name="price"
            type="text"
            inputMode="numeric"
            required
            defaultValue={
              initial?.price != null ? String(initial.price) : ""
            }
            placeholder="15000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category_id">Раздел</Label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={initial?.category_id ?? ""}
            className="border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm"
          >
            <option value="">Без раздела</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Label>Размеры и остатки</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setVariants((prev) => [...prev, { size: "", stockQty: "0" }])
            }
          >
            + Размер
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          Без размера оставьте поле пустым — будет один вариант.
        </p>
        <div className="space-y-2">
          {variants.map((variant, index) => (
            <div
              key={variant.id ?? `new-${index}`}
              className="flex flex-wrap gap-2"
            >
              <input type="hidden" name="variant_id" value={variant.id ?? ""} />
              <Input
                name="variant_size"
                placeholder="S / M / L или пусто"
                className="min-w-[10rem] flex-1"
                value={variant.size}
                onChange={(e) => {
                  const value = e.target.value;
                  setVariants((prev) =>
                    prev.map((row, i) =>
                      i === index ? { ...row, size: value } : row,
                    ),
                  );
                }}
              />
              <Input
                name="variant_stock"
                type="text"
                inputMode="numeric"
                className="w-28"
                value={variant.stockQty}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value !== "" && !/^\d+$/.test(value)) return;
                  setVariants((prev) =>
                    prev.map((row, i) =>
                      i === index ? { ...row, stockQty: value } : row,
                    ),
                  );
                }}
              />
              {variants.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setVariants((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  ×
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Описание</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={initial?.description ?? ""}
          placeholder="Состав, посадка, уход…"
        />
      </div>

      {mode === "edit" ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={initial?.is_active ?? true}
            className="size-4 rounded border"
          />
          Товар виден на витрине
        </label>
      ) : null}

      <Button
        type="submit"
        disabled={pending || uploading}
        className="bg-[#0E5C4A] text-white hover:bg-[#0E5C4A]/90"
      >
        {pending
          ? "Сохраняем…"
          : mode === "create"
            ? "Создать товар"
            : "Сохранить"}
      </Button>
    </form>
  );
}
