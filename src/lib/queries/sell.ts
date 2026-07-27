import { createClient } from "@/lib/supabase/server";
import type { PublicProduct } from "@/lib/queries/catalog";

/** Поиск товаров для экрана «Продали в зале». */
export async function searchProductsForSell(
  tenantId: string,
  query: string,
): Promise<PublicProduct[]> {
  const supabase = await createClient();
  const q = query.trim();

  let request = supabase
    .from("products")
    .select(
      "id, tenant_id, category_id, title, description, price, old_price, images, is_featured, sort_order, product_variants(id, size, color, stock_qty, price_delta, is_active)",
    )
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("title", { ascending: true })
    .limit(20);

  if (q) {
    request = request.ilike("title", `%${q}%`);
  }

  const { data, error } = await request;
  if (error || !data) return [];
  return data as PublicProduct[];
}
