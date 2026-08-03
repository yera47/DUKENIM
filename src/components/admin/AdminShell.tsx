import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";
import type { OwnerMembership } from "@/lib/queries/auth";

const NAV = [
  { href: "/admin", label: "Дашборд" },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/stock", label: "Склад" },
  { href: "/admin/sell", label: "В зале" },
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/analytics", label: "Аналитика" },
  { href: "/admin/requests", label: "Заявки" },
  { href: "/admin/plan", label: "Тариф" },
  { href: "/admin/settings", label: "Настройки" },
] as const;

type AdminShellProps = {
  membership: Pick<OwnerMembership, "tenant">;
  children: ReactNode;
};

export function AdminShell({ membership, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[#F7F9F8] text-foreground">
      <header className="border-b border-[#0E5C4A]/15 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-[#0E5C4A] uppercase">
              Dukenim
            </p>
            <h1 className="truncate text-lg font-semibold">
              {membership.tenant.name}
            </h1>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="outline" size="sm">
              Выйти
            </Button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-[#0E5C4A] hover:bg-[#0E5C4A]/10"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
