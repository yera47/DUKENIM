import { SettingsForms } from "@/components/admin/SettingsForms";
import { requireAdminMembership } from "@/lib/actions/auth";
import {
  getBrandSettings,
  getSafeDeliverySettings,
  listAdminDeliveryZones,
} from "@/lib/queries/settings";

export default async function AdminSettingsPage() {
  const membership = await requireAdminMembership();
  const [brand, delivery, zones] = await Promise.all([
    getBrandSettings(membership.tenant_id),
    getSafeDeliverySettings(membership.tenant_id),
    listAdminDeliveryZones(membership.tenant_id),
  ]);

  if (!brand) {
    return <p className="text-sm text-destructive">Магазин не найден</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Настройки</h1>
        <p className="text-muted-foreground text-sm">
          Бренд, контакты, доставка и зоны
        </p>
      </div>
      <SettingsForms brand={brand} delivery={delivery} zones={zones} />
    </div>
  );
}
