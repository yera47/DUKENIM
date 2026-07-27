import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdminMembership } from "@/lib/actions/auth";
import { formatPrice } from "@/lib/format-price";
import { listOrdersForTenant } from "@/lib/queries/orders";

const STATUS_LABEL: Record<string, string> = {
  new: "Новый",
  confirmed: "Подтверждён",
  assembled: "Собран",
  delivering: "В пути",
  done: "Выполнен",
  cancelled: "Отменён",
};

export default async function AdminOrdersPage() {
  const membership = await requireAdminMembership();
  const orders = await listOrdersForTenant(membership.tenant_id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Заказы</h1>
        <p className="text-muted-foreground text-sm">{orders.length} шт.</p>
      </div>

      {orders.length === 0 ? (
        <p className="text-muted-foreground text-sm">Заказов пока нет</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>№</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Источник</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      #{order.order_number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{order.customers?.name ?? "—"}</p>
                      <p className="text-muted-foreground text-xs">
                        {order.customers?.phone ?? ""}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{formatPrice(order.total)}</TableCell>
                  <TableCell>
                    {order.source === "online" ? "Онлайн" : "Зал"}
                  </TableCell>
                  <TableCell>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
