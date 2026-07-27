import { NextResponse, type NextRequest } from "next/server";

import {
  extractPlatformSubdomainSlug,
  getActiveTenantByCustomDomain,
  getActiveTenantBySlug,
} from "@/lib/queries/tenants";

const SLUG_PATH_RE = /^\/s\/([^/]+)(?:\/|$)/;

function getRequestHost(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-host");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "";
  }
  return request.headers.get("host") ?? "";
}

function extractSlugFromPath(pathname: string): string | null {
  const match = pathname.match(SLUG_PATH_RE);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export async function middleware(request: NextRequest) {
  const host = getRequestHost(request);
  const pathname = request.nextUrl.pathname;

  let tenantId: string | null = null;
  let tenantSlug: string | null = null;

  // 1) custom_domain
  const byDomain = await getActiveTenantByCustomDomain(host);
  if (byDomain) {
    tenantId = byDomain.id;
    tenantSlug = byDomain.slug;
  }

  // 2) поддомен платформы slug.dukenim.kz (заготовка; на localhost/Vercel не сработает)
  if (!tenantId) {
    const platformSlug = extractPlatformSubdomainSlug(host);
    if (platformSlug) {
      const bySubdomain = await getActiveTenantBySlug(platformSlug);
      if (bySubdomain) {
        tenantId = bySubdomain.id;
        tenantSlug = bySubdomain.slug;
      }
    }
  }

  // 3) путь /s/[slug]
  if (!tenantId) {
    const pathSlug = extractSlugFromPath(pathname);
    if (pathSlug) {
      const byPath = await getActiveTenantBySlug(pathSlug);
      if (byPath) {
        tenantId = byPath.id;
        tenantSlug = byPath.slug;
      }
    }
  }

  const requestHeaders = new Headers(request.headers);
  if (tenantId && tenantSlug) {
    requestHeaders.set("x-tenant-id", tenantId);
    requestHeaders.set("x-tenant-slug", tenantSlug);
  } else {
    requestHeaders.delete("x-tenant-id");
    requestHeaders.delete("x-tenant-slug");
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Исключаем статику, Next internals и API —
     * middleware не должен ходить в БД на каждый ассет.
     */
    "/((?!_next/static|_next/image|_next/webpack-hmr|api|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|webmanifest)$).*)",
  ],
};
