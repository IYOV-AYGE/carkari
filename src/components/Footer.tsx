import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-emerald-950/10 bg-emerald-950 text-emerald-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <p className="text-xl font-extrabold">
            Car<span className="text-amber-400">Kari</span>
          </p>
          <p className="mt-2 text-sm text-emerald-200/70">
            La location de voiture au Maroc, auprès d&apos;agences vérifiées.
          </p>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold text-white">CarKari</p>
          <ul className="space-y-2 text-emerald-200/80">
            <li><Link href="/search" className="hover:text-white">Rechercher une voiture</Link></li>
            <li><Link href="/#agences" className="hover:text-white">Devenir agence partenaire</Link></li>
            <li><Link href="/#" className="hover:text-white">Aide</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold text-white">Légal</p>
          <ul className="space-y-2 text-emerald-200/80">
            <li><Link href="/#" className="hover:text-white">Conditions d&apos;utilisation</Link></li>
            <li><Link href="/#" className="hover:text-white">Politique d&apos;annulation</Link></li>
            <li><Link href="/#" className="hover:text-white">Confidentialité</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-emerald-200/60">
        © {new Date().getFullYear()} CarKari — www.carkari.com
      </div>
    </footer>
  );
}
