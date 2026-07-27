import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { VerifiedBadge } from "@/components/badges";
import { VehicleGallery } from "@/components/VehicleGallery";
import { VehicleCardCompact } from "@/components/VehicleCard";
import { COMMISSION_RATE, MOCK_VEHICLES } from "@/lib/mock/vehicles";
import { getLang } from "@/lib/i18n/server";
import { getLiveVehicles } from "@/lib/vehicles/live";
import { createClient } from "@/lib/supabase/server";
import { BookingWidget, type BookingLabels } from "@/components/BookingWidget";

const L = {
  fr: {
    crumb: "Voitures",
    by: "Proposé par",
    reviews: "avis",
    newListing: "Nouvelle annonce",
    specs: "Caractéristiques",
    gearbox: "Boîte", fuel: "Carburant", seats: "Places", cat: "Catégorie",
    year: "Année", city: "Ville",
    includedTitle: "Inclus dans le prix",
    included: [
      ["Assurance de l'agence", "Responsabilité civile et tous risques selon le contrat de l'agence."],
      ["Prix ferme", "Aucun frais caché au comptoir : le prix affiché est le prix payé."],
      ["Kilométrage convenu", "Les conditions exactes figurent sur le contrat signé au départ."],
      ["Assistance CarKari", "Un problème à la prise du véhicule ? Écrivez-nous sur WhatsApp, 7j/7."],
    ] as [string, string][],
    policyTitle: "Politique d'annulation",
    policy: [
      "Annulation gratuite pendant 24 h après la réservation.",
      "Départ à moins de 48 h : acompte non remboursable.",
      "Véhicule non fourni par l'agence : remboursement intégral.",
    ],
    rulesTitle: "Règles de location",
    rules: [
      ["Permis valide", "Détenu depuis 1 an minimum, âge selon l'agence (souvent 21 ans)."],
      ["Caution à la prise", "Empreinte bancaire ou espèces, montant indiqué par l'agence."],
      ["Carburant", "Rendez le véhicule au même niveau de carburant qu'au départ."],
      ["Non-fumeur", "Véhicule non-fumeur ; frais de nettoyage en cas de non-respect."],
    ] as [string, string][],
    hostTitle: "L'agence",
    hostVerified: "Documents vérifiés par CarKari",
    similar: "Véhicules similaires",
    gallery: { viewAll: "Voir les {n} photos", close: "Fermer", prev: "Précédent", next: "Suivant", of: "sur" },
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
    by: "Listed by",
    reviews: "reviews",
    newListing: "New listing",
    specs: "Specifications",
    gearbox: "Gearbox", fuel: "Fuel", seats: "Seats", cat: "Category",
    year: "Year", city: "City",
    includedTitle: "Included in the price",
    included: [
      ["Agency insurance", "Liability and comprehensive cover per the agency's contract."],
      ["Firm price", "No hidden counter fees: the displayed price is what you pay."],
      ["Agreed mileage", "Exact conditions are on the contract signed at pickup."],
      ["CarKari support", "Trouble at pickup? Message us on WhatsApp, 7 days a week."],
    ] as [string, string][],
    policyTitle: "Cancellation policy",
    policy: [
      "Free cancellation for 24h after booking.",
      "Pickup within 48h: deposit non-refundable.",
      "Vehicle not provided by the agency: full refund.",
    ],
    rulesTitle: "Rental rules",
    rules: [
      ["Valid licence", "Held for at least 1 year, minimum age set by the agency (often 21)."],
      ["Deposit at pickup", "Card hold or cash, amount stated by the agency."],
      ["Fuel", "Return the vehicle with the same fuel level as at pickup."],
      ["Non-smoking", "Non-smoking vehicle; cleaning fees apply otherwise."],
    ] as [string, string][],
    hostTitle: "The agency",
    hostVerified: "Documents verified by CarKari",
    similar: "Similar vehicles",
    gallery: { viewAll: "View all {n} photos", close: "Close", prev: "Previous", next: "Next", of: "of" },
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const photos = v.images?.length ? v.images : [v.image];
  const similar = [...live, ...MOCK_VEHICLES]
    .filter((x) => x.id !== v.id && (x.category === v.category || x.city === v.city))
    .slice(0, 3);

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <nav className="mb-4 text-sm text-brand-950/50">
          <Link href="/search" className="hover:underline">{t.crumb}</Link>
          {" / "}
          <span className="text-brand-950">{v.make} {v.model}</span>
        </nav>

        <VehicleGallery images={photos} alt={`${v.make} ${v.model}`} labels={t.gallery} />

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            <h1 className="text-3xl font-extrabold text-brand-950 sm:text-4xl">
              {v.make} {v.model}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-brand-950/70">
              <span className="font-medium text-brand-950">{v.year}</span>
              <span className="text-brand-950/30">·</span>
              {v.reviewCount > 0 ? (
                <span className="font-medium text-brand-950">
                  ★ {v.rating}{" "}
                  <span className="font-normal text-brand-950/60">
                    ({v.reviewCount} {t.reviews})
                  </span>
                </span>
              ) : (
                <span className="rounded-full bg-accent-500/10 px-2 py-0.5 text-xs font-semibold text-accent-600">
                  {t.newListing}
                </span>
              )}
              <span className="text-brand-950/30">·</span>
              <span>{v.city}</span>
            </p>

            {/* agency card */}
            <div className="mt-6 flex items-center gap-4 rounded-2xl border border-brand-950/10 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-950 text-lg font-bold text-white">
                {v.agency.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-brand-950/50">
                  {t.by}
                </p>
                <p className="flex items-center gap-2 font-semibold text-brand-950">
                  <span className="truncate">{v.agency}</span> <VerifiedBadge small />
                </p>
                <p className="text-xs text-brand-950/55">{t.hostVerified}</p>
              </div>
            </div>

            {/* specs */}
            <h2 className="mt-10 text-lg font-bold text-brand-950">{t.specs}</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                [t.gearbox, v.transmission],
                [t.fuel, v.fuel],
                [t.seats, `${v.seats}`],
                [t.cat, v.category],
                [t.year, `${v.year}`],
                [t.city, v.city],
              ].map(([k, val]) => (
                <div key={k} className="rounded-xl bg-brand-950/[0.04] p-3">
                  <p className="text-[11px] uppercase tracking-wide text-brand-950/50">{k}</p>
                  <p className="mt-0.5 font-semibold capitalize text-brand-950">{val}</p>
                </div>
              ))}
            </div>

            {/* included */}
            <h2 className="mt-10 text-lg font-bold text-brand-950">{t.includedTitle}</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {t.included.map(([h, d]) => (
                <div key={h} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                    ✓
                  </span>
                  <div>
                    <p className="font-semibold text-brand-950">{h}</p>
                    <p className="text-sm text-brand-950/65">{d}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* cancellation */}
            <div className="mt-10 rounded-2xl border border-accent-500/25 bg-accent-500/[0.06] p-6">
              <p className="font-bold text-brand-950">{t.policyTitle}</p>
              <ul className="mt-2 space-y-1.5 text-sm text-brand-950/75">
                {t.policy.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="text-accent-600">•</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* rules */}
            <h2 className="mt-10 text-lg font-bold text-brand-950">{t.rulesTitle}</h2>
            <div className="mt-3 divide-y divide-brand-950/10 rounded-2xl border border-brand-950/10">
              {t.rules.map(([h, d]) => (
                <div key={h} className="p-4">
                  <p className="font-semibold text-brand-950">{h}</p>
                  <p className="text-sm text-brand-950/65">{d}</p>
                </div>
              ))}
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

        {similar.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-4 text-xl font-bold text-brand-950">{t.similar}</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {similar.map((s) => (
                <VehicleCardCompact key={s.id} v={s} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
