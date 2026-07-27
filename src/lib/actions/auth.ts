"use server";

import { redirect } from "next/navigation";

import {
  claimTestTenantOwnership,
  getPrimaryMembership,
} from "@/lib/queries/tenant-users";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type AuthActionState = {
  error?: string;
  success?: string;
};

export async function signInAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!email || !password) {
    return { error: "Введите email и пароль" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Неверный email или пароль" };
  }

  redirect(next.startsWith("/") ? next : "/admin");
}

export async function signUpOwnerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || password.length < 6) {
    return { error: "Email и пароль от 6 символов обязательны" };
  }

  const service = createServiceClient();
  const { data: created, error: createError } =
    await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError || !created.user) {
    return {
      error:
        createError?.message?.includes("already")
          ? "Этот email уже зарегистрирован — войдите сверху."
          : "Не удалось создать аккаунт",
    };
  }

  const claim = await claimTestTenantOwnership(created.user.id);
  if (!claim.ok) {
    await service.auth.admin.deleteUser(created.user.id);
    return { error: claim.error };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return {
      error: "Аккаунт создан, но вход не удался. Попробуйте войти вручную.",
    };
  }

  redirect("/admin");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requireAdminMembership() {
  const membership = await getPrimaryMembership();
  if (!membership) {
    redirect("/login?error=no-tenant");
  }
  return membership;
}
