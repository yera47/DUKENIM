import { notFound } from "next/navigation";

import { CartView } from "@/components/storefront/CartView";
import { getActiveTenantBySlug } from "@/lib/queries/tenants";

type CartPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CartPage({ params }: CartPageProps) {
  const { slug } = await params;
  const tenant = await getActiveTenantBySlug(slug);
  if (!tenant) notFound();

  return (
    <main className="sf-container max-w-lg space-y-8 py-10 pb-28">
      <h1 className="text-3xl font-medium tracking-[-0.03em] text-[var(--sf-fg)]">
        Корзина
      </h1>
      <CartView tenantSlug={tenant.slug} />
    </main>
  );
}
