import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { VerifiedBadge } from "@/components/badges";
import {
  COMMISSION_RATE,
  MOCK_VEHICLES,
  formatMad,
} from "@/lib/mock/vehicles";
import { getLang } from "@/lib/i18n/server";

const L = {
  fr: {
    crumb: "Voitures",
    by: "proposé par",
    reviews: "avis",
    specs: [["Boîte"], ["Carburant"], ["Places"], ["Catégorie"]],
    gearbox: "Boîte", fuel: "Carburant", seats: "Places", cat: "Catégorie",
    policyTitle: "Politique d'annulation",
    policy: [
      "Annulation gratuite pendant 24 h après la réservation.",
      "Réservation à moins de 48 h du départ : acompte non remboursable.",
      "Si l'agence ne fournit pas le véhicule : remboursement intégral.",
    ],
    perDay: "/ jour",
    depositLine: "Acompte en ligne (par jour)",
    balanceLine: "Solde à la prise du véhicule",
    book: "Réserver — bientôt",
    bookNote: "La réservation en ligne arrive très prochainement.",
  },
  en: {
    crumb: "Cars",
    by: "listed by",
    reviews: "reviews",
    specs: [["Gearbox"], ["Fuel"], ["Seats"], ["Category"]],
    gearbox: "Gearbox", fuel: "Fuel", seats: "Seats", cat: "Category",
    policyTitle: "Cancellation policy",
    policy: [
      "Free cancellation for 24h after booking.",
      "Booking less than 48h before pickup: deposit non-refundable.",
      "If the agency doesn't provide the vehicle: full refund.",
    ],
    perDay: "/ day",
    depositLine: "Online deposit (per day)",
    balanceLine: "Balance due at pickup",
    book: "Book — coming soon",
    bookNote: "Online booking is coming very soon.",
  },
};

export default async function VehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const v = MOCK_VEHICLES.find((x) => x.id === id);
  if (!v) notFound();
  const t = L[await getLang()];

  const deposit = Math.ceil(v.dailyPriceMad * COMMISSION_RATE);

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <nav className="mb-4 text-sm text-brand-950/60">
          <Link href="/search" className="hover:underline">{t.crumb}</Link>
          {" / "}
          <span className="text-brand-950">{v.make} {v.model}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="relative h-72 overflow-hidden rounded-2xl sm:h-96">
              <Image
                src={v.image}
                alt={`${v.make} ${v.model}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
            </div>

            <h1 className="mt-6 text-3xl font-extrabold text-brand-950">
              {v.make} {v.model} <span className="font-medium text-brand-950/50">{v.year}</span>
            </h1>
            <p className="mt-1 text-brand-950/70">
              {v.city} · {t.by} <span className="font-semibold">{v.agency}</span>{" "}
              <VerifiedBadge /> · ★ {v.rating} ({v.reviewCount} {t.reviews})
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                [t.gearbox, v.transmission],
                [t.fuel, v.fuel],
                [t.seats, String(v.seats)],
                [t.cat, v.category],
              ].map(([k, val]) => (
                <div key={k} className="rounded-xl border border-brand-950/10 p-3 text-center">
                  <p className="text-xs uppercase tracking-wide text-brand-950/50">{k}</p>
                  <p className="font-semibold capitalize text-brand-950">{val}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl bg-brand-950/[0.04] p-6 text-sm leading-relaxed text-brand-950/80">
              <p className="mb-2 font-semibold text-brand-950">{t.policyTitle}</p>
              <ul className="list-disc space-y-1 pl-5">
                {t.policy.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-brand-950/10 p-6 shadow-sm lg:sticky lg:top-24">
            <p className="text-brand-950">
              <span className="text-3xl font-extrabold">{formatMad(v.dailyPriceMad)}</span>
              <span className="text-brand-950/60"> {t.perDay}</span>
            </p>
            <div className="mt-4 space-y-2 border-t border-brand-950/10 pt-4 text-sm text-brand-950/80">
              <div className="flex justify-between">
                <span>{t.depositLine}</span>
                <span className="font-semibold">{formatMad(deposit)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.balanceLine}</span>
                <span className="font-semibold">{formatMad(v.dailyPriceMad - deposit)}</span>
              </div>
            </div>
            <button
              className="mt-6 w-full cursor-not-allowed rounded-xl bg-accent-500/60 py-3 font-semibold text-white"
              disabled
            >
              {t.book}
            </button>
            <p className="mt-3 text-center text-xs text-brand-950/50">{t.bookNote}</p>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
