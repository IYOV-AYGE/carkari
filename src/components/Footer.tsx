import Link from "next/link";
import Image from "next/image";
import { CITIES } from "@/lib/mock/vehicles";
import { getDict } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

const citySlug = (c: string) =>
  c.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export async function Footer() {
  const t = await getDict();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Hide the host recruitment link from anyone already signed in.
  const links1 = user
    ? t.footer.links1.filter(([href]) => href !== "/partenaires")
    : t.footer.links1;
  return (
    <footer className="mt-auto border-t border-brand-950/10 bg-brand-950 text-brand-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Image
            src="/carkari-logo.png"
            alt="CarKari"
            width={958}
            height={128}
            quality={95}
            className="h-10 w-auto sm:h-12"
          />
          <p className="mt-3 text-sm text-brand-200/70">{t.footer.tagline}</p>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold text-white">{t.footer.col1}</p>
          <ul className="space-y-2 text-brand-200/80">
            {links1.map(([href, label]) => (
              <li key={label}>
                <Link href={href} className="hover:text-white">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold text-white">{t.footer.col2}</p>
          <ul className="space-y-2 text-brand-200/80">
            {t.footer.links2.map(([href, label]) => (
              <li key={label}>
                <Link href={href} className="hover:text-white">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold text-white">{t.footer.col3}</p>
          <ul className="space-y-2 text-brand-200/80">
            {CITIES.map((c) => (
              <li key={c}>
                <Link href={`/location-voiture/${citySlug(c)}`} className="hover:text-white">
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-brand-200/60">
        © {new Date().getFullYear()} CarKari — www.carkari.com
      </div>
    </footer>
  );
}
