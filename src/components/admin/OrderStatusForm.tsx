"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { changeOrderStatusAction } from "@/lib/actions/orders";
import type { Enums } from "@/types/database";

const STATUS_OPTIONS: Array<{
  value: Enums<"order_status">;
  label: string;
}> = [
  { value: "new", label: "Новый" },
  { value: "confirmed", label: "Подтверждён" },
  { value: "assembled", label: "Собран" },
  { value: "delivering", label: "В доставке" },
  { value: "done", label: "Готов" },
  { value: "cancelled", label: "Отменён" },
];

type OrderStatusFormProps = {
  orderId: string;
  currentStatus: Enums<"order_status">;
};

export function OrderStatusForm({
  orderId,
  currentStatus,
}: OrderStatusFormProps) {
  const [status, setStatus] = useState(currentStatus);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSave() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await changeOrderStatusAction(orderId, status);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSuccess("Статус обновлён");
    });
  }

  return (
    <div className="space-y-3 rounded-xl border bg-white p-4">
      <Label htmlFor="order_status">Статус заказа</Label>
      <select
        id="order_status"
        value={status}
        onChange={(e) => setStatus(e.target.value as Enums<"order_status">)}
        className="border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
      <Button
        type="button"
        disabled={pending || status === currentStatus}
        onClick={onSave}
        className="bg-[#0E5C4A] text-white hover:bg-[#0E5C4A]/90"
      >
        {pending ? "Сохраняем…" : "Сменить статус"}
      </Button>
    </div>
  );
}
