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
    <main className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Корзина</h1>
      <CartView tenantSlug={tenant.slug} />
    </main>
  );
}
