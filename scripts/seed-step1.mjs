import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(ROOT, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1)];
    }),
);

const PROJECT_REF = "gklgbesydbottkqilihb";
const TENANT_ID = "00000000-0000-4000-8000-000000000001";

const OWNER_EMAIL = "owner@test.dukenim.local";
const OWNER_PASSWORD = "OwnerTest123!";
const ADMIN_EMAIL = "superadmin@dukenim.local";
const ADMIN_PASSWORD = "SuperAdmin123!";

const service = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

async function runSql(sql) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "Нет SUPABASE_ACCESS_TOKEN. Открой SQL Editor в Supabase и выполни файл supabase/migrations/20260803100000_step1_schema.sql, затем снова запусти этот скрипт с флагом --users-only",
    );
  }

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    },
  );

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`SQL failed (${res.status}): ${text}`);
  }
  return text;
}

async function ensureUser(email, password) {
  const listed = await service.auth.admin.listUsers({ perPage: 200 });
  if (listed.error) throw listed.error;
  const existing = listed.data.users.find((u) => u.email === email);
  if (existing) return existing.id;

  const created = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error) throw created.error;
  return created.data.user.id;
}

async function seedDataAndUsers() {
  // Tenant seed via JS (idempotent)
  await service.from("tenants").upsert({
    id: TENANT_ID,
    slug: "test",
    name: "Test Shop",
    tagline: "Тестовый магазин Dukenim",
    accent_color: "#0E5C4A",
    city: "Астана",
    phone: "+77001234567",
    whatsapp: "77001234567",
    plan: "standard",
    status: "active",
  });

  await service.from("tenant_settings").upsert({
    tenant_id: TENANT_ID,
    delivery_enabled: true,
    pickup_enabled: true,
    min_order: 0,
  });

  const { data: sub } = await service
    .from("subscriptions")
    .select("id")
    .eq("tenant_id", TENANT_ID)
    .maybeSingle();
  if (!sub) {
    await service.from("subscriptions").insert({
      tenant_id: TENANT_ID,
      plan: "standard",
      status: "active",
      current_period_end: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    });
  }

  await service.from("categories").upsert({
    id: "00000000-0000-4000-8000-000000000010",
    tenant_id: TENANT_ID,
    name: "Новинки",
    slug: "new",
    sort_order: 1,
    is_active: true,
  });

  const { data: zones } = await service
    .from("delivery_zones")
    .select("id")
    .eq("tenant_id", TENANT_ID)
    .limit(1);
  if (!zones?.length) {
    await service.from("delivery_zones").insert({
      tenant_id: TENANT_ID,
      name: "Астана",
      cost: 1500,
      free_from: 25000,
      eta_text: "1-3 часа",
      is_active: true,
      sort_order: 1,
    });
  }

  const ownerId = await ensureUser(OWNER_EMAIL, OWNER_PASSWORD);
  const adminId = await ensureUser(ADMIN_EMAIL, ADMIN_PASSWORD);

  await service.from("profiles").upsert({
    user_id: ownerId,
    role: "owner",
  });
  await service.from("profiles").upsert({
    user_id: adminId,
    role: "superadmin",
  });

  const { data: link } = await service
    .from("tenant_users")
    .select("id")
    .eq("tenant_id", TENANT_ID)
    .eq("user_id", ownerId)
    .maybeSingle();
  if (!link) {
    await service.from("tenant_users").insert({
      tenant_id: TENANT_ID,
      user_id: ownerId,
      role: "owner",
    });
  }

  const { count } = await service
    .from("tenants")
    .select("*", { count: "exact", head: true });

  console.log(
    JSON.stringify(
      {
        ok: true,
        tenants: count,
        accounts: {
          owner: { email: OWNER_EMAIL, password: OWNER_PASSWORD },
          superadmin: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
        },
      },
      null,
      2,
    ),
  );
}

async function main() {
  const usersOnly = process.argv.includes("--users-only");
  if (!usersOnly) {
    const schemaPath = path.join(
      ROOT,
      "supabase/migrations/20260803100000_step1_schema.sql",
    );
    const seedPath = path.join(ROOT, "supabase/seed.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");
    const seed = fs.readFileSync(seedPath, "utf8");
    console.log("Applying schema...");
    await runSql(schema);
    console.log("Applying seed SQL...");
    await runSql(seed);
  }
  console.log("Seeding users + links...");
  await seedDataAndUsers();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
