import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasService = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  let dbOk = false;
  let tenantName: string | null = null;
  let tenantCount = 0;
  let error: string | null = null;

  try {
    const supabase = await createClient();
    const { data, error: qError, count } = await supabase
      .from("tenants")
      .select("name", { count: "exact" })
      .eq("slug", "test")
      .maybeSingle();

    if (qError) {
      error = qError.message;
    } else {
      dbOk = true;
      tenantName = data?.name ?? null;
      tenantCount = count ?? (data ? 1 : 0);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Неизвестная ошибка";
  }

  const checks = [
    { label: "Next.js 15 + TypeScript", ok: true },
    { label: "Tailwind + shadcn/ui", ok: true },
    { label: "Supabase URL", ok: Boolean(url) },
    { label: "Anon key", ok: hasAnon },
    { label: "Service role key", ok: hasService },
    { label: "База отвечает (таблица tenants)", ok: dbOk },
    {
      label: "Тестовый магазин slug=test",
      ok: Boolean(tenantName),
    },
  ];

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-16">
      <div className="space-y-3">
        <p className="text-sm tracking-wide text-emerald-800 uppercase">
          Dukenim · Шаг 1
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Каркас и база готовы
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Это фундамент платформы: сайт на Next.js, стили, подключение к
          Supabase и все таблицы из ТЗ. Вход, кабинет и витрину ещё не делали —
          это следующие шаги.
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
          Найден магазин: <strong>{tenantName}</strong>
          {tenantCount ? ` · записей tenants: ${tenantCount}` : null}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          База ещё не готова или схема не применена: {error}
        </p>
      ) : null}

      <div className="text-muted-foreground space-y-2 text-sm leading-relaxed">
        <p>
          <strong>Как проверить:</strong> открой эту страницу локально (
          <code>npm run dev</code>) — все галочки должны быть зелёными.
        </p>
        <p>
          Тестовые аккаунты появятся после сида (см. README / отчёт Шага 1).
        </p>
      </div>
    </main>
  );
}
