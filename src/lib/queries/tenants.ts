import type { Tables } from "@/types/database";

export type PublicTenant = Pick<
  Tables<"tenants">,
  | "id"
  | "slug"
  | "custom_domain"
  | "name"
  | "tagline"
  | "logo_url"
  | "accent_color"
  | "city"
  | "phone"
  | "whatsapp"
  | "instagram"
  | "plan"
  | "status"
>;

const TENANT_SELECT =
  "id,slug,custom_domain,name,tagline,logo_url,accent_color,city,phone,whatsapp,instagram,plan,status";

const FALLBACK_ACCENT = "#0E5C4A";

export function resolveAccentColor(color: string | null | undefined): string {
  return color && color.trim().length > 0 ? color : FALLBACK_ACCENT;
}

async function fetchActiveTenant(filter: string): Promise<PublicTenant | null> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey) return null;

  const url = `${baseUrl}/rest/v1/tenants?select=${TENANT_SELECT}&status=eq.active&${filter}&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    next: { revalidate: 30 },
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as PublicTenant[];
  return rows[0] ?? null;
}

export async function getActiveTenantBySlug(
  slug: string,
): Promise<PublicTenant | null> {
  return fetchActiveTenant(`slug=eq.${encodeURIComponent(slug)}`);
}

export async function listAllTenants() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenants")
    .select(
      "id,slug,name,plan,status,city,phone,created_at,accent_color,logo_url",
    )
    .order("created_at", { ascending: false });
  return data ?? [];
}
