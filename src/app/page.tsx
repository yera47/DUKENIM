import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  let dbOk = false;
  let tenantName: string | null = null;
  let error: string | null = null;

  try {
    const supabase = await createClient();
    const { data, error: qError } = await supabase
      .from("tenants")
      .select("name")
      .eq("slug", "test")
      .maybeSingle();

    if (qError) {
      error = qError.message;
    } else {
      dbOk = true;
      tenantName = data?.name ?? null;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Неизвестная ошибка";
  }

  const checks = [
    { label: "Сайт запускается (Next.js)", ok: true },
    { label: "Стили подключены", ok: true },
    { label: "Ключи Supabase найдены", ok: Boolean(url && hasAnon) },
    { label: "База отвечает", ok: dbOk },
    { label: "Тестовый магазин создан", ok: Boolean(tenantName) },
  ];

  const allOk = checks.every((c) => c.ok);

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-16">
      <div className="space-y-3">
        <p className="text-sm tracking-wide text-emerald-800 uppercase">
          Dukenim · Шаг 1 из 13
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {allOk ? "Каркас и база работают" : "Что-то ещё не готово"}
        </h1>
        <p className="leading-relaxed text-neutral-600">
          Сейчас сделан только фундамент: сайт + база данных. Витрины магазина
          и кабинета ещё нет — их делаем на следующих шагах.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <p className="font-medium">Если открывали старую ссылку — это нормально</p>
        <p className="mt-1 leading-relaxed">
          Адрес{" "}
          <code className="rounded bg-white px-1">/s/test</code> сейчас даёт
          404. Мы специально убрали старую витрину, чтобы начать с чистого ТЗ.
          Рабочая страница Шага 1 — главная:{" "}
          <code className="rounded bg-white px-1">/</code>
        </p>
      </div>

      <ul className="space-y-2 rounded-xl border bg-white p-4">
        {checks.map((item) => (
          <li key={item.label} className="flex items-center gap-3 text-sm">
            <span
              className={
                item.ok
                  ? "inline-flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800"
                  : "inline-flex size-5 items-center justify-center rounded-full bg-red-100 text-red-700"
              }
            >
              {item.ok ? "✓" : "!"}
            </span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>

      {tenantName ? (
        <p className="text-sm">
          В базе есть магазин: <strong>{tenantName}</strong> (slug:{" "}
          <code>test</code>)
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Ошибка базы: {error}
        </p>
      ) : null}

      <div className="space-y-2 text-sm leading-relaxed text-neutral-600">
        <p>
          <strong>Как проверить локально:</strong> в терминале{" "}
          <code>npm run dev</code>, потом открой{" "}
          <a className="underline" href="http://localhost:3000">
            http://localhost:3000
          </a>
        </p>
        <p>
          <strong>Онлайн:</strong>{" "}
          <a className="underline" href="https://dukenim.vercel.app">
            https://dukenim.vercel.app
          </a>
        </p>
        <p>
          Когда скажешь «дальше» — сделаем Шаг 2: вход по email и роли.
        </p>
      </div>
    </main>
  );
}
