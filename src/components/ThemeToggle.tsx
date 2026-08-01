"use client";

import { useEffect, useState } from "react";

/**
 * Light/dark switch.
 *
 * The choice is stored in a cookie rather than localStorage so the SERVER can
 * read it and put `class="dark"` on <html> during SSR — otherwise every page
 * would flash white before hydration. The click also flips the class straight
 * away, so the change is instant with no round trip.
 */
export function ThemeToggle({ label }: { label: string }) {
  const [dark, setDark] = useState(false);

  // Sync from the DOM after mount: the class is already correct (set by the
  // server or the pre-paint script), we just need our state to agree with it.
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    // 1 year, Lax so it survives normal navigation.
    document.cookie = `theme=${next ? "dark" : "light"}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="rounded-full p-2 text-ink/60 transition hover:bg-ink/5 hover:text-ink"
    >
      {dark ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
