"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import type { PublicTenant } from "@/lib/queries/tenants";
import { useCartStore } from "@/lib/store/cart";

type Props = {
  tenant: PublicTenant;
};

export function StorefrontShell({ tenant }: Props) {
  const setTenantSlug = useCartStore((s) => s.setTenantSlug);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setTenantSlug(tenant.slug);
    setCount(useCartStore.getState().totalQty());
    return useCartStore.subscribe((state) => {
      setCount(state.items.reduce((sum, item) => sum + item.qty, 0));
    });
  }, [setTenantSlug, tenant.slug]);

  return <StorefrontHeader tenant={tenant} cartCount={count} />;
}

export function CatalogLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="sf-btn sf-btn-primary">
      {children}
    </Link>
  );
}
