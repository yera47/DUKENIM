import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-muted-foreground text-sm uppercase tracking-wide">
        404
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">
        Магазин не найден
      </h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        Такого арендатора нет или он неактивен.
      </p>
      <Link href="/" className="text-sm underline underline-offset-4">
        На главную
      </Link>
    </main>
  );
}
