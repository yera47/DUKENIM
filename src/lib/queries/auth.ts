import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Enums, Tables } from "@/types/database";

export type ProfileRole = Enums<"profile_role">;

export type AppUser = {
  id: string;
  email: string | undefined;
  role: ProfileRole;
};

export type OwnerMembership = {
  tenant_id: string;
  role: Enums<"staff_role">;
  tenant: Pick<
    Tables<"tenants">,
    "id" | "slug" | "name" | "accent_color" | "plan" | "status" | "logo_url"
  >;
};

export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email,
    role: profile?.role ?? "customer",
  };
}

export async function getOwnerMembership(
  userId: string,
): Promise<OwnerMembership | null> {
  const supabase = await createClient();
  const { data: link } = await supabase
    .from("tenant_users")
    .select("tenant_id, role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!link) return null;

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, slug, name, accent_color, plan, status, logo_url")
    .eq("id", link.tenant_id)
    .maybeSingle();

  if (!tenant) return null;

  return {
    tenant_id: link.tenant_id,
    role: link.role,
    tenant,
  };
}

export async function requireOwner(): Promise<{
  user: AppUser;
  membership: OwnerMembership;
}> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "superadmin") redirect("/root");
  if (user.role !== "owner") redirect("/login");

  const membership = await getOwnerMembership(user.id);
  if (!membership) redirect("/login?error=no-shop");
  return { user, membership };
}

export async function requireSuperadmin(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "superadmin") redirect("/login?error=forbidden");
  return user;
}

export function homePathForRole(role: ProfileRole): string {
  if (role === "superadmin") return "/root";
  if (role === "owner") return "/admin";
  return "/";
}
