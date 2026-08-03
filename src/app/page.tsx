import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-16">
      <div className="space-y-3">
        <p className="text-sm tracking-wide text-[#0E5C4A] uppercase">Dukenim</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Платформа витрин магазинов
        </h1>
        <p className="leading-relaxed text-neutral-600">
          Витрина покупателя, кабинет владельца и супер-админка на одной базе.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/s/test"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-[#0E5C4A] px-5 text-sm text-white"
        >
          Открыть витрину test
        </Link>
        <Link
          href="/login"
          className="inline-flex h-11 items-center justify-center rounded-lg border px-5 text-sm"
        >
          Вход в кабинет
        </Link>
      </div>
      <ul className="space-y-1 text-sm text-neutral-600">
        <li>Владелец: owner@test.dukenim.local / OwnerTest123!</li>
        <li>Супер-админ: superadmin@dukenim.local / SuperAdmin123!</li>
      </ul>
    </main>
  );
}
