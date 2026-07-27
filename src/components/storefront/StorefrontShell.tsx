"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import type { PublicTenant } from "@/lib/queries/tenants";
import { useCartStore } from "@/lib/store/cart";

type Props = {
  tenant: PublicTenant;
};

export function StorefrontShell({ tenant }: Props) {
  const setTenantSlug = useCartStore((s) => s.setTenantSlug);
  const totalQty = useCartStore((s) => s.totalQty);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setTenantSlug(tenant.slug);
    setCount(totalQty());
    return useCartStore.subscribe((state) => {
      setCount(state.items.reduce((sum, item) => sum + item.qty, 0));
    });
  }, [setTenantSlug, tenant.slug, totalQty]);

  return <StorefrontHeader tenant={tenant} cartCount={count} />;
}

export function CatalogLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium text-white"
      style={{ backgroundColor: "var(--accent)" }}
    >
      {children}
    </Link>
  );
}
