import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import {
  getActiveTenantBySlug,
  resolveAccentColor,
} from "@/lib/queries/tenants";

type StorefrontLayoutProps = {
  children: ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getActiveTenantBySlug(slug);

  if (!tenant) {
    return { title: "Магазин не найден" };
  }

  return {
    title: tenant.name,
    description: tenant.tagline ?? undefined,
  };
}

export default async function StorefrontLayout({
  children,
  params,
}: StorefrontLayoutProps) {
  const { slug } = await params;
  const tenant = await getActiveTenantBySlug(slug);

  if (!tenant) {
    notFound();
  }

  const accent = resolveAccentColor(tenant.accent_color);
  const style = {
    "--accent": accent,
  } as CSSProperties;

  return (
    <div className="min-h-screen bg-background text-foreground" style={style}>
      <StorefrontShell tenant={tenant} />
      {children}
    </div>
  );
}
