import { SettingsForms } from "@/components/admin/SettingsForms";
import { requireOwner } from "@/lib/queries/auth";
import {
  getSafeDeliverySettings,
  listAdminDeliveryZones,
} from "@/lib/queries/settings";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const { membership } = await requireOwner();
  const supabase = await createClient();
  const [{ data: brand }, delivery, zones] = await Promise.all([
    supabase
      .from("tenants")
      .select(
        "id, slug, name, tagline, logo_url, accent_color, city, phone, whatsapp, instagram",
      )
      .eq("id", membership.tenant_id)
      .single(),
    getSafeDeliverySettings(membership.tenant_id),
    listAdminDeliveryZones(membership.tenant_id),
  ]);

  if (!brand) return <p>Магазин не найден</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Настройки</h1>
      <SettingsForms brand={brand} delivery={delivery} zones={zones} />
    </div>
  );
}
