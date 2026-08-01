import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { getDict, getLang } from "@/lib/i18n/server";
import { AccountMenu } from "@/components/AccountMenu";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getDict();
  const lang = await getLang();

  // Host-only entries are hidden from signed-in customers: they appear for
  // visitors (discovery) and for accounts that actually own an agency.
  let isAdmin = false;
  let hasAgency = false;
  if (user) {
    const [{ data: profile }, { data: agencies }] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase.rpc("my_agency"),
    ]);
    isAdmin = profile?.role === "admin";
    hasAgency = Array.isArray(agencies) && agencies.length > 0;
  }
  // Recruitment link is for signed-out visitors only.
  const showBecomeHost = !user;

  return (
    <header className="sticky top-0 z-40 border-b border-brand-950/10 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          {/* Rendered at the file's native 958x128 and sized with CSS height:
              the browser gets the full-resolution asset, so the chrome
              gradients in the wordmark stay sharp on retina screens. */}
          <Image
            src="/carkari-logo.png"
            alt="CarKari"
            width={958}
            height={128}
            quality={95}
            priority
            className="h-9 w-auto sm:h-11"
          />
        </Link>
        <div className="hidden items-center gap-6 text-sm font-medium text-brand-950/80 sm:flex">
          <Link href="/search" className="hover:text-brand-950">{t.nav.cars}</Link>
          <Link href="/#villes" className="hover:text-brand-950">{t.nav.cities}</Link>
          {showBecomeHost && (
            <Link href="/partenaires" className="hover:text-brand-950">
              {t.nav.partner}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <a
            href={lang === "fr" ? "/lang/en" : "/lang/fr"}
            className="rounded-full px-2 py-1 text-sm font-semibold text-brand-950/60 hover:bg-brand-950/5"
            title={lang === "fr" ? "Switch to English" : "Passer en français"}
          >
            {lang === "fr" ? "EN" : "FR"}
          </a>
          <AccountMenu
            t={t.menu}
            signedIn={Boolean(user)}
            isAdmin={isAdmin}
            hasAgency={hasAgency}
            onSignOut={
              <form action={signOut}>
                <button className="w-full rounded-lg px-3 py-2.5 text-left text-[15px] text-brand-950 hover:bg-brand-950/5">
                  {t.nav.logout}
                </button>
              </form>
            }
          />
        </div>
      </nav>
    </header>
  );
}
