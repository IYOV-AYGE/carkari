import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  COMMISSION_RATE,
  MOCK_VEHICLES,
  formatMad,
} from "@/lib/mock/vehicles";

export default async function VehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const v = MOCK_VEHICLES.find((x) => x.id === id);
  if (!v) notFound();

  const deposit = Math.ceil(v.dailyPriceMad * COMMISSION_RATE);

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <nav className="mb-4 text-sm text-emerald-950/60">
          <Link href="/search" className="hover:underline">Voitures</Link>
          {" / "}
          <span className="text-emerald-950">{v.make} {v.model}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <div
              className={`flex h-72 items-end rounded-2xl bg-gradient-to-br p-6 sm:h-96 ${v.tone}`}
              aria-hidden
            >
              <span className="text-3xl font-extrabold text-white/95 drop-shadow">
                {v.make} {v.model}
              </span>
            </div>

            <h1 className="mt-6 text-3xl font-extrabold text-emerald-950">
              {v.make} {v.model} <span className="font-medium text-emerald-950/50">{v.year}</span>
            </h1>
            <p className="mt-1 text-emerald-950/70">
              {v.city} · proposé par <span className="font-semibold">{v.agency}</span> · ★ {v.rating} ({v.reviewCount} avis)
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Boîte", v.transmission],
                ["Carburant", v.fuel],
                ["Places", String(v.seats)],
                ["Catégorie", v.category],
              ].map(([k, val]) => (
                <div key={k} className="rounded-xl border border-emerald-950/10 p-3 text-center">
                  <p className="text-xs uppercase tracking-wide text-emerald-950/50">{k}</p>
                  <p className="font-semibold capitalize text-emerald-950">{val}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl bg-emerald-950/[0.04] p-6 text-sm leading-relaxed text-emerald-950/80">
              <p className="mb-2 font-semibold text-emerald-950">Politique d&apos;annulation</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Annulation gratuite pendant 24 h après la réservation.</li>
                <li>Réservation à moins de 48 h du départ : acompte non remboursable.</li>
                <li>Si l&apos;agence ne fournit pas le véhicule : remboursement intégral.</li>
              </ul>
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-emerald-950/10 p-6 shadow-sm lg:sticky lg:top-24">
            <p className="text-emerald-950">
              <span className="text-3xl font-extrabold">{formatMad(v.dailyPriceMad)}</span>
              <span className="text-emerald-950/60"> / jour</span>
            </p>
            <div className="mt-4 space-y-2 border-t border-emerald-950/10 pt-4 text-sm text-emerald-950/80">
              <div className="flex justify-between">
                <span>Acompte en ligne (par jour)</span>
                <span className="font-semibold">{formatMad(deposit)}</span>
              </div>
              <div className="flex justify-between">
                <span>Solde à la prise du véhicule</span>
                <span className="font-semibold">{formatMad(v.dailyPriceMad - deposit)}</span>
              </div>
            </div>
            <button
              className="mt-6 w-full cursor-not-allowed rounded-xl bg-amber-500/60 py-3 font-semibold text-emerald-950"
              title="Disponible à l'étape 4"
              disabled
            >
              Réserver — bientôt
            </button>
            <p className="mt-3 text-center text-xs text-emerald-950/50">
              La réservation en ligne arrive à l&apos;étape 4 (paiement Stripe).
            </p>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
