import { getActiveTenantBySlug, resolveAccentColor } from "@/lib/queries/tenants";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const tenant = await getActiveTenantBySlug(slug);

  if (!tenant) {
    return new Response("Not found", { status: 404 });
  }

  const accent = resolveAccentColor(tenant.accent_color);
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const startUrl = `/s/${tenant.slug}`;
  const iconSrc = tenant.logo_url || `${startUrl}/icon`;

  const manifest = {
    name: tenant.name,
    short_name: tenant.name.slice(0, 12),
    description: tenant.tagline ?? `Витрина ${tenant.name}`,
    start_url: startUrl,
    scope: startUrl,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: accent,
    lang: "ru",
    icons: [
      {
        src: iconSrc,
        sizes: "192x192",
        type: tenant.logo_url ? "image/png" : "image/svg+xml",
        purpose: "any maskable",
      },
      {
        src: iconSrc,
        sizes: "512x512",
        type: tenant.logo_url ? "image/png" : "image/svg+xml",
        purpose: "any maskable",
      },
    ],
    id: startUrl,
  };

  // origin reserved for future absolute icon URLs if needed
  void origin;

  return Response.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "no-store",
    },
  });
}
