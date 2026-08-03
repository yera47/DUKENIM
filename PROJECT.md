# МАСТЕР-ПРОМПТ ДЛЯ CURSOR — ПРОЕКТ DUKENIM (с нуля)
### Мультитенантная платформа: витрины магазинов + кабинет владельца + супер-админка

> Как использовать: создай пустую папку, открой в Cursor, сохрани этот файл как PROJECT.md в корень. В чате Cursor напиши: «Прочитай PROJECT.md. Начни с Шага 1 из раздела ПОРЯДОК РАБОТЫ. Делай только один шаг, покажи результат — я проверю и скажу идти дальше. Объясняй просто, я не программист.»

---

## 1. ЧТО СТРОИМ

**Dukenim** — платформа, где каждый магазин получает свою витрину-сайт под своим брендом, а владелец управляет ею через кабинет с телефона. Плюс супер-админка для меня — владельца платформы, откуда я вижу все магазины и все продажи.

Три роли, все входят по email на одной странице входа, после входа открывается разное:
- **Покупатель** — видит витрины магазинов, заказывает без регистрации
- **Владелец магазина** — свой кабинет: товары, склад, аналитика, тариф
- **Супер-админ (я)** — панель управления всей платформой

Ключевой принцип: **кабинет и витрина используют ОДНУ базу.** Владелец меняет товар в кабинете → сразу видно на витрине, потому что это одна таблица, отфильтрованная по магазину. Ничего синхронизировать не нужно.

---

## 2. СТЕК (не менять)

| Слой | Инструмент |
|---|---|
| Сайт + бэкенд | Next.js 15 (App Router, TypeScript strict) |
| База, вход, файлы | Supabase (PostgreSQL + Auth + Storage) |
| Стили | Tailwind CSS + shadcn/ui |
| Хостинг | Vercel |

Не добавлять отдельный бэкенд, ORM, лишние библиотеки. Next.js API-роуты + Supabase закрывают всё.

---

## 3. РОЛИ И ДОСТУП

- Все входят по email на `/login`.
- После входа читается роль из таблицы `profiles` (customer / owner / superadmin).
- **owner** → редирект в `/admin` (его кабинет, только его магазин)
- **superadmin** → редирект в `/root` (панель платформы)
- **customer** → на витрины, регистрация не нужна (телефон при заказе)
- Роль и принадлежность к магазину проверяются НА СЕРВЕРЕ, не только прячутся на фронте.

---

## 4. МОДЕЛЬ ДАННЫХ

Мультитенантность: каждая таблица с данными магазина содержит `tenant_id`. Изоляция через RLS в Postgres — код может забыть фильтр, база не отдаст чужое.

**Таблицы (создать в первой миграции):**

- `tenants` — магазины: id, slug (уникальный, для /s/slug), custom_domain, name, tagline, logo_url, accent_color, city, phone, whatsapp, instagram, **plan** (basic/standard/pro), status (active/paused/trial), created_at
- `tenant_users` — привязка владельца к магазину: id, tenant_id, user_id, role (owner/admin/staff)
- `profiles` — роль пользователя: user_id, role (customer/owner/superadmin), created_at
- `categories` — id, tenant_id, name, slug, sort_order, is_active
- `products` — id, tenant_id, category_id, title, description, price (int, тенге), old_price, images (text[]), is_active, is_featured, sort_order, created_at
- `product_variants` — id, product_id, tenant_id, size, color, sku, stock_qty (int), is_active
- `customers` — id, tenant_id, phone, name, first_order, last_order, orders_count, total_spent (уникальность phone в рамках tenant)
- `orders` — id, tenant_id, customer_id, order_number, **source** (online/offline), status (new/confirmed/assembled/delivering/done/cancelled), delivery_method, delivery_address, delivery_cost, subtotal, total, payment_method, payment_status, staff_id, created_at
- `order_items` — id, order_id, tenant_id, variant_id, title_snapshot, price_snapshot, qty
- `stock_movements` — id, tenant_id, variant_id, delta, reason (sale/return/restock/correction/writeoff), order_id, staff_id, created_at
- `delivery_zones` — id, tenant_id, name, cost, free_from, eta_text, is_active
- `tenant_settings` — tenant_id, delivery_enabled, pickup_enabled, payment_online, payment_provider, merchant_id, **merchant_key** (НИКОГДА не на клиент), min_order
- `subscriptions` — id, tenant_id, plan, status (active/canceled), started_at, current_period_end
- `change_requests` — id, tenant_id, text, status (new/in_progress/done), created_at
- `messages` — id, tenant_id, from_role (owner/superadmin), text, created_at

**Триггеры:**
- `stock_movements` INSERT → обновляет product_variants.stock_qty
- `orders` INSERT → присваивает order_number (сквозной в рамках tenant)

**RLS:**
- Публичное чтение витрины: активные tenants, активные products/variants — анонимно
- Владелец: полный доступ только к своему tenant (через функцию user_tenant_ids())
- Супер-админ: доступ ко всем (проверка роли superadmin)
- tenant_settings и merchant_key — никогда анонимно

---

## 5. ЧТО ПОСТРОИТЬ

### А. Витрина покупателя (`/s/[slug]`)
### Б. Кабинет владельца (`/admin`)
### В. Супер-админка (`/root`, только роль superadmin)

(Детали — в полном ТЗ выше по разделам 5–7.)

---

## 6. ПОДПИСКИ И ОПЛАТА

Тарифы: basic / standard / pro. Оплата через изолированный `lib/payment.ts` (сейчас заглушка).

---

## 7. ЖЁСТКИЕ ПРАВИЛА

- tenant_id в каждой таблице данных магазина. Изоляция через RLS.
- merchant_key — НИКОГДА с клиента.
- Остаток только через stock_movements.
- Цены — int в тенге.
- order_items — title_snapshot и price_snapshot.
- У товара всегда минимум один вариант.
- Роль и tenant проверять на сервере.
- Запросы к базе — в src/lib/queries/.
- TypeScript strict, никаких any.
- UTF-8 без BOM.
- Корзина не в localStorage.
- Не строить того, чего нет в ТЗ, без разрешения.

---

## 8. ПОРЯДОК РАБОТЫ (строго по шагам)

1. **Каркас + БД.** Next.js 15 + TS + Tailwind + shadcn. Supabase. Миграция со ВСЕМИ таблицами, триггеры, RLS. Сид: тестовый магазин + владелец + супер-админ.
2. **Вход и роли.**
3. **Резолв магазина.**
4. **Кабинет: каталог + товары.**
5. **Витрина: каталог и карточка.**
6. **Корзина и оформление.**
7. **Склад + «продали в зале».**
8. **Аналитика продаж.**
9. **Тарифы и ограничения.**
10. **Оплата-заглушка.**
11. **Чат заявок.**
12. **PWA.**
13. **Супер-админка.**

Не делать всё сразу. Один шаг → проверка человеком → следующий.

---

## 9. ПЕРВОЕ СООБЩЕНИЕ В CURSOR

> Прочитай PROJECT.md целиком. Выполни ТОЛЬКО Шаг 1 из раздела «Порядок работы».
