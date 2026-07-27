"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  signInAction,
  signOutAction,
  signUpOwnerAction,
  type AuthActionState,
} from "@/lib/actions/auth";

const initialState: AuthActionState = {};

type LoginFormProps = {
  nextPath: string;
  modeError?: string | null;
};

export function LoginForm({ nextPath, modeError }: LoginFormProps) {
  const [signInState, signIn, signInPending] = useActionState(
    signInAction,
    initialState,
  );
  const [signUpState, signUp, signUpPending] = useActionState(
    signUpOwnerAction,
    initialState,
  );

  const error = signInState.error ?? signUpState.error ?? modeError ?? null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Кабинет</h1>
        <p className="text-muted-foreground text-sm">
          Вход для владельца магазина
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {modeError ? (
        <form action={signOutAction}>
          <Button type="submit" variant="outline" className="w-full">
            Выйти из аккаунта
          </Button>
        </form>
      ) : null}

      <form action={signIn} className="space-y-4">
        <input type="hidden" name="next" value={nextPath} />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="owner@shop.kz"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Пароль</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
          />
        </div>
        <Button type="submit" className="w-full" disabled={signInPending}>
          {signInPending ? "Входим…" : "Войти"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">
            Первый раз
          </span>
        </div>
      </div>

      <form action={signUp} className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Создать аккаунт владельца тестового магазина (только если владельца ещё
          нет).
        </p>
        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password">Пароль</Label>
          <Input
            id="signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          className="w-full"
          disabled={signUpPending}
        >
          {signUpPending ? "Создаём…" : "Создать аккаунт владельца"}
        </Button>
      </form>
    </div>
  );
}
