import type { Tables } from "@/types/database";

/** Публичные поля арендатора для витрины (без секретов). */
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
  | "status"
>;

const TENANT_SELECT =
  "id,slug,custom_domain,name,tagline,logo_url,accent_color,city,status";

const FALLBACK_ACCENT = "#1F5F4E";

export function resolveAccentColor(color: string | null | undefined): string {
  return color && color.trim().length > 0 ? color : FALLBACK_ACCENT;
}

/**
 * Лёгкий REST-запрос к Supabase.
 * Работает и в Edge (middleware), и в Server Components —
 * без зависимости от cookies / Node-API.
 */
async function fetchActiveTenant(
  filter: string,
): Promise<PublicTenant | null> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    return null;
  }

  const url = `${baseUrl}/rest/v1/tenants?select=${TENANT_SELECT}&${filter}&status=eq.active&limit=1`;

  const response = await fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const rows = (await response.json()) as PublicTenant[];
  return rows[0] ?? null;
}

export async function getActiveTenantBySlug(
  slug: string,
): Promise<PublicTenant | null> {
  if (!slug) return null;
  return fetchActiveTenant(`slug=eq.${encodeURIComponent(slug)}`);
}

export async function getActiveTenantByCustomDomain(
  host: string,
): Promise<PublicTenant | null> {
  if (!host) return null;
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  if (!hostname) return null;
  return fetchActiveTenant(
    `custom_domain=eq.${encodeURIComponent(hostname)}`,
  );
}

/** Корневой домен платформы для поддоменов вида slug.dukenim.kz */
export const PLATFORM_ROOT_DOMAIN = "dukenim.kz";

/**
 * Извлекает slug из поддомена платформы.
 * На localhost / vercel.app всегда вернёт null — это ожидаемо.
 */
export function extractPlatformSubdomainSlug(host: string): string | null {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  if (!hostname || hostname === PLATFORM_ROOT_DOMAIN) return null;
  if (hostname === `www.${PLATFORM_ROOT_DOMAIN}`) return null;

  const suffix = `.${PLATFORM_ROOT_DOMAIN}`;
  if (!hostname.endsWith(suffix)) return null;

  const sub = hostname.slice(0, -suffix.length);
  if (!sub || sub.includes(".")) return null;
  return sub;
}
