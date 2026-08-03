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
  const startUrl = `/s/${tenant.slug}`;
  const icon192 = `${startUrl}/icon?size=192&generated=1`;
  const icon512 = `${startUrl}/icon?size=512&generated=1`;

  const manifest = {
    name: tenant.name,
    short_name: tenant.name.slice(0, 12),
    description: tenant.tagline ?? `Витрина ${tenant.name}`,
    start_url: startUrl,
    scope: startUrl,
    display: "standalone",
    background_color: "#fafaf8",
    theme_color: accent,
    lang: "ru",
    icons: [
      {
        src: icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    id: startUrl,
  };

  return Response.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "no-store",
    },
  });
}
