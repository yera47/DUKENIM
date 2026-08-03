# Dukenim

Мультитенантная платформа витрин магазинов (см. `PROJECT.md`).

## Шаг 1 — что уже есть

- Next.js 15 + TypeScript + Tailwind + shadcn/ui
- Клиенты Supabase: браузерный и серверный
- Миграция со всеми таблицами, триггерами и RLS
- Сид: магазин `test` + аккаунты владельца и супер-админа

## Запуск

1. Скопируй `.env.example` → `.env.local` и вставь ключи Supabase
2. Примени схему: открой SQL Editor в Supabase и выполни
   `supabase/migrations/20260803100000_step1_schema.sql`
   затем `supabase/seed.sql`
3. Создай пользователей:
   ```bash
   node scripts/seed-step1.mjs --users-only
   ```
   Или одной командой (нужен `SUPABASE_ACCESS_TOKEN`):
   ```bash
   $env:SUPABASE_ACCESS_TOKEN="sbp_..."
   node scripts/seed-step1.mjs
   ```
4. `npm run dev` → http://localhost:3000

## Тестовые аккаунты (после сида)

| Роль | Email | Пароль |
|---|---|---|
| Владелец магазина | owner@test.dukenim.local | OwnerTest123! |
| Супер-админ | superadmin@dukenim.local | SuperAdmin123! |

Вход и кабинеты — **Шаг 2+** (ещё не сделаны).
