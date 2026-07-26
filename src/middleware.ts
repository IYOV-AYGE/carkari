// Refreshes Supabase auth sessions + sets language by visitor country (SPEC.md §5).
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { FR_COUNTRIES } from "@/lib/i18n/dict";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Auto-language: only when the visitor has no lang cookie yet.
  // Vercel provides the country via x-vercel-ip-country.
  if (!request.cookies.get("lang")) {
    const country = request.headers.get("x-vercel-ip-country") ?? "MA";
    const lang = FR_COUNTRIES.has(country) ? "fr" : "en";
    request.cookies.set("lang", lang);
    response = NextResponse.next({ request });
    response.cookies.set("lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  );

  // IMPORTANT: do not remove — keeps sessions alive.
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
