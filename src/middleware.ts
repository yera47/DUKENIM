import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  const needsAuth =
    pathname.startsWith("/admin") || pathname.startsWith("/root");
  if (!needsAuth) return response;

  let userId: string | null = null;
  let role: Database["public"]["Enums"]["profile_role"] | null = null;

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
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
  userId = user?.id ?? null;

  if (!userId) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  role = profile?.role ?? "customer";

  if (pathname.startsWith("/root") && role !== "superadmin") {
    return NextResponse.redirect(new URL("/login?error=forbidden", request.url));
  }

  if (pathname.startsWith("/admin") && role !== "owner" && role !== "superadmin") {
    return NextResponse.redirect(new URL("/login?error=forbidden", request.url));
  }

  if (pathname.startsWith("/admin") && role === "superadmin") {
    return NextResponse.redirect(new URL("/root", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
