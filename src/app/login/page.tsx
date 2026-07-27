import { LoginForm } from "@/components/admin/LoginForm";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath =
    params.next && params.next.startsWith("/") ? params.next : "/admin";
  const modeError =
    params.error === "no-tenant"
      ? "Этот аккаунт не привязан к магазину. Создайте аккаунт владельца ниже (если владельца ещё нет) или попросите доступ."
      : null;

  return (
    <main className="flex min-h-screen items-center px-4 py-10">
      <LoginForm nextPath={nextPath} modeError={modeError} />
    </main>
  );
}
