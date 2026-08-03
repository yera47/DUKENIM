import { PlanPanel } from "@/components/admin/PlanPanel";
import { requireOwner } from "@/lib/queries/auth";

export default async function PlanPage() {
  const { membership } = await requireOwner();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Тариф</h1>
      <PlanPanel currentPlan={membership.tenant.plan} />
    </div>
  );
}
