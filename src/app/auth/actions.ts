"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n/server";
import { safeNext } from "@/lib/auth/next";

export type AuthState = { error?: string; message?: string };

const M = {
  fr: {
    notConfirmed:
      "Email non confirmé. Cliquez sur le lien reçu par email, puis reconnectez-vous.",
    badLogin: "Email ou mot de passe incorrect.",
    cannotLogin: "Connexion impossible : ",
    shortPassword: "Le mot de passe doit contenir au moins 8 caractères.",
    cannotSignup: "Inscription impossible : ",
    created:
      "Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse — le lien vous ramènera ici.",
  },
  en: {
    notConfirmed:
      "Email not confirmed. Click the link we emailed you, then sign in again.",
    badLogin: "Wrong email or password.",
    cannotLogin: "Could not sign in: ",
    shortPassword: "Password must be at least 8 characters.",
    cannotSignup: "Could not sign up: ",
    created:
      "Account created! Check your inbox to confirm your address — the link brings you back here.",
  },
};

/** Absolute origin of this deployment, for Supabase's confirmation email. */
async function origin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "www.carkari.com";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function signIn(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const t = M[await getLang()];
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });
  if (error) {
    // Surface the real cause — a generic message hides fixable problems
    // (unconfirmed email, rate limit, provider disabled...).
    const msg = error.message.toLowerCase();
    if (msg.includes("not confirmed")) return { error: t.notConfirmed };
    if (msg.includes("invalid login")) return { error: t.badLogin };
    return { error: t.cannotLogin + error.message };
  }
  revalidatePath("/", "layout");
  // Send people back where they were headed (e.g. the agency application),
  // instead of dropping them on the homepage to find their way again.
  redirect(safeNext(String(formData.get("next") ?? "")) ?? "/");
}

export async function signUp(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const t = M[await getLang()];
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (password.length < 8) return { error: t.shortPassword };

  const callback =
    (await origin()) +
    "/auth/callback" +
    (next ? `?next=${encodeURIComponent(next)}` : "");

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName }, emailRedirectTo: callback },
  });
  if (error) return { error: t.cannotSignup + error.message };
  return { message: t.created };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
