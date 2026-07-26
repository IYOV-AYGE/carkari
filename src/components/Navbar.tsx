import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-emerald-950/10 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-2xl font-extrabold tracking-tight text-emerald-950">
          Car<span className="text-amber-500">Kari</span>
        </Link>
        <div className="hidden items-center gap-6 text-sm font-medium text-emerald-950/80 sm:flex">
          <Link href="/search" className="hover:text-emerald-950">Voitures</Link>
          <Link href="/#villes" className="hover:text-emerald-950">Villes</Link>
          <Link href="/#agences" className="hover:text-emerald-950">Devenir partenaire</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth"
            className="rounded-full border border-emerald-950/15 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-950/5"
          >
            Connexion
          </Link>
        </div>
      </nav>
    </header>
  );
}
