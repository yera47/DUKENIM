"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCategoryAction, type ProductActionState } from "@/lib/actions/products";
import type { ProductCategory } from "@/lib/queries/products";

const initialState: ProductActionState = {};

export function CategoryManager({ categories }: { categories: ProductCategory[] }) {
  const [state, action, pending] = useActionState(createCategoryAction, initialState);

  return (
    <div className="space-y-4 rounded-xl border bg-background p-4">
      <div>
        <h2 className="font-medium">Разделы товаров</h2>
        <p className="text-muted-foreground text-sm">
          Создай категории вроде «Одежда», «Обувь», «Аксессуары».
        </p>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}

      <div className="flex flex-wrap gap-2">
        {categories.length === 0 ? (
          <p className="text-muted-foreground text-sm">Пока нет разделов</p>
        ) : (
          categories.map((category) => (
            <span
              key={category.id}
              className="rounded-full border px-3 py-1 text-sm"
            >
              {category.name}
            </span>
          ))
        )}
      </div>

      <form action={action} className="flex flex-col gap-2 sm:flex-row">
        <Input name="name" placeholder="Например: Одежда" required />
        <Button type="submit" disabled={pending}>
          {pending ? "Добавляем…" : "Добавить раздел"}
        </Button>
      </form>
    </div>
  );
}
