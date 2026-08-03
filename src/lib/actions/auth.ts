"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  getCurrentUser,
  getOwnerMembership,
  homePathForRole,
} from "@/lib/queries/auth";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string };

export async function signInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Введите email и пароль" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Неверный email или пароль" };
  }

  const user = await getCurrentUser();
  if (!user) return { error: "Не удалось прочитать профиль" };

  if (user.role === "owner") {
    const membership = await getOwnerMembership(user.id);
    if (!membership) {
      return { error: "К аккаунту не привязан магазин" };
    }
  }

  redirect(homePathForRole(user.role));
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/login");
}
