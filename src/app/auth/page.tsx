"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signIn, signUp, type AuthState } from "./actions";

const initial: AuthState = {};

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginAction, loginPending] = useActionState(signIn, initial);
  const [signupState, signupAction, signupPending] = useActionState(signUp, initial);

  const state = mode === "login" ? loginState : signupState;
  const pending = mode === "login" ? loginPending : signupPending;

  const input =
    "mt-1 w-full rounded-lg border border-emerald-950/15 px-3 py-2.5 text-emerald-950";

  return (
    <main className="flex flex-1 items-center justify-center bg-emerald-950/[0.03] px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-emerald-950/10 bg-white p-8 shadow-sm">
        <Link href="/" className="text-2xl font-extrabold text-emerald-950">
          Car<span className="text-amber-500">Kari</span>
        </Link>

        <div className="mt-6 grid grid-cols-2 rounded-lg bg-emerald-950/5 p-1 text-sm font-semibold">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md py-2 transition ${mode === m ? "bg-white text-emerald-950 shadow" : "text-emerald-950/60"}`}
            >
              {m === "login" ? "Connexion" : "Créer un compte"}
            </button>
          ))}
        </div>

        <form
          action={mode === "login" ? loginAction : signupAction}
          className="mt-6 space-y-4"
        >
          {mode === "signup" && (
            <label className="block text-sm font-medium text-emerald-950">
              Nom complet
              <input name="full_name" required className={input} />
            </label>
          )}
          <label className="block text-sm font-medium text-emerald-950">
            Email
            <input type="email" name="email" required className={input} />
          </label>
          <label className="block text-sm font-medium text-emerald-950">
            Mot de passe
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
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-amber-500 py-3 font-semibold text-emerald-950 transition hover:bg-amber-400 disabled:opacity-60"
          >
            {pending
              ? "…"
              : mode === "login"
                ? "Se connecter"
                : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-emerald-950/50">
          Agence de location ?{" "}
          <Link href="/#agences" className="font-semibold text-emerald-800 hover:underline">
            Devenez partenaire
          </Link>{" "}
          — créez d&apos;abord un compte, nous vous contactons ensuite.
        </p>
      </div>
    </main>
  );
}
