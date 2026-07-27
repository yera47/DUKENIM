import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";
import type { TenantMembership } from "@/lib/queries/tenant-users";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Дашборд" },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/sell", label: "В зале" },
  { href: "/admin/settings", label: "Настройки" },
] as const;

type AdminShellProps = {
  membership: TenantMembership;
  children: React.ReactNode;
};

export function AdminShell({ membership, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{membership.tenant.name}</p>
            <p className="text-muted-foreground text-xs">Кабинет владельца</p>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Выйти
            </Button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
