import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AddVehicleForm, type VehicleFormLabels } from "@/components/AddVehicleForm";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n/server";
import { setVehicleStatus, updateVehiclePrice, deleteVehicle } from "./actions";

const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;

type AgencyBooking = {
  id: string; start_date: string; end_date: string; status: string;
  total_mad: number; deposit_mad: number; balance_due_mad: number;
  make: string; model: string; customer_name: string | null;
  customer_phone: string | null;
};

const L: Record<"fr" | "en", {
  title: string; noAgency: string; apply: string; pending: string;
  suspended: string; bookings: string; noBookings: string; fleet: string; empty: string; price: string;
  save: string; publish: string; unpublish: string; remove: string;
  statusDraft: string; statusLive: string; statusPaused: string;
  form: VehicleFormLabels;
}> = {
  fr: {
    title: "Tableau de bord agence",
    noAgency: "Aucune agence liée à ce compte.",
    apply: "Inscrire mon agence",
    pending: "Votre dossier est en cours de vérification. Vous pourrez ajouter vos véhicules dès validation (sous 48 h).",
    suspended: "Compte suspendu — contactez-nous.",
    bookings: "Réservations reçues", noBookings: "Aucune réservation pour le moment.",
    fleet: "Ma flotte",
    empty: "Aucun véhicule pour le moment. Ajoutez votre premier véhicule ci-dessous.",
    price: "Prix / jour (MAD)",
    save: "Enregistrer",
    publish: "Publier",
    unpublish: "Retirer",
    remove: "Supprimer",
    statusDraft: "brouillon",
    statusLive: "en ligne",
    statusPaused: "en pause",
    form: {
      heading: "Ajouter un véhicule",
      make: "Marque", model: "Modèle", year: "Année", category: "Catégorie",
      transmission: "Boîte", fuel: "Carburant", seats: "Places",
      price: "Prix par jour (MAD)",
      photos: "Photos du véhicule (5 angles obligatoires)",
      photosHint: "Prenez les photos avec votre téléphone ou choisissez-les dans votre galerie. Elles sont optimisées automatiquement (plus légères, même qualité).",
      photosMissing: "Les 5 photos sont obligatoires : avant, arrière, côté gauche, côté droit, intérieur.",
      slots: { add: "Ajouter", replace: "Remplacer", optimizing: "Optimisation…", savedPct: "réduit" },
      submit: "Ajouter le véhicule", saving: "Enregistrement…",
      err: "Erreur lors de l'enregistrement. Vérifiez les champs et réessayez.",
      cats: { citadine: "Citadine", compacte: "Compacte", suv: "SUV", luxe: "Luxe", utilitaire: "Utilitaire" },
      manual: "Manuelle", auto: "Automatique",
      diesel: "Diesel", petrol: "Essence", hybrid: "Hybride", electric: "Électrique",
    },
  },
  en: {
    title: "Agency dashboard",
    noAgency: "No agency linked to this account.",
    apply: "Register my agency",
    pending: "Your application is being verified. You'll be able to add vehicles once approved (within 48h).",
    suspended: "Account suspended — please contact us.",
    bookings: "Incoming bookings", noBookings: "No bookings yet.",
    fleet: "My fleet",
    empty: "No vehicles yet. Add your first vehicle below.",
    price: "Price / day (MAD)",
    save: "Save",
    publish: "Publish",
    unpublish: "Unpublish",
    remove: "Delete",
    statusDraft: "draft",
    statusLive: "live",
    statusPaused: "paused",
    form: {
      heading: "Add a vehicle",
      make: "Make", model: "Model", year: "Year", category: "Category",
      transmission: "Gearbox", fuel: "Fuel", seats: "Seats",
      price: "Price per day (MAD)",
      photos: "Vehicle photos (5 angles required)",
      photosHint: "Take photos with your phone or pick them from your gallery. They are optimized automatically (smaller files, same quality).",
      photosMissing: "All 5 photos are required: front, rear, left side, right side, interior.",
      slots: { add: "Add", replace: "Replace", optimizing: "Optimizing…", savedPct: "smaller" },
      submit: "Add vehicle", saving: "Saving…",
      err: "Error while saving. Check the fields and try again.",
      cats: { citadine: "City car", compacte: "Compact", suv: "SUV", luxe: "Luxury", utilitaire: "Van" },
      manual: "Manual", auto: "Automatic",
      diesel: "Diesel", petrol: "Petrol", hybrid: "Hybrid", electric: "Electric",
    },
  },
};

export async function generateMetadata() {
  return { title: L[await getLang()].title };
}

export default async function AgencyDashboard() {
  const lang = await getLang();
  const t = L[lang];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: agencies } = await supabase.rpc("my_agency");
  const agency = agencies?.[0] as
    | { id: string; legal_name: string; city: string; status: string }
    | undefined;

  if (!agency) {
    return (
      <>
        <Navbar />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 text-center">
          <p className="text-brand-950/70">{t.noAgency}</p>
          <Link
            href="/partenaires/inscription"
            className="mt-6 inline-block rounded-full bg-accent-500 px-6 py-3 font-semibold text-white hover:bg-accent-400"
          >
            {t.apply}
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const { data: agencyBookings } = await supabase.rpc("agency_bookings");

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, make, model, year, category, transmission, fuel, seats, daily_price_mad, status, vehicle_images(path, sort)")
    .eq("agency_id", agency.id)
    .order("created_at", { ascending: false });

  const statusLabel = (s: string) =>
    s === "live" ? t.statusLive : s === "paused" ? t.statusPaused : t.statusDraft;

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-extrabold text-brand-950">{t.title}</h1>
        <p className="mt-1 text-brand-950/60">
          {agency.legal_name} · {agency.city} ·{" "}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              agency.status === "verified"
                ? "bg-green-50 text-green-800"
                : agency.status === "suspended"
                  ? "bg-red-50 text-red-700"
                  : "bg-amber-50 text-amber-800"
            }`}
          >
            {agency.status}
          </span>
        </p>

        {agency.status !== "verified" ? (
          <p className="mt-8 rounded-2xl bg-amber-50 p-6 text-amber-800">
            {agency.status === "suspended" ? t.suspended : t.pending}
          </p>
        ) : (
          <>
            <h2 className="mt-10 text-xl font-bold text-brand-950">{t.bookings}</h2>
            {((agencyBookings ?? []) as AgencyBooking[]).length === 0 ? (
              <p className="mt-3 rounded-2xl border border-dashed border-brand-950/20 p-6 text-center text-sm text-brand-950/60">
                {t.noBookings}
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {((agencyBookings ?? []) as AgencyBooking[]).map((b) => (
                  <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-950/10 bg-white p-4 text-sm">
                    <div>
                      <p className="font-semibold text-brand-950">{b.make} {b.model}</p>
                      <p className="text-brand-950/60">
                        {b.start_date} → {b.end_date} · {b.customer_name ?? "—"} · {b.customer_phone ?? "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-brand-950">
                        {(b.balance_due_mad / 100).toLocaleString("fr-MA")} MAD
                      </p>
                      <p className="text-xs text-brand-950/50">{b.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h2 className="mt-10 text-xl font-bold text-brand-950">{t.fleet}</h2>
            {(vehicles ?? []).length === 0 ? (
              <p className="mt-3 rounded-2xl border border-dashed border-brand-950/20 p-8 text-center text-brand-950/60">
                {t.empty}
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {(vehicles ?? []).map((v) => {
                  const img = (v.vehicle_images ?? [])[0];
                  const url = img
                    ? `${SUPA}/storage/v1/object/public/vehicle-photos/${img.path}`
                    : null;
                  return (
                    <div
                      key={v.id}
                      className="flex flex-wrap items-center gap-4 rounded-2xl border border-brand-950/10 bg-white p-4"
                    >
                      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-brand-100">
                        {url && (
                          <Image src={url} alt="" fill sizes="96px" className="object-cover" unoptimized />
                        )}
                      </div>
                      <div className="min-w-40 flex-1">
                        <p className="font-semibold text-brand-950">
                          {v.make} {v.model}{" "}
                          <span className="font-normal text-brand-950/50">{v.year}</span>
                        </p>
                        <p className="text-xs text-brand-950/60">
                          {v.category} · {v.transmission} · {v.fuel} · {v.seats}
                          {" · "}
                          <span className="font-medium">{statusLabel(v.status)}</span>
                        </p>
                      </div>
                      <form action={updateVehiclePrice} className="flex items-end gap-2">
                        <input type="hidden" name="id" value={v.id} />
                        <label className="text-xs text-brand-950/60">
                          {t.price}
                          <input
                            name="price_mad"
                            type="number"
                            min={1}
                            step={10}
                            defaultValue={Math.round(v.daily_price_mad / 100)}
                            className="mt-1 w-24 rounded-lg border border-brand-950/15 px-2 py-1.5 text-sm text-brand-950"
                          />
                        </label>
                        <button className="rounded-lg border border-brand-950/15 px-3 py-1.5 text-sm font-medium text-brand-950 hover:bg-brand-950/5">
                          {t.save}
                        </button>
                      </form>
                      <form action={setVehicleStatus}>
                        <input type="hidden" name="id" value={v.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={v.status === "live" ? "paused" : "live"}
                        />
                        <button
                          className={`rounded-lg px-3 py-1.5 text-sm font-semibold text-white ${v.status === "live" ? "bg-brand-500 hover:bg-brand-800" : "bg-green-600 hover:bg-green-500"}`}
                        >
                          {v.status === "live" ? t.unpublish : t.publish}
                        </button>
                      </form>
                      <form action={deleteVehicle}>
                        <input type="hidden" name="id" value={v.id} />
                        <button className="rounded-lg px-2 py-1.5 text-sm text-red-600 hover:underline">
                          {t.remove}
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-10 rounded-2xl border border-brand-950/10 bg-white p-6">
              <AddVehicleForm L={t.form} lang={lang} agencyId={agency.id} city={agency.city} />
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
