import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { getDict, getLang } from "@/lib/i18n/server";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getDict();
  const lang = await getLang();

  return (
    <header className="sticky top-0 z-40 border-b border-brand-950/10 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/carkari-logo.png"
            alt="CarKari"
            width={165}
            height={22}
            priority
          />
        </Link>
        <div className="hidden items-center gap-6 text-sm font-medium text-brand-950/80 sm:flex">
          <Link href="/search" className="hover:text-brand-950">{t.nav.cars}</Link>
          <Link href="/#villes" className="hover:text-brand-950">{t.nav.cities}</Link>
          <Link href="/#agences" className="hover:text-brand-950">{t.nav.partner}</Link>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={lang === "fr" ? "/lang/en" : "/lang/fr"}
            className="rounded-full px-2 py-1 text-sm font-semibold text-brand-950/60 hover:bg-brand-950/5"
            title={lang === "fr" ? "Switch to English" : "Passer en français"}
          >
            {lang === "fr" ? "EN" : "FR"}
          </a>
          {user ? (
            <>
              <span className="hidden text-sm text-brand-950/70 sm:inline">
                {user.user_metadata?.full_name || user.email}
              </span>
              <form action={signOut}>
                <button className="rounded-full border border-brand-950/15 px-4 py-2 text-sm font-medium text-brand-950 hover:bg-brand-950/5">
                  {t.nav.logout}
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/auth"
              className="rounded-full border border-brand-950/15 px-4 py-2 text-sm font-medium text-brand-950 hover:bg-brand-950/5"
            >
              {t.nav.login}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
