import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { requireAdminMembership } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const membership = await requireAdminMembership();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Дашборд</h1>
        <p className="text-muted-foreground text-sm">
          {membership.tenant.name}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/products/new"
          className={cn(buttonVariants({ size: "lg" }))}
        >
          Добавить товар
        </Link>
        <Link
          href="/admin/orders"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          Заказы
        </Link>
        <Link
          href={`/s/${membership.tenant.slug}`}
          className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
        >
          Открыть витрину
        </Link>
      </div>
    </div>
  );
}
