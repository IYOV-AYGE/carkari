import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n/server";
import { PayDepositButton } from "@/components/PayDepositButton";

const fmt = (c: number) =>
  `${(c / 100).toLocaleString("fr-MA", { maximumFractionDigits: 0 })} MAD`;

const L = {
  fr: {
    title: "Votre réservation",
    pending: "Réservation créée — il reste à payer l'acompte pour la confirmer.",
    confirmed: "Réservation confirmée ! L'agence vous attend aux dates prévues.",
    cancelled: "Cette réservation a été annulée.",
    vehicle: "Véhicule", dates: "Dates", total: "Total location",
    deposit: "Acompte en ligne", balance: "Solde à régler à l'agence",
    pay: "Payer l'acompte", payNote: "Paiement sécurisé. Le solde se règle à la prise du véhicule.",
    mine: "Voir mes réservations",
    kycTitle: "Vérification d'identité requise avant la prise du véhicule",
    kycBody: "Les agences doivent vérifier permis et identité. Faites-le maintenant en 3 minutes — sinon le véhicule ne pourra pas vous être remis et l'acompte vous sera remboursé.",
    kycBtn: "Vérifier mon identité",
    kycPending: "Vérification en cours — nous validons vos documents sous 24 h.",
    policyTitle: "Politique d'annulation",
    policy: [
      "Annulation gratuite pendant 24 h après la réservation.",
      "Départ à moins de 48 h : acompte non remboursable.",
      "Véhicule non fourni par l'agence : remboursement intégral.",
    ],
  },
  en: {
    title: "Your booking",
    pending: "Booking created — pay the deposit to confirm it.",
    confirmed: "Booking confirmed! The agency expects you on the agreed dates.",
    cancelled: "This booking was cancelled.",
    vehicle: "Vehicle", dates: "Dates", total: "Rental total",
    deposit: "Online deposit", balance: "Balance due at the agency",
    pay: "Pay the deposit", payNote: "Secure payment. The balance is paid at pickup.",
    mine: "See my bookings",
    kycTitle: "Identity verification required before pickup",
    kycBody: "Agencies must check licence and ID. Do it now in 3 minutes — otherwise the vehicle cannot be released and your deposit will be refunded.",
    kycBtn: "Verify my identity",
    kycPending: "Verification in progress — we review your documents within 24h.",
    policyTitle: "Cancellation policy",
    policy: [
      "Free cancellation for 24h after booking.",
      "Pickup within 48h: deposit non-refundable.",
      "Vehicle not provided by the agency: full refund.",
    ],
  },
};

export async function generateMetadata() {
  return { title: L[await getLang()].title };
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = L[await getLang()];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth?next=${encodeURIComponent(`/reservation/${id}`)}`);

  const { data: verif } = await supabase.rpc("my_verification");
  const kyc = (verif?.[0]?.kyc_status ?? "unverified") as string;

  const { data } = await supabase.rpc("my_bookings");
  const b = (data ?? []).find(
    (x: { id: string }) => x.id === id
  ) as
    | {
        id: string; start_date: string; end_date: string; status: string;
        total_mad: number; deposit_mad: number; balance_due_mad: number;
        make: string; model: string; year: number; agency_name: string; city: string;
      }
    | undefined;
  if (!b) notFound();

  const banner =
    b.status === "pending_payment"
      ? { text: t.pending, cls: "bg-amber-50 dark:bg-amber-400/15 text-amber-800 dark:text-amber-200" }
      : b.status.startsWith("cancelled")
        ? { text: t.cancelled, cls: "bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300" }
        : { text: t.confirmed, cls: "bg-green-50 dark:bg-green-500/15 text-green-800 dark:text-green-300" };

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <h1 className="text-2xl font-extrabold text-ink">{t.title}</h1>
        <p className={`mt-4 rounded-xl p-4 text-sm ${banner.cls}`}>{banner.text}</p>

        {!b.status.startsWith("cancelled") && kyc !== "verified" && (
          <div className="mt-4 rounded-2xl border border-amber-400/40 bg-amber-50 dark:bg-amber-400/15 p-5">
            <p className="font-semibold text-amber-900 dark:text-amber-100">{t.kycTitle}</p>
            <p className="mt-1 text-sm text-amber-900 dark:text-amber-100/80">
              {kyc === "pending" ? t.kycPending : t.kycBody}
            </p>
            {kyc !== "pending" && (
              <Link
                href="/verification"
                className="mt-3 inline-block rounded-xl bg-band px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
              >
                {t.kycBtn}
              </Link>
            )}
          </div>
        )}

        <div className="mt-6 space-y-3 rounded-2xl border border-ink/10 bg-card p-6 text-sm">
          <Row k={t.vehicle} v={`${b.make} ${b.model} ${b.year} — ${b.agency_name}, ${b.city}`} />
          <Row k={t.dates} v={`${b.start_date} → ${b.end_date}`} />
          <Row k={t.total} v={fmt(b.total_mad)} />
          <div className="border-t border-ink/10 pt-3">
            <Row k={t.deposit} v={fmt(b.deposit_mad)} strong />
            <Row k={t.balance} v={fmt(b.balance_due_mad)} />
          </div>
        </div>

        {b.status === "pending_payment" && (
          <div className="mt-6">
            <PayDepositButton bookingId={b.id} label={t.pay} />
            <p className="mt-2 text-center text-xs text-ink/50">{t.payNote}</p>
          </div>
        )}

        <div className="mt-8 rounded-2xl bg-ink/[0.04] p-5 text-sm text-ink/75">
          <p className="font-semibold text-ink">{t.policyTitle}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {t.policy.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>

        <p className="mt-6 text-center">
          <Link href="/mes-reservations" className="font-semibold text-accent-600 hover:underline">
            {t.mine} →
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-ink/60">{k}</span>
      <span className={strong ? "font-bold text-accent-600" : "font-medium text-ink"}>
        {v}
      </span>
    </div>
  );
}
