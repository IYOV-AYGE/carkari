import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { VerificationForm, type VerifLabels } from "@/components/VerificationForm";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n/server";

// Your business WhatsApp (digits only, country code first).
const WHATSAPP = "212600000000";

const L: Record<"fr" | "en", {
  title: string; sub: string;
  why: string[];
  pending: string; verified: string; rejected: string;
  resubmit: string; backToBookings: string;
  form: VerifLabels;
}> = {
  fr: {
    title: "Vérification d'identité",
    sub: "Une seule fois, environ 3 minutes. Obligatoire avant de récupérer un véhicule.",
    why: [
      "Les agences sont légalement tenues de vérifier permis et identité — nous le faisons en amont pour éviter les mauvaises surprises au comptoir.",
      "Cela protège votre compte contre l'usurpation d'identité et empêche les réservations frauduleuses avec des cartes volées.",
      "Vos documents restent privés : l'agence ne voit jamais vos pièces, seulement la mention « vérifié ».",
    ],
    pending: "Documents reçus — vérification en cours (sous 24 h). Vous pouvez déjà réserver ; la validation doit être faite avant la prise du véhicule.",
    verified: "Identité vérifiée. Vous pouvez récupérer vos véhicules sans autre formalité côté CarKari.",
    rejected: "Vérification refusée :",
    resubmit: "Renvoyer mes documents",
    backToBookings: "Voir mes réservations",
    form: {
      step1: "1. Identité",
      step2: "2. Permis de conduire",
      step3: "3. Documents",
      firstName: "Prénom (comme sur la pièce d'identité)",
      lastName: "Nom",
      birthDate: "Date de naissance",
      nationality: "Nationalité",
      phone: "Téléphone (WhatsApp)",
      idNumber: "Numéro de CIN ou passeport",
      licenceNumber: "Numéro de permis",
      licenceCountry: "Pays de délivrance",
      licenceIssued: "Date de délivrance",
      docsHint: "Photographiez vos documents avec votre téléphone. Cadrez bien, sans reflet. Les images sont compressées automatiquement.",
      privacy: "Vos documents sont stockés de façon privée et chiffrée, visibles uniquement par l'équipe de vérification CarKari. Ils sont supprimés 90 jours après votre dernière location. Ils ne sont jamais transmis aux agences ni à des tiers.",
      slots: { add: "Ajouter", replace: "Remplacer", optimizing: "Optimisation…", savedPct: "réduit" },
      docLabels: {
        licenceFront: "Permis — recto",
        licenceBack: "Permis — verso",
        idFront: "CIN/Passeport — recto",
        idBack: "CIN/Passeport — verso",
        selfie: "Selfie",
      },
      docHints: {
        licenceFront: "Photo nette du permis",
        licenceBack: "Verso du permis",
        idFront: "Recto de la pièce",
        idBack: "Verso (ou page photo du passeport)",
        selfie: "Votre visage, bien éclairé",
      },
      submit: "Envoyer pour vérification",
      sending: "Envoi en cours…",
      errDocs: "Les 5 documents sont obligatoires.",
      errAge: "Vous devez avoir au moins 21 ans pour louer.",
      errLicence: "Le permis doit être détenu depuis au moins 1 an.",
      errGeneric: "Une erreur est survenue. Vérifiez les fichiers et réessayez.",
      whatsappTitle: "Confirmez votre numéro (gratuit)",
      whatsappBody: "Envoyez-nous ce code sur WhatsApp pour confirmer votre numéro. Mon code CarKari :",
      whatsappBtn: "Envoyer le code sur WhatsApp",
      yourCode: "Votre code :",
    },
  },
  en: {
    title: "Identity verification",
    sub: "One time only, about 3 minutes. Required before picking up a vehicle.",
    why: [
      "Agencies are legally required to check licence and ID — we do it in advance so there are no surprises at the counter.",
      "It protects your account from identity theft and blocks fraudulent bookings made with stolen cards.",
      "Your documents stay private: the agency never sees them, only the \"verified\" status.",
    ],
    pending: "Documents received — verification in progress (within 24h). You can already book; approval must happen before pickup.",
    verified: "Identity verified. You can collect your vehicles with no further CarKari formalities.",
    rejected: "Verification rejected:",
    resubmit: "Resubmit my documents",
    backToBookings: "See my bookings",
    form: {
      step1: "1. Identity",
      step2: "2. Driving licence",
      step3: "3. Documents",
      firstName: "First name (as on your ID)",
      lastName: "Last name",
      birthDate: "Date of birth",
      nationality: "Nationality",
      phone: "Phone (WhatsApp)",
      idNumber: "ID card or passport number",
      licenceNumber: "Licence number",
      licenceCountry: "Country of issue",
      licenceIssued: "Date of issue",
      docsHint: "Photograph your documents with your phone. Frame them fully, avoid glare. Images are compressed automatically.",
      privacy: "Your documents are stored privately and encrypted, visible only to the CarKari verification team. They are deleted 90 days after your last rental. They are never shared with agencies or third parties.",
      slots: { add: "Add", replace: "Replace", optimizing: "Optimizing…", savedPct: "smaller" },
      docLabels: {
        licenceFront: "Licence — front",
        licenceBack: "Licence — back",
        idFront: "ID/Passport — front",
        idBack: "ID/Passport — back",
        selfie: "Selfie",
      },
      docHints: {
        licenceFront: "Sharp photo of the licence",
        licenceBack: "Back of the licence",
        idFront: "Front of the document",
        idBack: "Back (or passport photo page)",
        selfie: "Your face, well lit",
      },
      submit: "Submit for verification",
      sending: "Uploading…",
      errDocs: "All 5 documents are required.",
      errAge: "You must be at least 21 to rent.",
      errLicence: "The licence must have been held for at least 1 year.",
      errGeneric: "Something went wrong. Check the files and try again.",
      whatsappTitle: "Confirm your number (free)",
      whatsappBody: "Send us this code on WhatsApp to confirm your number. My CarKari code:",
      whatsappBtn: "Send code on WhatsApp",
      yourCode: "Your code:",
    },
  },
};

export async function generateMetadata() {
  const t = L[await getLang()];
  return { title: t.title, description: t.sub };
}

export default async function VerificationPage() {
  const t = L[await getLang()];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const [{ data: verif }, { data: code }, { data: profile }] = await Promise.all([
    supabase.rpc("my_verification"),
    supabase.rpc("my_phone_code"),
    supabase.from("profiles").select("phone").eq("id", user.id).single(),
  ]);

  const state = (verif?.[0] ?? null) as
    | { kyc_status: string; phone_verified: boolean; reject_reason: string | null }
    | null;
  const status = state?.kyc_status ?? "unverified";

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-brand-950/[0.03] px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-brand-950/10 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-extrabold text-brand-950">{t.title}</h1>
            <p className="mt-1 text-sm text-brand-950/60">{t.sub}</p>

            {status === "pending" && (
              <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                {t.pending}
              </p>
            )}
            {status === "verified" && (
              <p className="mt-6 rounded-xl bg-green-50 p-4 text-sm text-green-800">
                {t.verified}
              </p>
            )}
            {status === "rejected" && (
              <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                {t.rejected} {state?.reject_reason}
              </p>
            )}

            {(status === "unverified" || status === "rejected") && (
              <div className="mt-8">
                <VerificationForm
                  t={t.form}
                  userId={user.id}
                  phoneCode={String(code ?? "")}
                  whatsappNumber={WHATSAPP}
                  defaults={{ phone: profile?.phone ?? null }}
                />
              </div>
            )}

            {(status === "pending" || status === "verified") && (
              <p className="mt-6">
                <Link
                  href="/mes-reservations"
                  className="font-semibold text-accent-600 hover:underline"
                >
                  {t.backToBookings} →
                </Link>
              </p>
            )}
          </div>

          <ul className="mx-auto mt-8 max-w-xl space-y-3 text-sm text-brand-950/70">
            {t.why.map((w) => (
              <li key={w} className="flex gap-3">
                <span className="mt-0.5 text-accent-600">•</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
    </>
  );
}
