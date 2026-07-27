import { createClient } from "@/lib/supabase/server";
import type { Tables, TablesInsert } from "@/types/database";

export type ProductCategory = Pick<
  Tables<"categories">,
  "id" | "name" | "slug" | "sort_order" | "is_active"
>;

export type ProductWithVariants = Tables<"products"> & {
  categories: ProductCategory | null;
  product_variants: Tables<"product_variants">[];
};

export type VariantInput = {
  size: string | null;
  stock_qty: number;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function listCategoriesForTenant(
  tenantId: string,
): Promise<ProductCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, sort_order, is_active")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data;
}

export async function createCategoryForTenant(input: {
  tenantId: string;
  name: string;
}): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const name = input.name.trim();
  if (!name) return { error: "Укажите название раздела" };

  const baseSlug = slugify(name) || "category";
  let slug = baseSlug;
  let attempt = 1;

  while (attempt < 20) {
    const { data: exists } = await supabase
      .from("categories")
      .select("id")
      .eq("tenant_id", input.tenantId)
      .eq("slug", slug)
      .maybeSingle();

    if (!exists) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  const { error } = await supabase.from("categories").insert({
    tenant_id: input.tenantId,
    name,
    slug,
    is_active: true,
  });

  if (error) return { error: "Не удалось создать раздел" };
  return { ok: true };
}

export async function listProductsForTenant(
  tenantId: string,
): Promise<ProductWithVariants[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(id, name, slug, sort_order, is_active), product_variants(*)")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as ProductWithVariants[];
}

export async function getProductForTenant(
  tenantId: string,
  productId: string,
): Promise<ProductWithVariants | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(id, name, slug, sort_order, is_active), product_variants(*)")
    .eq("tenant_id", tenantId)
    .eq("id", productId)
    .maybeSingle();

  if (error || !data) return null;
  return data as ProductWithVariants;
}

export async function createProductWithVariants(input: {
  tenantId: string;
  title: string;
  price: number;
  description?: string | null;
  images: string[];
  categoryId?: string | null;
  variants: VariantInput[];
}): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Нужно войти в аккаунт" };

  const variants =
    input.variants.length > 0
      ? input.variants
      : [{ size: null, stock_qty: 0 }];

  const productInsert: TablesInsert<"products"> = {
    tenant_id: input.tenantId,
    title: input.title.trim(),
    price: input.price,
    description: input.description?.trim() || null,
    images: input.images,
    category_id: input.categoryId ?? null,
    is_active: true,
  };

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert(productInsert)
    .select("id")
    .single();

  if (productError || !product) {
    return { error: "Не удалось создать товар" };
  }

  const variantRows: TablesInsert<"product_variants">[] = variants.map((v) => ({
    product_id: product.id,
    tenant_id: input.tenantId,
    size: v.size?.trim() ? v.size.trim() : null,
    stock_qty: 0,
    is_active: true,
    price_delta: 0,
  }));

  const { data: createdVariants, error: variantError } = await supabase
    .from("product_variants")
    .insert(variantRows)
    .select("id, size");

  if (variantError || !createdVariants) {
    await supabase.from("products").delete().eq("id", product.id);
    return { error: "Не удалось создать варианты товара" };
  }

  const movements = createdVariants
    .map((variant, index) => {
      const qty = variants[index]?.stock_qty ?? 0;
      if (qty <= 0) return null;
      return {
        tenant_id: input.tenantId,
        variant_id: variant.id,
        delta: qty,
        reason: "restock" as const,
        staff_id: user.id,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (movements.length > 0) {
    const { error: stockError } = await supabase
      .from("stock_movements")
      .insert(movements);

    if (stockError) {
      return {
        error:
          "Товар создан, но не удалось проставить остатки. Отредактируйте товар.",
      };
    }
  }

  return { id: product.id };
}

export async function updateProductWithVariants(input: {
  tenantId: string;
  productId: string;
  title: string;
  price: number;
  description?: string | null;
  images: string[];
  categoryId?: string | null;
  isActive: boolean;
  variants: Array<VariantInput & { id?: string }>;
}): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Нужно войти в аккаунт" };

  const { error: productError } = await supabase
    .from("products")
    .update({
      title: input.title.trim(),
      price: input.price,
      description: input.description?.trim() || null,
      images: input.images,
      category_id: input.categoryId ?? null,
      is_active: input.isActive,
    })
    .eq("id", input.productId)
    .eq("tenant_id", input.tenantId);

  if (productError) {
    return { error: "Не удалось обновить товар" };
  }

  const { data: existingVariants } = await supabase
    .from("product_variants")
    .select("id, stock_qty")
    .eq("product_id", input.productId)
    .eq("tenant_id", input.tenantId);

  const existingById = new Map(
    (existingVariants ?? []).map((v) => [v.id, v.stock_qty]),
  );
  const keepIds = new Set(
    input.variants.map((v) => v.id).filter((id): id is string => Boolean(id)),
  );

  for (const existing of existingVariants ?? []) {
    if (!keepIds.has(existing.id)) {
      await supabase
        .from("product_variants")
        .update({ is_active: false })
        .eq("id", existing.id);
    }
  }

  for (const variant of input.variants) {
    const size = variant.size?.trim() ? variant.size.trim() : null;
    const desiredQty = Math.max(0, Math.round(variant.stock_qty));

    if (variant.id && existingById.has(variant.id)) {
      const currentQty = existingById.get(variant.id) ?? 0;
      await supabase
        .from("product_variants")
        .update({ size, is_active: true })
        .eq("id", variant.id)
        .eq("tenant_id", input.tenantId);

      const delta = desiredQty - currentQty;
      if (delta !== 0) {
        const { error: stockError } = await supabase
          .from("stock_movements")
          .insert({
            tenant_id: input.tenantId,
            variant_id: variant.id,
            delta,
            reason: delta > 0 ? "restock" : "correction",
            staff_id: user.id,
          });
        if (stockError) {
          return { error: "Не удалось обновить остаток" };
        }
      }
    } else {
      const { data: created, error: createError } = await supabase
        .from("product_variants")
        .insert({
          product_id: input.productId,
          tenant_id: input.tenantId,
          size,
          stock_qty: 0,
          is_active: true,
          price_delta: 0,
        })
        .select("id")
        .single();

      if (createError || !created) {
        return { error: "Не удалось добавить вариант" };
      }

      if (desiredQty > 0) {
        const { error: stockError } = await supabase
          .from("stock_movements")
          .insert({
            tenant_id: input.tenantId,
            variant_id: created.id,
            delta: desiredQty,
            reason: "restock",
            staff_id: user.id,
          });
        if (stockError) {
          return { error: "Не удалось проставить остаток нового размера" };
        }
      }
    }
  }

  return { ok: true };
}

export async function uploadProductImage(
  tenantId: string,
  file: File,
): Promise<{ url: string } | { error: string }> {
  const { createServiceClient } = await import("@/lib/supabase/service");
  const supabase = createServiceClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${tenantId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/jpeg",
    });

  if (error) {
    return { error: "Не удалось загрузить фото" };
  }

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return { url: data.publicUrl };
}
