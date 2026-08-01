import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n/server";
import { HandoverForm } from "@/components/HandoverForm";
import { handoverLabels } from "@/lib/handover/labels";

const L = {
  fr: {
    title: "Restituer le véhicule",
    sub: "Photographiez le véhicule avant de rendre les clés. Ces photos vous protègent : elles prouvent l'état dans lequel vous avez laissé la voiture.",
    why: [
      "Prenez les mêmes 5 angles qu'au départ, en pleine lumière.",
      "L'agence photographie de son côté également — les deux séries font foi.",
      "L'agence dispose de 2 heures après l'enregistrement de la restitution pour signaler un dommage. Passé ce délai, la location est définitivement close.",
    ],
    done: "Vos photos sont enregistrées. En attente de l'agence.",
    completed: "Location terminée. Merci !",
    notActive: "Cette réservation n'est pas en cours.",
    back: "← Mes réservations",
  },
  en: {
    title: "Return the vehicle",
    sub: "Photograph the car before handing back the keys. These photos protect you — they prove the state you left it in.",
    why: [
      "Take the same 5 angles as at pickup, in good light.",
      "The agency photographs it too — both sets count.",
      "The agency has 2 hours after the return is recorded to report damage. After that the rental is closed for good.",
    ],
    done: "Your photos are saved. Waiting for the agency.",
    completed: "Rental complete. Thank you!",
    notActive: "This booking is not currently active.",
    back: "← My bookings",
  },
};

export default async function ReturnPage({
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
  if (!user) redirect(`/auth?next=${encodeURIComponent(`/reservation/${id}/retour`)}`);

  const { data } = await supabase.rpc("my_bookings");
  const b = (data ?? []).find((x: { id: string }) => x.id === id) as
    | { id: string; status: string; make: string; model: string }
    | undefined;
  if (!b) notFound();

  const { data: hs } = await supabase.rpc("booking_handovers", { p_booking: id });
  const mine = (hs ?? []).some(
    (h: { kind: string; actor: string }) => h.kind === "return" && h.actor === "customer"
  );

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <Link href="/mes-reservations" className="text-sm font-semibold text-accent-600 hover:underline">
          {t.back}
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold text-ink">{t.title}</h1>
        <p className="mt-1 text-sm text-ink/65">{t.sub}</p>

        <ul className="mt-5 space-y-2 rounded-2xl bg-ink/[0.04] p-5 text-sm text-ink/70">
          {t.why.map((w) => (
            <li key={w} className="flex gap-2">
              <span className="text-accent-600">•</span>
              {w}
            </li>
          ))}
        </ul>

        <div className="mt-8">
          {b.status === "completed" ? (
            <p className="rounded-2xl bg-green-50 p-5 text-sm text-green-800 dark:bg-green-500/15 dark:text-green-300">
              {t.completed}
            </p>
          ) : b.status !== "active" ? (
            <p className="rounded-2xl border border-dashed border-ink/20 p-8 text-center text-ink/60">
              {t.notActive}
            </p>
          ) : mine ? (
            <p className="rounded-2xl bg-amber-50 p-5 text-sm text-amber-900 dark:bg-amber-400/15 dark:text-amber-100">
              {t.done}
            </p>
          ) : (
            <HandoverForm t={handoverLabels[lang]} bookingId={id} kind="return" />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
