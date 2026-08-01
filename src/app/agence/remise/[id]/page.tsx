import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n/server";
import { PickupFlow } from "@/components/PickupFlow";
import { HandoverForm } from "@/components/HandoverForm";
import { pickupLabels, handoverLabels } from "@/lib/handover/labels";

const L = {
  fr: {
    title: "Remise du véhicule",
    returnTitle: "Restitution du véhicule",
    back: "← Mes réservations",
    notFound: "Réservation introuvable.",
    customer: "Client",
    dates: "Dates",
    vehicle: "Véhicule",
    verified: "Vérifié par CarKari",
    notVerified: "Non vérifié",
    doneP: "Clés remises. Le véhicule est en location.",
    doneR: "Restitution enregistrée.",
    waiting: "En attente de la restitution par le client.",
    claim: "Signaler des dommages",
    claimWindow:
      "Vous avez 2 heures après l'enregistrement de la restitution pour signaler un dommage. Passé ce délai, la location est close.",
  },
  en: {
    title: "Vehicle handover",
    returnTitle: "Vehicle return",
    back: "← My bookings",
    notFound: "Booking not found.",
    customer: "Customer",
    dates: "Dates",
    vehicle: "Vehicle",
    verified: "Verified by CarKari",
    notVerified: "Not verified",
    doneP: "Keys released. The vehicle is out on rental.",
    doneR: "Return recorded.",
    waiting: "Waiting for the customer to record the return.",
    claim: "Report damage",
    claimWindow:
      "You have 2 hours after the return is recorded to report damage. After that the rental is closed.",
  },
};

type Brief = {
  booking_id: string; customer_name: string | null; customer_phone: string | null;
  kyc_verified: boolean; birth_date: string | null;
  start_date: string; end_date: string; status: string;
  make: string; model: string; year: number;
};

export default async function HandoverPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lang = await getLang();
  const t = L[lang];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth?next=${encodeURIComponent(`/agence/remise/${id}`)}`);

  const { data } = await supabase.rpc("pickup_brief", { p_booking: id });
  const b = (data?.[0] ?? null) as Brief | null;
  if (!b) notFound();


  const isPickup = b.status === "confirmed";
  const isReturn = b.status === "active";

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <Link href="/agence" className="text-sm font-semibold text-accent-600 hover:underline">
          {t.back}
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold text-ink">
          {isReturn ? t.returnTitle : t.title}
        </h1>

        <div className="mt-4 space-y-1 rounded-2xl border border-ink/10 bg-card p-5 text-sm">
          <p className="text-ink">
            <span className="text-ink/60">{t.vehicle}: </span>
            {b.make} {b.model} {b.year}
          </p>
          <p className="text-ink">
            <span className="text-ink/60">{t.customer}: </span>
            {b.customer_name ?? "—"} · {b.customer_phone ?? "—"}
          </p>
          <p className="text-ink">
            <span className="text-ink/60">{t.dates}: </span>
            {b.start_date} → {b.end_date}
          </p>
          <p>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                b.kyc_verified
                  ? "bg-green-50 text-green-800 dark:bg-green-500/15 dark:text-green-300"
                  : "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300"
              }`}
            >
              {b.kyc_verified ? t.verified : t.notVerified}
            </span>
          </p>
        </div>

        <div className="mt-8">
          {isPickup && (
            <PickupFlow
              t={pickupLabels[lang]}
              bookingId={id}
              kycVerified={b.kyc_verified}
            />
          )}

          {isReturn && (
            <>
              <p className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-400/15 dark:text-amber-100">
                {t.claimWindow}
              </p>
              <HandoverForm t={handoverLabels[lang]} bookingId={id} kind="return" />
            </>
          )}

          {!isPickup && !isReturn && (
            <p className="rounded-2xl border border-dashed border-ink/20 p-8 text-center text-ink/60">
              {b.status === "completed" ? t.doneR : t.waiting}
            </p>
          )}
        </div>
      </main>
    </>
  );
}
