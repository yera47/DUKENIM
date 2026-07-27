"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { changeOrderStatusAction } from "@/lib/actions/orders";
import type { Enums } from "@/types/database";

const STATUSES: Array<{ value: Enums<"order_status">; label: string }> = [
  { value: "new", label: "Новый" },
  { value: "confirmed", label: "Подтверждён" },
  { value: "assembled", label: "Собран" },
  { value: "delivering", label: "В пути" },
  { value: "done", label: "Выполнен" },
  { value: "cancelled", label: "Отменён" },
];

type OrderStatusFormProps = {
  orderId: string;
  current: Enums<"order_status">;
};

export function OrderStatusForm({ orderId, current }: OrderStatusFormProps) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const status = new FormData(form).get("status");
        if (typeof status !== "string") return;
        startTransition(async () => {
          await changeOrderStatusAction(
            orderId,
            status as Enums<"order_status">,
          );
        });
      }}
    >
      <label className="space-y-1 text-sm">
        <span className="text-muted-foreground">Статус</span>
        <select
          name="status"
          defaultValue={current}
          className="border-input bg-background block h-9 rounded-lg border px-3"
        >
          {STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Сохраняем…" : "Обновить"}
      </Button>
    </form>
  );
}
