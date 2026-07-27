"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { PublicTenant } from "@/lib/queries/tenants";

type StorefrontHeaderProps = {
  tenant: PublicTenant;
  cartCount?: number;
};

export function StorefrontHeader({
  tenant,
  cartCount = 0,
}: StorefrontHeaderProps) {
  const base = `/s/${tenant.slug}`;
  const [bump, setBump] = useState(false);
  const [prev, setPrev] = useState(cartCount);

  useEffect(() => {
    if (cartCount > prev) {
      setBump(true);
      const t = window.setTimeout(() => setBump(false), 320);
      return () => window.clearTimeout(t);
    }
    setPrev(cartCount);
  }, [cartCount, prev]);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--sf-line)] bg-[var(--sf-bg)]/90 backdrop-blur-md">
      <div className="sf-container flex items-center justify-between gap-4 py-4">
        <Link href={base} className="min-w-0">
          <div className="flex items-center gap-3">
            {tenant.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenant.logo_url}
                alt=""
                className="size-8 rounded-full object-cover"
              />
            ) : null}
            <div className="min-w-0">
              <p className="truncate text-[15px] font-medium tracking-[-0.02em] text-[var(--sf-fg)]">
                {tenant.name}
              </p>
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-5 text-[13px] tracking-wide text-[var(--sf-muted)]">
          <Link
            href={`${base}/catalog`}
            className="transition-colors hover:text-[var(--sf-fg)]"
          >
            Каталог
          </Link>
          <Link
            href={`${base}/cart`}
            className={`relative transition-transform duration-200 hover:text-[var(--sf-fg)] ${
              bump ? "scale-110 text-[var(--sf-fg)]" : ""
            }`}
          >
            Корзина
            {cartCount > 0 ? (
              <span
                className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-medium text-white"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {cartCount}
              </span>
            ) : null}
          </Link>
        </nav>
      </div>
    </header>
  );
}
