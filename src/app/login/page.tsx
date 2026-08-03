import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/LoginForm";
import { getCurrentUser, homePathForRole } from "@/lib/queries/auth";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  if (user && user.role !== "customer") {
    redirect(homePathForRole(user.role));
  }

  const params = await searchParams;
  const hint =
    params.error === "forbidden"
      ? "Нет доступа к этому разделу"
      : params.error === "no-shop"
        ? "К аккаунту не привязан магазин"
        : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
      <div className="space-y-2">
        <p className="text-sm tracking-wide text-[#0E5C4A] uppercase">Dukenim</p>
        <h1 className="text-2xl font-semibold tracking-tight">Вход</h1>
        <p className="text-sm text-neutral-600">
          Владелец магазина и супер-админ входят здесь по email.
        </p>
      </div>
      {hint ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {hint}
        </p>
      ) : null}
      <LoginForm />
      <p className="text-xs text-neutral-500">
        Тест: owner@test.dukenim.local / OwnerTest123!
        <br />
        Супер-админ: superadmin@dukenim.local / SuperAdmin123!
      </p>
    </main>
  );
}
