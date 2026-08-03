"use client";

import { useTransition } from "react";

import { toggleProductActiveAction } from "@/lib/actions/products";

export function ProductActiveToggle({
  productId,
  isActive,
}: {
  productId: string;
  isActive: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={isActive}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.checked;
          start(async () => {
            await toggleProductActiveAction(productId, next);
          });
        }}
      />
      {isActive ? "Да" : "Нет"}
    </label>
  );
}
