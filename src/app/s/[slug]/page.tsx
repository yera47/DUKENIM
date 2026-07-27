import { notFound } from "next/navigation";

import { getActiveTenantBySlug } from "@/lib/queries/tenants";

type StorefrontPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function StorefrontPage({ params }: StorefrontPageProps) {
  const { slug } = await params;
  const tenant = await getActiveTenantBySlug(slug);

  if (!tenant) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <div
        className="h-1.5 w-16 rounded-full"
        style={{ backgroundColor: "var(--accent)" }}
        aria-hidden
      />
      <div className="space-y-3">
        <h1
          className="text-4xl font-semibold tracking-tight sm:text-5xl"
          style={{ color: "var(--accent)" }}
        >
          {tenant.name}
        </h1>
        {tenant.tagline ? (
          <p className="text-muted-foreground max-w-xl text-lg">
            {tenant.tagline}
          </p>
        ) : null}
      </div>
      <p className="text-sm text-foreground/70">{tenant.city}</p>
    </main>
  );
}
