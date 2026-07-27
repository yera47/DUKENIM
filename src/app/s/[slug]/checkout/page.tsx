import { notFound } from "next/navigation";

import { CheckoutForm } from "@/components/storefront/CheckoutForm";
import {
  getPublicSettings,
  listPublicDeliveryZones,
} from "@/lib/queries/catalog";
import { getActiveTenantBySlug } from "@/lib/queries/tenants";

type CheckoutPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;
  const tenant = await getActiveTenantBySlug(slug);
  if (!tenant) notFound();

  const [settings, zones] = await Promise.all([
    getPublicSettings(tenant.id),
    listPublicDeliveryZones(tenant.id),
  ]);

  return (
    <main className="sf-container max-w-lg space-y-8 py-10 pb-28">
      <h1 className="text-3xl font-medium tracking-[-0.03em] text-[var(--sf-fg)]">
        Оформление
      </h1>
      <CheckoutForm
        tenantId={tenant.id}
        tenantSlug={tenant.slug}
        settings={settings}
        zones={zones}
        pickupAddress={tenant.address}
      />
    </main>
  );
}
