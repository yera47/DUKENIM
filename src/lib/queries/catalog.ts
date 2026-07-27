import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Tables } from "@/types/database";

export type PublicCategory = Pick<
  Tables<"categories">,
  "id" | "name" | "slug" | "sort_order"
>;

export type PublicVariant = Pick<
  Tables<"product_variants">,
  "id" | "size" | "color" | "stock_qty" | "price_delta" | "is_active"
>;

export type PublicProduct = Pick<
  Tables<"products">,
  | "id"
  | "tenant_id"
  | "category_id"
  | "title"
  | "description"
  | "price"
  | "old_price"
  | "images"
  | "is_featured"
  | "sort_order"
> & {
  product_variants: PublicVariant[];
};

export type PublicSettings = {
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  delivery_note: string | null;
  min_order: number;
};

export async function listPublicCategories(
  tenantId: string,
): Promise<PublicCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, sort_order")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data;
}

export async function getPublicCategoryBySlug(
  tenantId: string,
  slug: string,
): Promise<PublicCategory | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, sort_order")
    .eq("tenant_id", tenantId)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function listPublicProducts(
  tenantId: string,
  options?: { categoryId?: string; featuredOnly?: boolean },
): Promise<PublicProduct[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(
      "id, tenant_id, category_id, title, description, price, old_price, images, is_featured, sort_order, product_variants(id, size, color, stock_qty, price_delta, is_active)",
    )
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (options?.categoryId) {
    query = query.eq("category_id", options.categoryId);
  }
  if (options?.featuredOnly) {
    query = query.eq("is_featured", true);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as PublicProduct[];
}

export async function getPublicProduct(
  tenantId: string,
  productId: string,
): Promise<PublicProduct | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, tenant_id, category_id, title, description, price, old_price, images, is_featured, sort_order, product_variants(id, size, color, stock_qty, price_delta, is_active)",
    )
    .eq("tenant_id", tenantId)
    .eq("id", productId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as PublicProduct;
}

/** Безопасные поля настроек — без merchant_key / merchant_id. */
export async function getPublicSettings(
  tenantId: string,
): Promise<PublicSettings> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("tenant_settings")
    .select(
      "delivery_enabled, pickup_enabled, delivery_note, min_order",
    )
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error || !data) {
    return {
      delivery_enabled: true,
      pickup_enabled: true,
      delivery_note: null,
      min_order: 0,
    };
  }

  return {
    delivery_enabled: data.delivery_enabled,
    pickup_enabled: data.pickup_enabled,
    delivery_note: data.delivery_note,
    min_order: data.min_order,
  };
}

export type PublicDeliveryZone = Pick<
  Tables<"delivery_zones">,
  "id" | "name" | "cost" | "free_from" | "eta_text"
>;

export async function listPublicDeliveryZones(
  tenantId: string,
): Promise<PublicDeliveryZone[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("id, name, cost, free_from, eta_text")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data;
}
