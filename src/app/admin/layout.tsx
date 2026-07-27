import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminMembership } from "@/lib/actions/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const membership = await requireAdminMembership();

  return <AdminShell membership={membership}>{children}</AdminShell>;
}
