import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const tid = "00000000-0000-4000-8000-000000000001";
const { count } = await sb
  .from("products")
  .select("*", { count: "exact", head: true })
  .eq("tenant_id", tid);

console.log("products", count);
if ((count ?? 0) > 0) process.exit(0);

const { data: cats } = await sb
  .from("categories")
  .select("id")
  .eq("tenant_id", tid)
  .limit(1);
const cat = cats?.[0]?.id ?? null;

const { data: p, error } = await sb
  .from("products")
  .insert({
    tenant_id: tid,
    category_id: cat,
    title: "Демо худи",
    description: "Тестовый товар витрины",
    price: 15900,
    images: [],
    is_active: true,
    is_featured: true,
  })
  .select("id")
  .single();

if (error) {
  console.error(error);
  process.exit(1);
}

const { data: v, error: ve } = await sb
  .from("product_variants")
  .insert([
    { product_id: p.id, tenant_id: tid, size: "M", stock_qty: 0, is_active: true },
    { product_id: p.id, tenant_id: tid, size: "L", stock_qty: 0, is_active: true },
  ])
  .select("id");

if (ve) {
  console.error(ve);
  process.exit(1);
}

await sb.from("stock_movements").insert(
  v.map((x) => ({
    tenant_id: tid,
    variant_id: x.id,
    delta: 5,
    reason: "restock",
  })),
);

console.log("seeded product", p.id);
