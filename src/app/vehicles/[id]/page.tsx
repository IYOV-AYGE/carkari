import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { VerifiedBadge } from "@/components/badges";
import {
  COMMISSION_RATE,
  MOCK_VEHICLES,
} from "@/lib/mock/vehicles";
import { getLang } from "@/lib/i18n/server";
import { getLiveVehicles } from "@/lib/vehicles/live";
import { createClient } from "@/lib/supabase/server";
import { BookingWidget, type BookingLabels } from "@/components/BookingWidget";

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
    booking: {
      perDay: "/ jour", from: "Départ", to: "Retour",
      days: "{n} jour(s)", total: "Total", deposit: "Acompte en ligne",
      balance: "Solde à l'agence",
      policyTitle: "Annulation", policyLines: [],
      accept: "J'accepte les conditions et la politique d'annulation ci-dessus.",
      book: "Réserver", booking: "Réservation…",
      loginFirst: "Se connecter pour réserver",
      unavailable: "Ce véhicule n'est pas disponible sur ces dates.",
      pickDates: "Choisissez vos dates pour voir le prix total.",
      errGeneric: "La réservation a échoué. Réessayez ou contactez-nous.",
      mockNote: "Véhicule de démonstration — réservation désactivée.",
      freeCancel: "Annulation gratuite pendant 24 h après la réservation.",
      noRefund: "Départ dans moins de 48 h : l'acompte n'est pas remboursable.",
    } as BookingLabels,
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
    booking: {
      perDay: "/ day", from: "Pick-up", to: "Return",
      days: "{n} day(s)", total: "Total", deposit: "Online deposit",
      balance: "Balance at agency",
      policyTitle: "Cancellation", policyLines: [],
      accept: "I accept the terms and the cancellation policy above.",
      book: "Book now", booking: "Booking…",
      loginFirst: "Sign in to book",
      unavailable: "This vehicle is not available for these dates.",
      pickDates: "Pick your dates to see the total price.",
      errGeneric: "Booking failed. Please try again or contact us.",
      mockNote: "Demo vehicle — booking disabled.",
      freeCancel: "Free cancellation for 24h after booking.",
      noRefund: "Pickup within 48h: the deposit is non-refundable.",
    } as BookingLabels,
  },
};

export default async function VehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const live = await getLiveVehicles();
  const liveHit = live.find((x) => x.id === id);
  const v = liveHit ?? MOCK_VEHICLES.find((x) => x.id === id);
  if (!v) notFound();
  const isMock = !liveHit;
  const t = L[await getLang()];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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

          <BookingWidget
            t={t.booking}
            vehicleId={v.id}
            dailyPriceMad={v.dailyPriceMad}
            commissionRate={COMMISSION_RATE}
            isMock={isMock}
            signedIn={Boolean(user)}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
