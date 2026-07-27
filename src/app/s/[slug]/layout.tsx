import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

import { PwaRegister } from "@/components/storefront/PwaRegister";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import {
  getActiveTenantBySlug,
  resolveAccentColor,
} from "@/lib/queries/tenants";

import "../storefront.css";

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

  const accent = resolveAccentColor(tenant.accent_color);

  return {
    title: tenant.name,
    description: tenant.tagline ?? undefined,
    manifest: `/s/${tenant.slug}/manifest.webmanifest`,
    themeColor: accent,
    appleWebApp: {
      capable: true,
      title: tenant.name,
      statusBarStyle: "default",
    },
    icons: {
      icon: tenant.logo_url || `/s/${tenant.slug}/icon?size=192&generated=1`,
      apple: tenant.logo_url || `/s/${tenant.slug}/icon?size=192&generated=1`,
    },
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
    "--sf-accent": accent,
  } as CSSProperties;

  return (
    <div className="storefront min-h-screen font-sans antialiased" style={style}>
      <StorefrontShell tenant={tenant} />
      {children}
      <PwaRegister slug={tenant.slug} />
    </div>
  );
}
