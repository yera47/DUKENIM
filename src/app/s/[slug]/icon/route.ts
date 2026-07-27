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

  if (tenant.logo_url) {
    return Response.redirect(tenant.logo_url, 302);
  }

  const accent = resolveAccentColor(tenant.accent_color);
  const letter = (tenant.name.trim()[0] ?? "D").toUpperCase();
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="${accent}"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial, sans-serif" font-size="240" font-weight="700" fill="#ffffff">${letter}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
