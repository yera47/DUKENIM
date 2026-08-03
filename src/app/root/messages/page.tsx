import { RootMessagesClient } from "@/components/root/RootMessagesClient";
import { requireSuperadmin } from "@/lib/queries/auth";
import {
  listAllChangeRequests,
  listMessages,
} from "@/lib/queries/comms";
import { listAllTenants } from "@/lib/queries/tenants";

type Props = { searchParams: Promise<{ tenant?: string }> };

export default async function RootMessagesPage({ searchParams }: Props) {
  await requireSuperadmin();
  const params = await searchParams;
  const tenants = await listAllTenants();
  const tenantId = params.tenant ?? tenants[0]?.id ?? "";
  const [messages, requests] = await Promise.all([
    tenantId ? listMessages(tenantId) : Promise.resolve([]),
    listAllChangeRequests(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Чат и заявки</h1>
      <RootMessagesClient
        tenants={tenants.map((t) => ({ id: t.id, name: t.name }))}
        selectedTenantId={tenantId}
        messages={messages}
        requests={requests}
      />
    </div>
  );
}
