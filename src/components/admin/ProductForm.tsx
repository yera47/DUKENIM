"use client";

import { useActionState, useState, useTransition } from "react";

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

type VariantDraft = {
  id?: string;
  size: string;
  stock_qty: number;
};

type ProductFormProps = {
  mode: "create" | "edit";
  productId?: string;
  initial?: {
    title: string;
    price: number;
    description: string | null;
    images: string[];
    is_active: boolean;
    variants: VariantDraft[];
  };
};

const initialState: ProductActionState = {};

export function ProductForm({ mode, productId, initial }: ProductFormProps) {
  const action = mode === "create" ? createProductAction : updateProductAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [variants, setVariants] = useState<VariantDraft[]>(
    initial?.variants?.length
      ? initial.variants
      : [{ size: "", stock_qty: 0 }],
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();

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
      {productId ? <input type="hidden" name="product_id" value={productId} /> : null}

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
          <p className="text-muted-foreground text-xs">Загружаем…</p>
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
                className="absolute -right-1 -top-1 rounded-full bg-background px-1 text-xs shadow"
                onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
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

      <div className="space-y-2">
        <Label htmlFor="price">Цена, ₸</Label>
        <Input
          id="price"
          name="price"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          required
          defaultValue={initial?.price ?? ""}
          placeholder="15000"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Label>Размеры и остатки</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setVariants((prev) => [...prev, { size: "", stock_qty: 0 }])
            }
          >
            + размер
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          Без размеров оставьте одну строку пустой — будет один вариант.
        </p>
        <div className="space-y-2">
          {variants.map((variant, index) => (
            <div key={variant.id ?? `new-${index}`} className="flex gap-2">
              {variant.id ? (
                <input type="hidden" name="variant_id" value={variant.id} />
              ) : (
                <input type="hidden" name="variant_id" value="" />
              )}
              <Input
                name="variant_size"
                placeholder="S / M / L или пусто"
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
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                className="w-28"
                value={variant.stock_qty}
                onChange={(e) => {
                  const value = Number.parseInt(e.target.value || "0", 10) || 0;
                  setVariants((prev) =>
                    prev.map((row, i) =>
                      i === index ? { ...row, stock_qty: value } : row,
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
        <Label htmlFor="description">Описание (необязательно)</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initial?.description ?? ""}
        />
      </div>

      {mode === "edit" ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={initial?.is_active ?? true}
          />
          Товар активен на витрине
        </label>
      ) : null}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending
          ? "Сохраняем…"
          : mode === "create"
            ? "Добавить товар"
            : "Сохранить"}
      </Button>
    </form>
  );
}
