import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg space-y-4 px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold">Страница ещё не готова</h1>
      <p className="text-neutral-600 leading-relaxed">
        Сейчас выполнен только Шаг 1 (каркас и база). Витрина{" "}
        <code>/s/...</code>, кабинет и вход появятся на следующих шагах.
      </p>
      <Link
        href="/"
        className="inline-flex rounded-lg bg-[#0E5C4A] px-4 py-2 text-sm text-white"
      >
        На главную Шага 1
      </Link>
    </main>
  );
}
