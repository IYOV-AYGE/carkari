import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SearchBar } from "@/components/SearchBar";
import { VehicleCard } from "@/components/VehicleCard";
import { CITIES, MOCK_VEHICLES } from "@/lib/mock/vehicles";

export default function HomePage() {
  const featured = MOCK_VEHICLES.slice(0, 6);
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-brand-950 px-4 pb-20 pt-16 text-white">
          <Image
            src="/hero-car.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-25"
          />
          <div className="relative mx-auto max-w-6xl">
            <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
              Louez la bonne voiture,{" "}
              <span className="text-accent-400">partout au Maroc</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-brand-100/80">
              Des agences vérifiées, des prix clairs, une réservation en ligne.
              Payez un simple acompte — le reste à la prise du véhicule.
            </p>
            <div className="mt-8">
              <SearchBar />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-brand-950">Véhicules populaires</h2>
            <Link href="/search" className="text-sm font-semibold text-brand-800 hover:underline">
              Tout voir →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((v) => <VehicleCard key={v.id} v={v} />)}
          </div>
        </section>

        <section id="villes" className="bg-brand-950/[0.03] py-14">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-6 text-2xl font-bold text-brand-950">Par ville</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {CITIES.map((c) => (
                <Link
                  key={c}
                  href={`/search?city=${encodeURIComponent(c)}`}
                  className="rounded-xl border border-brand-950/10 bg-white px-4 py-6 text-center font-semibold text-brand-950 transition hover:border-accent-400 hover:shadow"
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="mb-8 text-center text-2xl font-bold text-brand-950">
            Comment ça marche
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              ["1. Choisissez", "Comparez les voitures d'agences vérifiées dans votre ville."],
              ["2. Réservez", "Payez un acompte en ligne sécurisé pour bloquer vos dates."],
              ["3. Roulez", "Réglez le solde à la prise du véhicule, directement à l'agence."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-brand-950/10 p-6">
                <p className="text-lg font-bold text-brand-950">{t}</p>
                <p className="mt-2 text-brand-950/70">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="agences" className="bg-brand-950 py-14 text-white">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h2 className="text-2xl font-bold">Vous êtes une agence de location ?</h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-100/80">
              Mettez votre flotte en ligne sur CarKari et recevez des réservations
              sans effort. Inscription gratuite, commission uniquement sur les
              locations réalisées.
            </p>
            <Link
              href="/auth"
              className="mt-6 inline-block rounded-full bg-accent-500 px-8 py-3 font-semibold text-white transition hover:bg-accent-400"
            >
              Devenir partenaire
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
