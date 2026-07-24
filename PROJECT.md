# МАСТЕР-ПРОМПТ ДЛЯ CURSOR / CLAUDE CODE
### Мультитенантная PWA-платформа витрин для магазинов

> **Как использовать:** сохрани этот файл в корень репозитория как `PROJECT.md`. В Cursor открой чат и напиши: «Прочитай PROJECT.md. Это ТЗ проекта. Начни с Шага 1 из раздела «Порядок работ». Ничего сверх шага не делай, покажи результат — я проверю и скажу, идти дальше или нет.»
> Для Claude Code: назови файл `CLAUDE.md` — он подхватится автоматически.

---

## 1. КОНТЕКСТ

Ты помогаешь разработчику-одиночке построить **одну платформу, которая обслуживает много магазинов**. Каждый магазин (арендатор, tenant) получает свой домен, свой бренд, свою витрину и свою админку. Внешне это его собственный сайт-магазин. Внутри — одна кодовая база, где новый клиент это запись в БД, а не новый проект.

Витрина — PWA: открывается по ссылке из Instagram, добавляется на домашний экран, работает как приложение без App Store.

**Кто пользуется:**
- Покупатель — витрина, аноним, без регистрации
- Владелец магазина — кабинет `/admin`
- Персонал магазина — только «продали в зале»
- Суперадмин (владелец платформы) — `/root`, создаёт арендаторов

---

## 2. ЖЁСТКИЕ ПРАВИЛА

Нарушение любого — переделка.

1. **`tenant_id` в каждой таблице с данными магазина.** Без исключений.
2. **Изоляция через RLS в Postgres, а не через фильтры в коде.** Код может забыть — база не должна отдать чужое.
3. **Секреты (`merchant_key`) никогда не попадают на клиент.** Только серверные Route Handlers.
4. **Цены в тенге целым числом (int).** Никаких float, никаких копеек.
5. **В `order_items` пишутся снимки** `title_snapshot` и `price_snapshot`. Товар переименуют — старый заказ обязан остаться прежним.
6. **У товара всегда минимум один вариант.** Без размеров = один вариант с `size = null`. Никакой второй ветки логики.
7. **Остаток меняется только через `stock_movements`.** Поле `stock_qty` — денормализованный кэш, обновляется триггером.
8. **TypeScript strict.** Никаких `any`. Типы БД генерируются из Supabase.
9. **Не строить того, чего нет в V1** (раздел 6). Даже если «быстро и просто».
10. **Никакого localStorage для данных заказа.** Корзина — Zustand в памяти + опционально sessionStorage.

---

## 3. СТЕК

| Слой | Решение |
|---|---|
| Фреймворк | Next.js 15, App Router, TypeScript strict |
| Стили | Tailwind CSS, темизация через CSS-переменные |
| UI | shadcn/ui |
| БД, auth, файлы | Supabase (PostgreSQL + Auth + Storage) |
| Серверное состояние | React Query |
| Корзина | Zustand |
| Хостинг | Vercel |

**Не добавлять:** отдельный бэкенд, ORM поверх Supabase, state-менеджер сверх перечисленных, UI-кит кроме shadcn.

---

## 4. СХЕМА БАЗЫ ДАННЫХ

Это первая миграция. Выполнить целиком до любого UI.

```sql
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
```

**Публичная часть настроек** (`delivery_enabled`, `loyalty_percent` и т.д.) отдаётся витрине через серверный Route Handler, который выбирает только безопасные поля. Никогда не запрашивать `tenant_settings` напрямую с клиента.

---

## 5. МАРШРУТЫ

```
Витрина (public)
  /                    главная
  /catalog             каталог
  /category/[slug]     категория
  /product/[id]        товар
  /cart                корзина
  /checkout            оформление
  /order/[number]      статус заказа

Кабинет (auth)
  /admin               дашборд
  /admin/orders
  /admin/orders/[id]
  /admin/products
  /admin/products/new
  /admin/products/[id]
  /admin/sell          «продали в зале»
  /admin/customers
  /admin/settings

Суперадмин
  /root
  /root/tenants/new
  /root/tenants/[id]
```

**Резолв арендатора — middleware:**
1. Читает `Host`.
2. Совпал `custom_domain` → этот tenant.
3. Иначе поддомен или `/s/[slug]` → по `slug`.
4. Не нашёл → 404.
5. Кладёт tenant в заголовок запроса, layout читает оттуда.

---

## 6. ГРАНИЦЫ V1

| Строим | НЕ строим |
|---|---|
| Мультитенантность, резолв домена | Лояльность и Wallet |
| Товары, варианты, остатки | Онлайн-оплата (только заявка в WhatsApp) |
| Витрина, PWA standalone | Интеграция Яндекс Доставки |
| Корзина, оформление | Видео |
| Заказы и статусы | Роли персонала (только owner) |
| «Продали в зале» | Массовый импорт |
| База клиентов (автоматом) | Рассылки |
| Настройки: бренд, доставка | Сложная аналитика, отзывы |
| Простая статистика | Мультиязычность |

Если возникает соблазн добавить что-то из правой колонки — **остановись и спроси.**

---

## 7. ПОРЯДОК РАБОТ

Строго по шагам. После каждого — стоп и проверка человеком.

**Шаг 1. Каркас и БД.**
Next.js 15 + TS strict + Tailwind + shadcn. Подключить Supabase. Выполнить миграцию из раздела 4. Сгенерировать типы. Создать одного тестового арендатора сидом.
*Готово когда:* проект запускается, типы сгенерированы, в БД есть тестовый магазин.

**Шаг 2. Middleware резолва арендатора.**
Определение tenant по домену/слагу, 404 если нет, брендинг (цвет, лого, название) применяется на уровне layout через CSS-переменные.
*Готово когда:* `/s/test` показывает страницу с брендом тестового магазина, `/s/nonexist` даёт 404.

**Шаг 3. Auth и кабинет.**
Вход по email через Supabase Auth. Защита `/admin`. Привязка пользователя к арендатору через `tenant_users`.
*Готово когда:* владелец входит и видит пустой дашборд, чужой tenant недоступен.

**Шаг 4. Товары в кабинете.**
CRUD товаров и вариантов. Загрузка фото в Supabase Storage. **Добавление товара должно занимать меньше минуты:** фото → название → цена → размеры с остатками, остальное опционально.
*Готово когда:* товар создаётся с телефона за минуту, фото грузятся, остатки проставляются.

**Шаг 5. Витрина: каталог и карточка.**
Главная, категории, карточка товара с выбором размера. Отсутствующие размеры заблокированы, не скрыты.
*Готово когда:* каталог тестового магазина открывается публично без входа.

**Шаг 6. Корзина и оформление.**
Zustand-корзина. Чекаут в 3 шага: имя+телефон → способ получения → подтверждение. Заказ создаётся, клиент автосоздаётся по телефону, товар списывается через `stock_movements`. Уведомление владельцу — ссылка `wa.me`.
*Готово когда:* заказ проходит от корзины до записи в БД, остаток уменьшился, номер заказа присвоен.

**Шаг 7. Заказы в кабинете.**
Лента заказов, карточка, смена статусов.
*Готово когда:* владелец видит заказ и меняет статус.

**Шаг 8. «Продали в зале».**
Экран `/admin/sell`: поиск товара → размер → «Продано». Создаёт заказ `source='offline'`, списывает остаток. Максимум 3 тапа.
*Готово когда:* офлайн-продажа отмечается за 10 секунд и попадает в статистику.

**Шаг 9. PWA.**
Динамический `manifest.json` под каждого арендатора (имя, иконка, `theme_color`, `"display":"standalone"`). Service worker для кэша. Баннер «добавить на экран».
*Готово когда:* добавленная на экран витрина открывается без адресной строки, со своей иконкой.

**Шаг 10. Настройки и статистика.**
Бренд (название, цвет, лого, контакты), доставка (зоны, стоимость, сроки, текст-объяснение), самовывоз. Статистика: заказы, выручка, топ-товары — **раздельно онлайн и офлайн.**
*Готово когда:* владелец меняет всё сам, статистика не смешивает каналы.

---

## 8. КОНВЕНЦИИ

- Файлы компонентов — PascalCase, всё остальное kebab-case.
- Серверные компоненты по умолчанию; `"use client"` только там, где нужна интерактивность.
- Все запросы к БД — в `lib/queries/*.ts`, не в компонентах.
- Типы БД — из `supabase gen types`, не писать руками.
- Деньги форматировать одной функцией `formatPrice()`: `35 000 ₸`, без копеек, неразрывный пробел.
- Ошибки пользователю — по-русски, человеческим языком.
- Комментарии в коде — только там, где неочевидно «почему», не «что».

---

## 9. ЧТО НИКОГДА НЕ ДЕЛАТЬ

- Не выводить `merchant_key` в ответ API и не читать `tenant_settings` с клиента.
- Не менять `stock_qty` напрямую — только через `stock_movements`.
- Не хранить баланс лояльности отдельным полем (V2) — считать суммой транзакций.
- Не требовать регистрацию покупателя. Телефон при оформлении — и всё.
- Не добавлять функции из правой колонки раздела 6 без разрешения.
- Не изобретать свой дизайн-язык: shadcn + акцентный цвет арендатора.

---

## 10. ПЕРВОЕ СООБЩЕНИЕ В CURSOR

Скопируй дословно:

> Прочитай PROJECT.md целиком. Это ТЗ проекта, следуй ему буквально.
>
> Выполни **только Шаг 1** из раздела «Порядок работ»: инициализируй Next.js 15 с App Router и TypeScript strict, подключи Tailwind и shadcn/ui, настрой Supabase-клиент (серверный и браузерный), создай файл миграции с полной схемой из раздела 4 и сид с одним тестовым арендатором.
>
> Не делай ничего из последующих шагов. Не добавляй функций, которых нет в разделе 6. Когда закончишь — покажи структуру проекта и объясни, что куда положил.
