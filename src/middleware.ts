import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  extractPlatformSubdomainSlug,
  getActiveTenantByCustomDomain,
  getActiveTenantBySlug,
} from "@/lib/queries/tenants";
import type { Database } from "@/types/database";

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
  const requestHeaders = new Headers(request.headers);
  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/admin") && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && user) {
    const authError = request.nextUrl.searchParams.get("error");
    // Аккаунт без tenant_users должен видеть /login?error=no-tenant, а не луп
    if (authError !== "no-tenant") {
      const adminUrl = request.nextUrl.clone();
      adminUrl.pathname = "/admin";
      adminUrl.search = "";
      return NextResponse.redirect(adminUrl);
    }
  }

  const host = getRequestHost(request);
  let tenantId: string | null = null;
  let tenantSlug: string | null = null;

  const byDomain = await getActiveTenantByCustomDomain(host);
  if (byDomain) {
    tenantId = byDomain.id;
    tenantSlug = byDomain.slug;
  }

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

  if (tenantId && tenantSlug) {
    requestHeaders.set("x-tenant-id", tenantId);
    requestHeaders.set("x-tenant-slug", tenantSlug);
  } else {
    requestHeaders.delete("x-tenant-id");
    requestHeaders.delete("x-tenant-slug");
  }

  // Пересоздаём response с обновлёнными заголовками, сохраняя cookies сессии
  const finalResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.cookies.getAll().forEach((cookie) => {
    finalResponse.cookies.set(cookie);
  });

  return finalResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/webpack-hmr|api|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|webmanifest)$).*)",
  ],
};
