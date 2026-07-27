// Refreshes Supabase auth sessions + sets language by visitor country (SPEC.md §5).
//
// FAIL-SAFE: middleware runs on every request, so anything that throws here
// takes the whole site down (MIDDLEWARE_INVOCATION_FAILED). Every step is
// guarded — a missing or malformed env var degrades to "logged out" instead of
// a 500 page.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { FR_COUNTRIES } from "@/lib/i18n/dict";

function envOrNull(name: string): string | null {
  const v = process.env[name];
  if (!v) return null;
  const clean = v.trim();
  // Guard against pasted .env blocks / newlines ending up in the value.
  if (!clean || /\s/.test(clean)) return null;
  return clean;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  try {
    // Auto-language: only when the visitor has no lang cookie yet.
    if (!request.cookies.get("lang")) {
      const country = request.headers.get("x-vercel-ip-country") ?? "MA";
      const lang = FR_COUNTRIES.has(country) ? "fr" : "en";
      request.cookies.set("lang", lang);
      response = NextResponse.next({ request });
      response.cookies.set("lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    }

    const url = envOrNull("NEXT_PUBLIC_SUPABASE_URL");
    const key = envOrNull("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    if (!url || !key) return response; // not configured — serve pages anyway

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (all) => {
          all.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          all.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    // Keeps sessions alive. Never let an auth hiccup break page delivery.
    await supabase.auth.getUser();
  } catch {
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
