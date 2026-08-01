"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authHref } from "@/lib/auth/next";

export type MenuLabels = {
  login: string; signup: string; partner: string; dashboard: string;
  myBookings: string; verification: string;
  admin: string; why: string; help: string; legal: string;
  insurance: string; carculator: string; logout: string; open: string;
};

/** Turo-style hamburger + avatar button opening a single dropdown. */
export function AccountMenu({
  t,
  signedIn,
  isAdmin,
  hasAgency,
  onSignOut,
}: {
  t: MenuLabels;
  signedIn: boolean;
  isAdmin: boolean;
  /** true when this account owns/works for an agency */
  hasAgency: boolean;
  onSignOut: React.ReactNode;
}) {
  // "Become a host" is recruitment: only for signed-out visitors. Customers
  // don't need it, and existing hosts already have their agency space.
  const showBecomeHost = !signedIn;
  // Signing in from the menu returns you to the page you were reading.
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const item =
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-ink hover:bg-ink/5";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t.open}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-ink/15 px-3 py-2 transition hover:shadow-sm"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
        </svg>
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-ink/70" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="10" r="3.2" />
          <path d="M5.8 19a6.5 6.5 0 0 1 12.4 0" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-ink/10 bg-card p-2 shadow-xl">
          {!signedIn ? (
            <>
              <Link
                href={authHref(pathname, "login")}
                className={item}
                onClick={() => setOpen(false)}
              >
                {t.login}
              </Link>
              <Link
                href={authHref(pathname, "signup")}
                className={item}
                onClick={() => setOpen(false)}
              >
                {t.signup}
              </Link>
            </>
          ) : (
            <>
              <Link href="/mes-reservations" className={item} onClick={() => setOpen(false)}>
                <Icon d="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" /> {t.myBookings}
              </Link>
              <Link href="/verification" className={item} onClick={() => setOpen(false)}>
                <Icon d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3ZM9 12l2 2 4-4" /> {t.verification}
              </Link>
              {hasAgency && (
                <Link href="/agence" className={item} onClick={() => setOpen(false)}>
                  <Icon d="M4 17h16M6 17V9l6-4 6 4v8" /> {t.dashboard}
                </Link>
              )}
              {isAdmin && (
                <Link href="/admin" className={item} onClick={() => setOpen(false)}>
                  <Icon d="M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7l7-4Z" /> {t.admin}
                </Link>
              )}
            </>
          )}

          {showBecomeHost && (
            <Link href="/partenaires" className={item} onClick={() => setOpen(false)}>
              <Icon d="M3 13h18M5 13V9l2-4h10l2 4v4M7 17h2M15 17h2" /> {t.partner}
            </Link>
          )}

          <div className="my-2 border-t border-ink/10" />

          <Link href="/about" className={item} onClick={() => setOpen(false)}>
            <Icon d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 8h.01M11 12h1v4h1" /> {t.why}
          </Link>
          <Link href="/aide" className={item} onClick={() => setOpen(false)}>
            <Icon d="M4 14v-3a8 8 0 0 1 16 0v3M4 14a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2Zm16 0a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2Z" /> {t.help}
          </Link>
          <Link href="/conditions" className={item} onClick={() => setOpen(false)}>
            <Icon d="M7 3h7l5 5v13H7zM14 3v5h5" /> {t.legal}
          </Link>
          <Link href="/assurance" className={item} onClick={() => setOpen(false)}>
            <Icon d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3Z" /> {t.insurance}
          </Link>
          <Link href="/carculator" className={item} onClick={() => setOpen(false)}>
            <Icon d="M5 3h14v18H5zM8 7h8M8 11h2M12 11h2M16 11h.01M8 15h2M12 15h2M16 15h.01" /> {t.carculator}
          </Link>

          {signedIn && (
            <>
              <div className="my-2 border-t border-ink/10" />
              <div className="px-1">{onSignOut}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-ink/70" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}
