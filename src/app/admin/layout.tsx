import { AdminShell } from "@/components/admin/AdminShell";
import { requireOwner } from "@/lib/queries/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { membership } = await requireOwner();
  return <AdminShell membership={membership}>{children}</AdminShell>;
}
