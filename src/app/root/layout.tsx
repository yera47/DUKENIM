import { RootShell } from "@/components/root/RootShell";
import { requireSuperadmin } from "@/lib/queries/auth";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSuperadmin();
  return <RootShell email={user.email}>{children}</RootShell>;
}
