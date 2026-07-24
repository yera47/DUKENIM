export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Dukenim</h1>
      <p className="text-muted-foreground text-center text-sm">
        Каркас готов. Подключите Supabase и примените миграцию (см. PROJECT.md,
        Шаг 1).
      </p>
    </main>
  );
}
