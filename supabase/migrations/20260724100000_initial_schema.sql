-- ============ ТИПЫ ============
create type tenant_status  as enum ('active','paused','trial');
create type tenant_plan    as enum ('basic','loyalty','full');
create type user_role      as enum ('owner','admin','staff');
create type order_source   as enum ('online','offline');
create type order_status   as enum ('new','confirmed','assembled','delivering','done','cancelled');
create type delivery_method as enum ('pickup','courier','yandex');
create type payment_method as enum ('cash','card','kaspi','transfer');
create type payment_status as enum ('pending','paid','refunded');
create type stock_reason   as enum ('sale','return','restock','correction','writeoff');

-- ============ АРЕНДАТОРЫ ============
create table tenants (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  custom_domain text unique,
  name          text not null,
  tagline       text,
  logo_url      text,
  accent_color  text not null default '#1F5F4E',
  city          text not null default 'Астана',
  address       text,
  phone         text not null,
  whatsapp      text,
  instagram     text,
  working_hours jsonb,
  status        tenant_status not null default 'trial',
  plan          tenant_plan   not null default 'basic',
  created_at    timestamptz not null default now()
);

create table tenant_users (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       user_role not null default 'owner',
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create table tenant_settings (
  tenant_id        uuid primary key references tenants(id) on delete cascade,
  delivery_enabled boolean not null default true,
  pickup_enabled   boolean not null default true,
  yandex_enabled   boolean not null default false,
  delivery_note    text,
  payment_online   boolean not null default false,
  payment_provider text not null default 'none',
  merchant_id      text,
  merchant_key     text,
  loyalty_enabled  boolean not null default false,
  loyalty_percent  int not null default 5,
  loyalty_goal     int,
  min_order        int not null default 0
);

-- ============ КАТАЛОГ ============
create table categories (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  name       text not null,
  slug       text not null,
  sort_order int not null default 0,
  is_active  boolean not null default true,
  unique (tenant_id, slug)
);

create table products (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  title       text not null,
  description text,
  price       int not null check (price >= 0),
  old_price   int check (old_price >= 0),
  images      text[] not null default '{}',
  is_active   boolean not null default true,
  is_featured boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  tenant_id   uuid not null references tenants(id) on delete cascade,
  size        text,
  color       text,
  sku         text,
  stock_qty   int not null default 0,
  price_delta int not null default 0,
  is_active   boolean not null default true
);

-- ============ КЛИЕНТЫ ============
create table customers (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  phone        text not null,
  name         text,
  first_order  timestamptz,
  last_order   timestamptz,
  orders_count int not null default 0,
  total_spent  int not null default 0,
  created_at   timestamptz not null default now(),
  unique (tenant_id, phone)
);

-- ============ ЗАКАЗЫ ============
create table orders (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references tenants(id) on delete cascade,
  customer_id      uuid references customers(id) on delete set null,
  order_number     int not null,
  source           order_source not null default 'online',
  status           order_status not null default 'new',
  delivery_method  delivery_method,
  delivery_address text,
  delivery_comment text,
  delivery_cost    int not null default 0,
  subtotal         int not null,
  bonus_used       int not null default 0,
  bonus_earned     int not null default 0,
  total            int not null,
  payment_method   payment_method,
  payment_status   payment_status not null default 'pending',
  staff_id         uuid references auth.users(id) on delete set null,
  comment          text,
  created_at       timestamptz not null default now(),
  unique (tenant_id, order_number)
);

create table order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references orders(id) on delete cascade,
  tenant_id      uuid not null references tenants(id) on delete cascade,
  variant_id     uuid not null references product_variants(id),
  title_snapshot text not null,
  price_snapshot int  not null,
  qty            int  not null check (qty > 0)
);

create table stock_movements (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  variant_id uuid not null references product_variants(id) on delete cascade,
  delta      int not null,
  reason     stock_reason not null,
  order_id   uuid references orders(id) on delete set null,
  staff_id   uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============ ДОСТАВКА И АКЦИИ ============
create table delivery_zones (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  name       text not null,
  cost       int not null default 0,
  free_from  int,
  eta_text   text,
  is_active  boolean not null default true,
  sort_order int not null default 0
);

create table promotions (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  title     text not null,
  subtitle  text,
  starts_at timestamptz,
  ends_at   timestamptz,
  is_active boolean not null default true
);

-- ============ ИНДЕКСЫ ============
create index on products (tenant_id, is_active);
create index on product_variants (product_id);
create index on product_variants (tenant_id);
create index on orders (tenant_id, created_at desc);
create index on order_items (order_id);
create index on customers (tenant_id, phone);
create index on stock_movements (variant_id, created_at desc);

-- ============ АВТО-ОСТАТОК ============
create or replace function apply_stock_movement()
returns trigger language plpgsql as $$
begin
  update product_variants
     set stock_qty = stock_qty + new.delta
   where id = new.variant_id;
  return new;
end $$;

create trigger trg_stock_movement
after insert on stock_movements
for each row execute function apply_stock_movement();

-- ============ НОМЕР ЗАКАЗА ============
create or replace function set_order_number()
returns trigger language plpgsql as $$
begin
  select coalesce(max(order_number), 0) + 1
    into new.order_number
    from orders where tenant_id = new.tenant_id;
  return new;
end $$;

create trigger trg_order_number
before insert on orders
for each row when (new.order_number is null)
execute function set_order_number();

-- ============ RLS ============
create or replace function user_tenant_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select tenant_id from tenant_users where user_id = auth.uid()
$$;

alter table tenants          enable row level security;
alter table tenant_users     enable row level security;
alter table tenant_settings  enable row level security;
alter table categories       enable row level security;
alter table products         enable row level security;
alter table product_variants enable row level security;
alter table customers        enable row level security;
alter table orders           enable row level security;
alter table order_items      enable row level security;
alter table stock_movements  enable row level security;
alter table delivery_zones   enable row level security;
alter table promotions       enable row level security;

-- Публичное чтение витрины
create policy pub_tenants on tenants for select
  using (status = 'active');
create policy pub_categories on categories for select
  using (is_active and tenant_id in (select id from tenants where status='active'));
create policy pub_products on products for select
  using (is_active and tenant_id in (select id from tenants where status='active'));
create policy pub_variants on product_variants for select
  using (is_active and tenant_id in (select id from tenants where status='active'));
create policy pub_zones on delivery_zones for select
  using (is_active);
create policy pub_promos on promotions for select
  using (is_active);

-- Доступ команды магазина
create policy own_tenants on tenants for all
  using (id in (select user_tenant_ids()));
create policy own_tenant_users on tenant_users for select
  using (tenant_id in (select user_tenant_ids()));
create policy own_categories on categories for all
  using (tenant_id in (select user_tenant_ids()));
create policy own_products on products for all
  using (tenant_id in (select user_tenant_ids()));
create policy own_variants on product_variants for all
  using (tenant_id in (select user_tenant_ids()));
create policy own_customers on customers for all
  using (tenant_id in (select user_tenant_ids()));
create policy own_orders on orders for all
  using (tenant_id in (select user_tenant_ids()));
create policy own_items on order_items for all
  using (tenant_id in (select user_tenant_ids()));
create policy own_stock on stock_movements for all
  using (tenant_id in (select user_tenant_ids()));
create policy own_zones on delivery_zones for all
  using (tenant_id in (select user_tenant_ids()));
create policy own_promos on promotions for all
  using (tenant_id in (select user_tenant_ids()));

-- ВАЖНО: tenant_settings НЕ читается анонимно целиком (там merchant_key).
create policy own_settings on tenant_settings for all
  using (tenant_id in (select user_tenant_ids()));

-- API-роли Supabase (RLS решает, какие строки видны)
grant usage on schema public to anon, authenticated, service_role;

grant select on table tenants to anon, authenticated;
grant all on table tenants to authenticated, service_role;

grant select on table tenant_users to authenticated;
grant all on table tenant_users to service_role;

grant select, insert, update, delete on table tenant_settings to authenticated;
grant all on table tenant_settings to service_role;

grant select on table categories to anon, authenticated;
grant all on table categories to authenticated, service_role;

grant select on table products to anon, authenticated;
grant all on table products to authenticated, service_role;

grant select on table product_variants to anon, authenticated;
grant all on table product_variants to authenticated, service_role;

grant select, insert, update, delete on table customers to authenticated;
grant all on table customers to service_role;

grant select, insert, update, delete on table orders to authenticated;
grant all on table orders to service_role;

grant select, insert, update, delete on table order_items to authenticated;
grant all on table order_items to service_role;

grant select, insert, update, delete on table stock_movements to authenticated;
grant all on table stock_movements to service_role;

grant select on table delivery_zones to anon, authenticated;
grant all on table delivery_zones to authenticated, service_role;

grant select on table promotions to anon, authenticated;
grant all on table promotions to authenticated, service_role;
