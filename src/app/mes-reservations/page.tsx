import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n/server";
import { cancelBooking } from "./actions";

const fmt = (c: number) =>
  `${(c / 100).toLocaleString("fr-MA", { maximumFractionDigits: 0 })} MAD`;

const L = {
  fr: {
    title: "Mes réservations",
    empty: "Aucune réservation pour le moment.",
    browse: "Trouver une voiture",
    kycTitle: "Vérifiez votre identité avant la prise du véhicule",
    kycBtn: "Vérifier maintenant",
    kycPending: "Vérification d'identité en cours (sous 24 h).",
    deposit: "Acompte", balance: "Solde à l'agence",
    cancel: "Annuler", pay: "Payer l'acompte",
    refundable: "Annulation gratuite encore possible",
    notRefundable: "Acompte non remboursable",
    status: {
      pending_payment: "en attente de paiement",
      confirmed: "confirmée",
      active: "en cours",
      completed: "terminée",
      cancelled_customer: "annulée",
      cancelled_agency: "annulée par l'agence",
      no_show: "non présentée",
    } as Record<string, string>,
  },
  en: {
    title: "My bookings",
    empty: "No bookings yet.",
    browse: "Find a car",
    kycTitle: "Verify your identity before pickup",
    kycBtn: "Verify now",
    kycPending: "Identity verification in progress (within 24h).",
    deposit: "Deposit", balance: "Balance at agency",
    cancel: "Cancel", pay: "Pay deposit",
    refundable: "Free cancellation still available",
    notRefundable: "Deposit non-refundable",
    status: {
      pending_payment: "awaiting payment",
      confirmed: "confirmed",
      active: "ongoing",
      completed: "completed",
      cancelled_customer: "cancelled",
      cancelled_agency: "cancelled by agency",
      no_show: "no-show",
    } as Record<string, string>,
  },
};

export async function generateMetadata() {
  return { title: L[await getLang()].title };
}

type Booking = {
  id: string; start_date: string; end_date: string; status: string;
  total_mad: number; deposit_mad: number; balance_due_mad: number;
  make: string; model: string; year: number; agency_name: string;
  city: string; refundable: boolean;
};

export default async function MyBookingsPage() {
  const t = L[await getLang()];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=%2Fmes-reservations");

  const [{ data }, { data: verif }] = await Promise.all([
    supabase.rpc("my_bookings"),
    supabase.rpc("my_verification"),
  ]);
  const bookings = (data ?? []) as Booking[];
  const kyc = (verif?.[0]?.kyc_status ?? "unverified") as string;

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-extrabold text-brand-950">{t.title}</h1>

        {bookings.length > 0 && kyc !== "verified" && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-400/40 bg-amber-50 p-4">
            <p className="flex-1 text-sm font-medium text-amber-900">
              {kyc === "pending" ? t.kycPending : t.kycTitle}
            </p>
            {kyc !== "pending" && (
              <Link
                href="/verification"
                className="rounded-xl bg-brand-950 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
              >
                {t.kycBtn}
              </Link>
            )}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-brand-950/20 p-10 text-center">
            <p className="text-brand-950/60">{t.empty}</p>
            <Link
              href="/search"
              className="mt-4 inline-block rounded-full bg-accent-500 px-6 py-2.5 font-semibold text-white hover:bg-accent-400"
            >
              {t.browse}
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {bookings.map((b) => {
              const open = b.status === "pending_payment" || b.status === "confirmed";
              return (
                <div key={b.id} className="rounded-2xl border border-brand-950/10 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link href={`/reservation/${b.id}`} className="font-bold text-brand-950 hover:underline">
                        {b.make} {b.model} {b.year}
                      </Link>
                      <p className="text-sm text-brand-950/60">
                        {b.agency_name} · {b.city} · {b.start_date} → {b.end_date}
                      </p>
                      <p className="mt-1 text-sm text-brand-950/80">
                        {t.deposit}: <span className="font-semibold">{fmt(b.deposit_mad)}</span>
                        {" · "}
                        {t.balance}: <span className="font-semibold">{fmt(b.balance_due_mad)}</span>
                      </p>
                    </div>
                    <span className="rounded-full bg-brand-950/5 px-3 py-1 text-xs font-medium text-brand-950">
                      {t.status[b.status] ?? b.status}
                    </span>
                  </div>

                  {open && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-brand-950/10 pt-3">
                      <span className={`text-xs ${b.refundable ? "text-green-700" : "text-brand-950/50"}`}>
                        {b.refundable ? t.refundable : t.notRefundable}
                      </span>
                      <div className="ml-auto flex gap-2">
                        {b.status === "pending_payment" && (
                          <Link
                            href={`/reservation/${b.id}`}
                            className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-400"
                          >
                            {t.pay}
                          </Link>
                        )}
                        <form action={cancelBooking}>
                          <input type="hidden" name="id" value={b.id} />
                          <button className="rounded-lg border border-brand-950/15 px-4 py-2 text-sm font-medium text-brand-950 hover:bg-brand-950/5">
                            {t.cancel}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
