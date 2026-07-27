"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminMembership } from "@/lib/actions/auth";
import {
  createProductWithVariants,
  updateProductWithVariants,
  uploadProductImage,
} from "@/lib/queries/products";

export type ProductActionState = {
  error?: string;
  success?: string;
};

function parseVariants(formData: FormData) {
  const sizes = formData.getAll("variant_size").map((v) => String(v));
  const stocks = formData.getAll("variant_stock").map((v) => String(v));
  const ids = formData.getAll("variant_id").map((v) => String(v));

  const variants = sizes.map((size, index) => ({
    id: ids[index] || undefined,
    size: size.trim() ? size.trim() : null,
    stock_qty: Math.max(0, Number.parseInt(stocks[index] ?? "0", 10) || 0),
  }));

  if (variants.length === 0) {
    return [{ size: null, stock_qty: 0 }];
  }

  return variants;
}

export async function createProductAction(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const membership = await requireAdminMembership();
  const title = String(formData.get("title") ?? "").trim();
  const price = Number.parseInt(String(formData.get("price") ?? "0"), 10);
  const description = String(formData.get("description") ?? "");
  const imageUrls = formData
    .getAll("image_url")
    .map((v) => String(v))
    .filter(Boolean);

  if (!title) return { error: "Укажите название" };
  if (!Number.isFinite(price) || price < 0) {
    return { error: "Цена должна быть целым числом в тенге" };
  }

  const result = await createProductWithVariants({
    tenantId: membership.tenant_id,
    title,
    price,
    description,
    images: imageUrls,
    variants: parseVariants(formData),
  });

  if ("error" in result) {
    return { error: result.error };
  }

  revalidatePath("/admin/products");
  redirect(`/admin/products/${result.id}`);
}

export async function updateProductAction(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const membership = await requireAdminMembership();
  const productId = String(formData.get("product_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const price = Number.parseInt(String(formData.get("price") ?? "0"), 10);
  const description = String(formData.get("description") ?? "");
  const isActive = formData.get("is_active") === "on";
  const imageUrls = formData
    .getAll("image_url")
    .map((v) => String(v))
    .filter(Boolean);

  if (!productId) return { error: "Товар не найден" };
  if (!title) return { error: "Укажите название" };
  if (!Number.isFinite(price) || price < 0) {
    return { error: "Цена должна быть целым числом в тенге" };
  }

  const result = await updateProductWithVariants({
    tenantId: membership.tenant_id,
    productId,
    title,
    price,
    description,
    images: imageUrls,
    isActive,
    variants: parseVariants(formData),
  });

  if ("error" in result) {
    return { error: result.error };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  return { success: "Сохранено" };
}

export async function uploadProductImageAction(
  formData: FormData,
): Promise<{ url: string } | { error: string }> {
  const membership = await requireAdminMembership();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Выберите файл" };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: "Фото больше 5 МБ" };
  }

  return uploadProductImage(membership.tenant_id, file);
}
