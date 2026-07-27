import Link from "next/link";

import type { PublicTenant } from "@/lib/queries/tenants";

type StorefrontHeaderProps = {
  tenant: PublicTenant;
  cartCount?: number;
};

export function StorefrontHeader({ tenant, cartCount = 0 }: StorefrontHeaderProps) {
  const base = `/s/${tenant.slug}`;

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href={base} className="min-w-0">
          <p
            className="truncate text-base font-semibold"
            style={{ color: "var(--accent)" }}
          >
            {tenant.name}
          </p>
          {tenant.tagline ? (
            <p className="text-muted-foreground truncate text-xs">
              {tenant.tagline}
            </p>
          ) : null}
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href={`${base}/catalog`} className="hover:underline">
            Каталог
          </Link>
          <Link href={`${base}/cart`} className="hover:underline">
            Корзина{cartCount > 0 ? ` (${cartCount})` : ""}
          </Link>
        </nav>
      </div>
    </header>
  );
}
