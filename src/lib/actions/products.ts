"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOwner } from "@/lib/queries/auth";
import {
  createCategoryForTenant,
  createProductWithVariants,
  setProductActive,
  updateProductWithVariants,
  uploadProductImage,
} from "@/lib/queries/products";

export type ProductActionState = { error?: string; success?: string };

function parseVariants(formData: FormData) {
  const sizes = formData.getAll("variant_size").map(String);
  const stocks = formData.getAll("variant_stock").map(String);
  const ids = formData.getAll("variant_id").map(String);
  const variants = sizes.map((size, i) => ({
    id: ids[i] || undefined,
    size: size.trim() ? size.trim() : null,
    stock_qty: Math.max(0, Number.parseInt(stocks[i] ?? "0", 10) || 0),
  }));
  return variants.length ? variants : [{ size: null, stock_qty: 0 }];
}

export async function createCategoryAction(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const { membership } = await requireOwner();
  const result = await createCategoryForTenant({
    tenantId: membership.tenant_id,
    name: String(formData.get("name") ?? ""),
  });
  if ("error" in result) return { error: result.error };
  revalidatePath("/admin/products");
  return { success: "Раздел добавлен" };
}

export async function createProductAction(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const { membership } = await requireOwner();
  const title = String(formData.get("title") ?? "").trim();
  const price = Number.parseInt(String(formData.get("price") ?? "0"), 10);
  if (!title) return { error: "Укажите название" };
  if (!Number.isFinite(price) || price < 0) return { error: "Некорректная цена" };

  const result = await createProductWithVariants({
    tenantId: membership.tenant_id,
    title,
    price,
    description: String(formData.get("description") ?? ""),
    categoryId: String(formData.get("category_id") ?? "") || null,
    images: formData.getAll("image_url").map(String).filter(Boolean),
    variants: parseVariants(formData),
  });
  if ("error" in result) return { error: result.error };
  revalidatePath("/admin/products");
  redirect(`/admin/products/${result.id}`);
}

export async function updateProductAction(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const { membership } = await requireOwner();
  const productId = String(formData.get("product_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const price = Number.parseInt(String(formData.get("price") ?? "0"), 10);
  if (!productId || !title) return { error: "Заполните поля" };
  if (!Number.isFinite(price) || price < 0) return { error: "Некорректная цена" };

  const result = await updateProductWithVariants({
    tenantId: membership.tenant_id,
    productId,
    title,
    price,
    description: String(formData.get("description") ?? ""),
    categoryId: String(formData.get("category_id") ?? "") || null,
    images: formData.getAll("image_url").map(String).filter(Boolean),
    isActive: formData.get("is_active") === "on",
    variants: parseVariants(formData),
  });
  if ("error" in result) return { error: result.error };
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  return { success: "Сохранено" };
}

export async function toggleProductActiveAction(
  productId: string,
  isActive: boolean,
) {
  const { membership } = await requireOwner();
  const result = await setProductActive(
    membership.tenant_id,
    productId,
    isActive,
  );
  revalidatePath("/admin/products");
  return result;
}

export async function uploadProductImageAction(formData: FormData) {
  const { membership } = await requireOwner();
  const file = formData.get("file");
  if (!(file instanceof File) || !file.size) return { error: "Выберите файл" };
  if (file.size > 5 * 1024 * 1024) return { error: "Фото больше 5 МБ" };
  return uploadProductImage(membership.tenant_id, file);
}
