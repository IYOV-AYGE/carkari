"use client";

// Google sign-in WITHOUT the Supabase redirect screen.
//
// Two modes:
//  1. Google Identity Services (preferred): Google issues an ID token in-page,
//     so the consent screen shows OUR domain (carkari.com) — never the
//     Supabase project URL. The token is exchanged via signInWithIdToken.
//  2. Fallback to Supabase's OAuth redirect if no client ID is configured.
//
// Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID and the same client ID configured in
// Supabase → Authentication → Providers → Google.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

type CredentialResponse = { credential?: string };
type GoogleAccounts = {
  accounts: {
    id: {
      initialize: (o: Record<string, unknown>) => void;
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
    };
  };
};

async function sha256Hex(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function GoogleButton({
  label,
  next = null,
}: {
  label: string;
  /** Where to land after Google sign-in (already sanitised by the caller). */
  next?: string | null;
}) {
  const router = useRouter();
  const holder = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!CLIENT_ID || !holder.current) return;

    let cancelled = false;

    (async () => {
      // Nonce binds the token to this page load (replay protection).
      const rawNonce = crypto.randomUUID();
      const hashedNonce = await sha256Hex(rawNonce);

      const start = () => {
        const g = (window as unknown as { google?: GoogleAccounts }).google;
        if (!g || cancelled || !holder.current) return;

        g.accounts.id.initialize({
          client_id: CLIENT_ID,
          nonce: hashedNonce,
          use_fedcm_for_prompt: true,
          callback: async (res: CredentialResponse) => {
            if (!res.credential) return;
            setBusy(true);
            setError("");
            const supabase = createClient();
            const { error: err } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: res.credential,
              nonce: rawNonce,
            });
            if (err) {
              setError(err.message);
              setBusy(false);
              return;
            }
            router.refresh();
            router.push(next ?? "/");
          },
        });

        holder.current.innerHTML = "";
        g.accounts.id.renderButton(holder.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "center",
          width: 320,
        });
      };

      if ((window as unknown as { google?: GoogleAccounts }).google) {
        start();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = start;
      document.head.appendChild(script);
    })();

    return () => {
      cancelled = true;
    };
  }, [router, next]);

  // Fallback: classic Supabase OAuth redirect (shows the Supabase URL).
  async function redirectFlow() {
    setBusy(true);
    const supabase = createClient();
    const cb =
      `${window.location.origin}/auth/callback` +
      (next ? `?next=${encodeURIComponent(next)}` : "");
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: cb },
    });
  }

  if (!CLIENT_ID) {
    return (
      <button
        type="button"
        onClick={redirectFlow}
        disabled={busy}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-ink/15 bg-card py-3 font-semibold text-ink transition hover:bg-ink/[0.03] disabled:opacity-60"
      >
        <GoogleMark />
        {label}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div ref={holder} className="min-h-[44px]" />
      {busy && <p className="mt-2 text-sm text-ink/60">…</p>}
      {error && (
        <p className="mt-2 rounded-lg bg-red-50 dark:bg-red-500/15 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z" />
    </svg>
  );
}
