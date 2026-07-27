import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1)];
    }),
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const TENANT_ID = "00000000-0000-4000-8000-000000000001";
const ASSETS =
  "C:/Users/Yersat/.cursor/projects/c-Users-Yersat-OneDrive-DUKENIM/assets";

const PRODUCTS = [
  {
    title: "Голубая рубашка",
    price: 13000,
    description: "Классическая рубашка из плотного хлопка.",
    categorySlug: "clothes",
    sizes: ["S", "M", "L"],
    file: "product-shirt.png",
    featured: true,
  },
  {
    title: "Белые кроссовки",
    price: 28900,
    description: "Минималистичные кроссовки на каждый день.",
    categorySlug: "shoes",
    sizes: ["40", "41", "42", "43"],
    file: "product-sneakers.png",
    featured: true,
  },
  {
    title: "Ремень из кожи",
    price: 9900,
    description: "Тонкий кожаный ремень.",
    categorySlug: "clothes",
    sizes: ["M", "L"],
    file: "product-belt.png",
    featured: false,
  },
  {
    title: "Пальто из шерсти",
    price: 64900,
    description: "Длинное пальто свободного кроя.",
    categorySlug: "clothes",
    sizes: ["S", "M", "L"],
    file: "product-coat.png",
    featured: true,
  },
  {
    title: "Букет белых роз",
    price: 15900,
    description: "Свежий букет в крафт-обёртке.",
    categorySlug: "new",
    sizes: [null],
    file: "product-flowers.png",
    featured: true,
  },
  {
    title: "Шерстяные брюки",
    price: 24900,
    description: "Прямые брюки из шерстяной ткани.",
    categorySlug: "clothes",
    sizes: ["46", "48", "50"],
    file: "product-trousers.png",
    featured: false,
  },
];

async function ensureCategory(name, slug, sortOrder) {
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("tenant_id", TENANT_ID)
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("categories")
      .update({ name, is_active: true, sort_order: sortOrder })
      .eq("id", existing.id);
    return existing.id;
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({
      tenant_id: TENANT_ID,
      name,
      slug,
      is_active: true,
      sort_order: sortOrder,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function uploadImage(fileName) {
  const filePath = path.join(ASSETS, fileName);
  const bytes = fs.readFileSync(filePath);
  const storagePath =
    TENANT_ID + "/catalog/" + Date.now() + "-" + fileName;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(storagePath, bytes, {
      contentType: "image/png",
      upsert: true,
    });
  if (error) throw error;
  return supabase.storage.from("product-images").getPublicUrl(storagePath).data
    .publicUrl;
}

async function upsertProduct(product, categoryId, imageUrl) {
  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("tenant_id", TENANT_ID)
    .eq("title", product.title)
    .maybeSingle();

  let productId = existing?.id;
  if (!productId) {
    const { data, error } = await supabase
      .from("products")
      .insert({
        tenant_id: TENANT_ID,
        title: product.title,
        price: product.price,
        description: product.description,
        images: [imageUrl],
        category_id: categoryId,
        is_active: true,
        is_featured: product.featured,
      })
      .select("id")
      .single();
    if (error) throw error;
    productId = data.id;

    for (const size of product.sizes) {
      const { error: vErr } = await supabase.from("product_variants").insert({
        tenant_id: TENANT_ID,
        product_id: productId,
        size,
        stock_qty: 5,
        is_active: true,
        price_delta: 0,
      });
      if (vErr) throw vErr;
    }
  } else {
    const { error } = await supabase
      .from("products")
      .update({
        price: product.price,
        description: product.description,
        images: [imageUrl],
        category_id: categoryId,
        is_active: true,
        is_featured: product.featured,
      })
      .eq("id", productId);
    if (error) throw error;
  }
  return productId;
}

async function main() {
  const t1 = await supabase
    .from("tenants")
    .update({
      name: "Dukenim",
      city: "Астана",
      address: "пр. Кабанбай батыра, 1",
      tagline: "Тихая коллекция на каждый день",
      accent_color: "#1F5F4E",
    })
    .eq("id", TENANT_ID);
  if (t1.error) throw t1.error;

  const { data: zones } = await supabase
    .from("delivery_zones")
    .select("id")
    .eq("tenant_id", TENANT_ID);
  for (const zone of zones ?? []) {
    await supabase
      .from("delivery_zones")
      .update({ name: "Астана", eta_text: "1-3 часа" })
      .eq("id", zone.id);
  }

  const categoryIds = {
    new: await ensureCategory("Новинки", "new", 1),
    clothes: await ensureCategory("Одежда", "clothes", 2),
    shoes: await ensureCategory("Обувь", "shoes", 3),
  };

  // Hide demo English product from storefront if present
  await supabase
    .from("products")
    .update({ is_active: false })
    .eq("tenant_id", TENANT_ID)
    .eq("title", "Test Order Product");

  const created = [];
  for (const product of PRODUCTS) {
    const imageUrl = await uploadImage(product.file);
    const id = await upsertProduct(
      product,
      categoryIds[product.categorySlug],
      imageUrl,
    );
    created.push({ title: product.title, id, imageUrl });
  }

  const check = await supabase
    .from("tenants")
    .select("name,city,tagline")
    .eq("id", TENANT_ID)
    .single();

  console.log(
    JSON.stringify(
      {
        tenant: check.data,
        categories: Object.keys(categoryIds),
        products: created.map((p) => p.title),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
