import { ImageResponse } from "next/og";

import { getActiveTenantBySlug, resolveAccentColor } from "@/lib/queries/tenants";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export const runtime = "edge";

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const tenant = await getActiveTenantBySlug(slug);

  if (!tenant) {
    return new Response("Not found", { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const sizeParam = Number.parseInt(searchParams.get("size") ?? "512", 10);
  const size = [192, 512].includes(sizeParam) ? sizeParam : 512;
  const accent = resolveAccentColor(tenant.accent_color);
  const letter = (tenant.name.trim()[0] ?? "D").toUpperCase();

  if (tenant.logo_url && !searchParams.has("generated")) {
    return Response.redirect(tenant.logo_url, 302);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: accent,
          color: "#ffffff",
          fontSize: Math.round(size * 0.45),
          fontWeight: 700,
          fontFamily: "Arial, sans-serif",
        }}
      >
        {letter}
      </div>
    ),
    {
      width: size,
      height: size,
    },
  );
}
