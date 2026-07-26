"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

export async function signIn(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });
  if (error) {
    // Surface the real cause — a generic message hides fixable problems
    // (unconfirmed email, rate limit, provider disabled...).
    const msg = error.message.toLowerCase();
    if (msg.includes("not confirmed"))
      return { error: "Email non confirmé. Vérifiez votre boîte mail (ou confirmez le compte dans Supabase)." };
    if (msg.includes("invalid login"))
      return { error: "Email ou mot de passe incorrect." };
    return { error: `Connexion impossible : ${error.message}` };
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUp(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "");

  if (password.length < 8)
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) return { error: "Inscription impossible : " + error.message };
  return {
    message:
      "Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
