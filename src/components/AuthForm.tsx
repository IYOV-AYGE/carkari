"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn, signUp, type AuthState } from "@/app/auth/actions";
import type { Dict } from "@/lib/i18n/dict";

const initial: AuthState = {};

export function AuthForm({ t }: { t: Dict["auth"] }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginAction, loginPending] = useActionState(signIn, initial);
  const [signupState, signupAction, signupPending] = useActionState(signUp, initial);

  const state = mode === "login" ? loginState : signupState;
  const pending = mode === "login" ? loginPending : signupPending;

  const input =
    "mt-1 w-full rounded-lg border border-brand-950/15 px-3 py-2.5 text-brand-950";

  return (
    <div className="w-full max-w-md rounded-2xl border border-brand-950/10 bg-white p-8 shadow-sm">
      <Link href="/" className="inline-block">
        <Image src="/carkari-logo.png" alt="CarKari" width={180} height={24} />
      </Link>

      <div className="mt-6 grid grid-cols-2 rounded-lg bg-brand-950/5 p-1 text-sm font-semibold">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-md py-2 transition ${mode === m ? "bg-white text-brand-950 shadow" : "text-brand-950/60"}`}
          >
            {m === "login" ? t.login : t.signup}
          </button>
        ))}
      </div>

      <form
        action={mode === "login" ? loginAction : signupAction}
        className="mt-6 space-y-4"
      >
        {mode === "signup" && (
          <label className="block text-sm font-medium text-brand-950">
            {t.fullName}
            <input name="full_name" required className={input} />
          </label>
        )}
        <label className="block text-sm font-medium text-brand-950">
          {t.email}
          <input type="email" name="email" required className={input} />
        </label>
        <label className="block text-sm font-medium text-brand-950">
          {t.password}
          <input
            type="password"
            name="password"
            required
            minLength={mode === "signup" ? 8 : undefined}
            className={input}
          />
        </label>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}
        {state.message && (
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-accent-500 py-3 font-semibold text-white transition hover:bg-accent-400 disabled:opacity-60"
        >
          {pending ? "…" : mode === "login" ? t.submitLogin : t.submitSignup}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-brand-950/50">
        {t.agencyQ}{" "}
        <Link href="/partenaires" className="font-semibold text-brand-800 hover:underline">
          {t.agencyLink}
        </Link>{" "}
        {t.agencyNote}
      </p>
    </div>
  );
}
