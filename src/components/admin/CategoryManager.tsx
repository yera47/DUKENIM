"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCategoryAction,
  type ProductActionState,
} from "@/lib/actions/products";
import type { ProductCategory } from "@/lib/queries/products";

const initialState: ProductActionState = {};

type CategoryManagerProps = {
  categories: ProductCategory[];
};

export function CategoryManager({ categories }: CategoryManagerProps) {
  const [state, formAction, pending] = useActionState(
    createCategoryAction,
    initialState,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Разделы</h2>
        <p className="text-muted-foreground text-sm">
          Категории для витрины и карточек товаров
        </p>
      </div>

      {categories.length === 0 ? (
        <p className="text-muted-foreground text-sm">Пока нет разделов</p>
      ) : (
        <ul className="divide-y rounded-xl border bg-white">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <span className="font-medium">{category.name}</span>
              <span className="text-muted-foreground">
                {category.is_active ? "Активен" : "Скрыт"}
              </span>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="space-y-3 rounded-xl border bg-white p-4">
        <Label htmlFor="name">Новый раздел</Label>
        <div className="flex flex-wrap gap-2">
          <Input
            id="name"
            name="name"
            required
            placeholder="Футболки"
            className="min-w-[12rem] flex-1"
          />
          <Button
            type="submit"
            disabled={pending}
            className="bg-[#0E5C4A] text-white hover:bg-[#0E5C4A]/90"
          >
            {pending ? "Добавляем…" : "Добавить"}
          </Button>
        </div>
        {state.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}
        {state.success ? (
          <p className="text-sm text-emerald-700">{state.success}</p>
        ) : null}
      </form>
    </div>
  );
}
