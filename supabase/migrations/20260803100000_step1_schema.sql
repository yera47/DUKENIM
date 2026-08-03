-- Dukenim Step 1: full schema (PROJECT.md §4)
-- Safe to re-run on empty DB. On existing DB use scripts/reset-and-apply.mjs

-- ============ CLEAN (for reset) ============
drop schema if exists public cascade;
create schema public;
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;
grant all on schema public to anon, authenticated;

-- ============ ENUMS ============
create type tenant_status as enum ('active', 'paused', 'trial');
create type tenant_plan as enum ('basic', 'standard', 'pro');
create type staff_role as enum ('owner', 'admin', 'staff');
create type profile_role as enum ('customer', 'owner', 'superadmin');
create type order_source as enum ('online', 'offline');
create type order_status as enum (
  'new', 'confirmed', 'assembled', 'delivering', 'done', 'cancelled'
);
create type delivery_method as enum ('pickup', 'courier');
create type payment_method as enum ('cash', 'card', 'kaspi', 'transfer', 'online');
create type payment_status as enum ('pending', 'paid', 'refunded');
create type stock_reason as enum (
  'sale', 'return', 'restock', 'correction', 'writeoff'
);
create type subscription_status as enum ('active', 'canceled');
create type change_request_status as enum ('new', 'in_progress', 'done');
create type message_from_role as enum ('owner', 'superadmin');

-- ============ TENANTS ============
create table tenants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  custom_domain text unique,
  name text not null,
  tagline text,
  logo_url text,
  accent_color text not null default '#0E5C4A',
  city text not null default 'Астана',
  phone text not null,
  whatsapp text,
  instagram text,
  plan tenant_plan not null default 'basic',
  status tenant_status not null default 'trial',
  created_at timestamptz not null default now()
);

create table tenant_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role staff_role not null default 'owner',
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role profile_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table tenant_settings (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  delivery_enabled boolean not null default true,
  pickup_enabled boolean not null default true,
  payment_online boolean not null default false,
  payment_provider text not null default 'none',
  merchant_id text,
  merchant_key text,
  min_order int not null default 0 check (min_order >= 0)
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  plan tenant_plan not null,
  status subscription_status not null default 'active',
  started_at timestamptz not null default now(),
  current_period_end timestamptz
);

create table change_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  text text not null,
  status change_request_status not null default 'new',
  created_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  from_role message_from_role not null,
  text text not null,
  created_at timestamptz not null default now()
);

-- ============ CATALOG ============
create table categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  unique (tenant_id, slug)
);

create table products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  title text not null,
  description text,
  price int not null check (price >= 0),
  old_price int check (old_price is null or old_price >= 0),
  images text[] not null default '{}',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  size text,
  color text,
  sku text,
  stock_qty int not null default 0,
  is_active boolean not null default true
);

-- ============ CUSTOMERS / ORDERS ============
create table customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  phone text not null,
  name text,
  first_order timestamptz,
  last_order timestamptz,
  orders_count int not null default 0,
  total_spent int not null default 0,
  unique (tenant_id, phone)
);

create table delivery_zones (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  cost int not null default 0 check (cost >= 0),
  free_from int check (free_from is null or free_from >= 0),
  eta_text text,
  is_active boolean not null default true,
  sort_order int not null default 0
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  order_number int,
  source order_source not null default 'online',
  status order_status not null default 'new',
  delivery_method delivery_method,
  delivery_address text,
  delivery_cost int not null default 0 check (delivery_cost >= 0),
  subtotal int not null default 0 check (subtotal >= 0),
  total int not null default 0 check (total >= 0),
  payment_method payment_method,
  payment_status payment_status not null default 'pending',
  staff_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tenant_id, order_number)
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete set null,
  title_snapshot text not null,
  price_snapshot int not null check (price_snapshot >= 0),
  qty int not null check (qty > 0)
);

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  variant_id uuid not null references product_variants(id) on delete cascade,
  delta int not null,
  reason stock_reason not null,
  order_id uuid references orders(id) on delete set null,
  staff_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============ INDEXES ============
create index idx_products_tenant on products(tenant_id);
create index idx_products_active on products(tenant_id, is_active);
create index idx_variants_product on product_variants(product_id);
create index idx_orders_tenant on orders(tenant_id, created_at desc);
create index idx_stock_variant on stock_movements(variant_id, created_at desc);
create index idx_messages_tenant on messages(tenant_id, created_at desc);

-- ============ TRIGGERS ============
create or replace function apply_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update product_variants
  set stock_qty = stock_qty + new.delta
  where id = new.variant_id
    and tenant_id = new.tenant_id;
  return new;
end;
$$;

create trigger trg_stock_movements_apply
after insert on stock_movements
for each row execute function apply_stock_movement();

create or replace function assign_order_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_num int;
begin
  if new.order_number is not null then
    return new;
  end if;
  select coalesce(max(order_number), 0) + 1
  into next_num
  from orders
  where tenant_id = new.tenant_id;
  new.order_number := next_num;
  return new;
end;
$$;

create trigger trg_orders_number
before insert on orders
for each row execute function assign_order_number();

-- ============ HELPERS ============
create or replace function user_tenant_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from tenant_users where user_id = auth.uid();
$$;

create or replace function is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where user_id = auth.uid() and role = 'superadmin'
  );
$$;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- ============ RLS ============
alter table tenants enable row level security;
alter table tenant_users enable row level security;
alter table profiles enable row level security;
alter table tenant_settings enable row level security;
alter table subscriptions enable row level security;
alter table change_requests enable row level security;
alter table messages enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table customers enable row level security;
alter table delivery_zones enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table stock_movements enable row level security;

-- Public storefront reads
create policy tenants_public_read on tenants
  for select using (status = 'active' or is_superadmin() or id in (select user_tenant_ids()));

create policy categories_public_read on categories
  for select using (
    is_active = true
    or is_superadmin()
    or tenant_id in (select user_tenant_ids())
  );

create policy products_public_read on products
  for select using (
    is_active = true
    or is_superadmin()
    or tenant_id in (select user_tenant_ids())
  );

create policy variants_public_read on product_variants
  for select using (
    is_active = true
    or is_superadmin()
    or tenant_id in (select user_tenant_ids())
  );

create policy zones_public_read on delivery_zones
  for select using (
    is_active = true
    or is_superadmin()
    or tenant_id in (select user_tenant_ids())
  );

-- Profiles: user reads self; superadmin reads all
create policy profiles_self_read on profiles
  for select using (user_id = auth.uid() or is_superadmin());

create policy profiles_self_update on profiles
  for update using (user_id = auth.uid() or is_superadmin());

-- Owner staff policies (full access to own tenant)
create policy tenant_users_owner on tenant_users
  for all using (
    is_superadmin() or tenant_id in (select user_tenant_ids())
  )
  with check (
    is_superadmin() or tenant_id in (select user_tenant_ids())
  );

create policy tenants_owner_update on tenants
  for update using (
    is_superadmin() or id in (select user_tenant_ids())
  );

create policy settings_owner on tenant_settings
  for all using (
    is_superadmin() or tenant_id in (select user_tenant_ids())
  )
  with check (
    is_superadmin() or tenant_id in (select user_tenant_ids())
  );

create policy subscriptions_owner_read on subscriptions
  for select using (
    is_superadmin() or tenant_id in (select user_tenant_ids())
  );

create policy change_requests_owner on change_requests
  for all using (
    is_superadmin() or tenant_id in (select user_tenant_ids())
  )
  with check (
    is_superadmin() or tenant_id in (select user_tenant_ids())
  );

create policy messages_owner on messages
  for all using (
    is_superadmin() or tenant_id in (select user_tenant_ids())
  )
  with check (
    is_superadmin() or tenant_id in (select user_tenant_ids())
  );

create policy categories_owner_write on categories
  for all using (
    is_superadmin() or tenant_id in (select user_tenant_ids())
  )
  with check (
    is_superadmin() or tenant_id in (select user_tenant_ids())
  );

create policy products_owner_write on products
  for all using (
    is_superadmin() or tenant_id in (select user_tenant_ids())
  )
  with check (
    is_superadmin() or tenant_id in (select user_tenant_ids())
  );

create policy variants_owner_write on product_variants
  for all using (
    is_superadmin() or tenant_id in (select user_tenant_ids())
  )
  with check (
    is_superadmin() or tenant_id in (select user_tenant_ids())
  );

create policy customers_owner on customers
  for all using (
    is_superadmin() or tenant_id in (select user_tenant_ids())
  )
  with check (
    is_superadmin() or tenant_id in (select user_tenant_ids())
  );

create policy zones_owner_write on delivery_zones
  for all using (
    is_superadmin() or tenant_id in (select user_tenant_ids())
  )
  with check (
    is_superadmin() or tenant_id in (select user_tenant_ids())
  );

create policy orders_owner on orders
  for all using (
    is_superadmin() or tenant_id in (select user_tenant_ids())
  )
  with check (
    is_superadmin() or tenant_id in (select user_tenant_ids())
  );

create policy order_items_owner on order_items
  for all using (
    is_superadmin() or tenant_id in (select user_tenant_ids())
  )
  with check (
    is_superadmin() or tenant_id in (select user_tenant_ids())
  );

create policy stock_owner on stock_movements
  for all using (
    is_superadmin() or tenant_id in (select user_tenant_ids())
  )
  with check (
    is_superadmin() or tenant_id in (select user_tenant_ids())
  );

-- Superadmin insert tenants
create policy tenants_superadmin_insert on tenants
  for insert with check (is_superadmin());

create policy subscriptions_superadmin_write on subscriptions
  for all using (is_superadmin())
  with check (is_superadmin());

-- Anon insert for online orders (storefront) — narrow
create policy orders_anon_insert on orders
  for insert to anon
  with check (source = 'online');

create policy order_items_anon_insert on order_items
  for insert to anon
  with check (true);

create policy customers_anon_upsert on customers
  for insert to anon
  with check (true);

create policy customers_anon_update on customers
  for update to anon
  using (true);

create policy stock_anon_sale on stock_movements
  for insert to anon
  with check (reason = 'sale');

-- Storage bucket for product images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists product_images_public_read on storage.objects;
drop policy if exists product_images_owner_write on storage.objects;
drop policy if exists product_images_owner_update on storage.objects;
drop policy if exists product_images_owner_delete on storage.objects;

create policy product_images_public_read on storage.objects
  for select using (bucket_id = 'product-images');

create policy product_images_owner_write on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and (
      is_superadmin()
      or (storage.foldername(name))[1] in (
        select tenant_id::text from tenant_users where user_id = auth.uid()
      )
    )
  );

create policy product_images_owner_update on storage.objects
  for update using (
    bucket_id = 'product-images'
    and (
      is_superadmin()
      or (storage.foldername(name))[1] in (
        select tenant_id::text from tenant_users where user_id = auth.uid()
      )
    )
  );

create policy product_images_owner_delete on storage.objects
  for delete using (
    bucket_id = 'product-images'
    and (
      is_superadmin()
      or (storage.foldername(name))[1] in (
        select tenant_id::text from tenant_users where user_id = auth.uid()
      )
    )
  );

-- Grants after schema recreate
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, service_role;
grant all on all sequences in schema public to postgres, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to postgres, service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
