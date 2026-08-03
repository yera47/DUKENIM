import { RequestsPanel } from "@/components/admin/RequestsPanel";
import { requireOwner } from "@/lib/queries/auth";
import { listChangeRequests, listMessages } from "@/lib/queries/comms";
import { planHas } from "@/lib/plans";

export default async function RequestsPage() {
  const { membership } = await requireOwner();
  const [requests, messages] = await Promise.all([
    listChangeRequests(membership.tenant_id),
    listMessages(membership.tenant_id),
  ]);
  const priority = planHas(membership.tenant.plan, "priorityRequests");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Заявки и чат</h1>
        <p className="text-sm text-neutral-600">
          {priority
            ? "Pro: заявки в приоритете у команды платформы."
            : "Можно отправить заявку на изменение сайта. Приоритет — на тарифе Pro."}
        </p>
      </div>
      <RequestsPanel requests={requests} messages={messages} />
    </div>
  );
}
