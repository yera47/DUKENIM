"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createShopAction,
  type SettingsState,
} from "@/lib/actions/settings";
import type { PlanId } from "@/lib/plans";

const initialState: SettingsState = {};

const PLANS: Array<{ value: PlanId; label: string }> = [
  { value: "basic", label: "Basic" },
  { value: "standard", label: "Standard" },
  { value: "pro", label: "Pro" },
];

export function CreateShopForm() {
  const [state, formAction, pending] = useActionState(
    createShopAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="mx-auto max-w-lg space-y-4 rounded-xl border bg-white p-4"
    >
      <div>
        <h2 className="text-lg font-semibold">Новый магазин</h2>
        <p className="text-muted-foreground text-sm">
          Создаёт витрину и аккаунт владельца
        </p>
      </div>

      {state.error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="name">Название</Label>
        <Input id="name" name="name" required placeholder="NIM Store" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          required
          placeholder="nim"
          pattern="[a-z0-9-]+"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Телефон магазина</Label>
        <Input id="phone" name="phone" required placeholder="+77001234567" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="owner_email">Email владельца</Label>
        <Input
          id="owner_email"
          name="owner_email"
          type="email"
          required
          placeholder="owner@shop.kz"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="owner_password">Пароль владельца</Label>
        <Input
          id="owner_password"
          name="owner_password"
          type="password"
          required
          minLength={6}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="plan">Тариф</Label>
        <select
          id="plan"
          name="plan"
          defaultValue="basic"
          className="border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm"
        >
          {PLANS.map((plan) => (
            <option key={plan.value} value={plan.value}>
              {plan.label}
            </option>
          ))}
        </select>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="bg-[#0E5C4A] text-white hover:bg-[#0E5C4A]/90"
      >
        {pending ? "Создаём…" : "Создать магазин"}
      </Button>
    </form>
  );
}
