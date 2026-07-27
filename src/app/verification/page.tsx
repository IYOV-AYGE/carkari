import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { VerificationForm, type VerifLabels } from "@/components/VerificationForm";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n/server";

const L: Record<"fr" | "en", {
  title: string; sub: string;
  why: string[];
  pending: string; verified: string; rejected: string;
  emailWarn: string;
  backToBookings: string;
  form: VerifLabels;
}> = {
  fr: {
    title: "Vérification d'identité",
    sub: "Une seule fois, environ 3 minutes. Obligatoire avant de récupérer un véhicule.",
    why: [
      "Les agences sont légalement tenues de vérifier permis et identité — nous le faisons en amont pour éviter les mauvaises surprises au comptoir.",
      "Les photos sont prises en direct par l'appareil photo : cela empêche l'utilisation de documents volés ou de captures d'écran.",
      "Vos documents restent privés : l'agence ne voit jamais vos pièces, seulement la mention « vérifié ».",
    ],
    pending: "Documents reçus — vérification en cours (sous 24 h). Vous pouvez déjà réserver ; la validation doit être faite avant la prise du véhicule.",
    verified: "Identité vérifiée. Vous pouvez récupérer vos véhicules sans autre formalité côté CarKari.",
    rejected: "Vérification refusée :",
    emailWarn: "Confirmez d'abord votre adresse email : cliquez sur le lien envoyé lors de votre inscription.",
    backToBookings: "Voir mes réservations",
    form: {
      secWho: "Vous êtes",
      secIdentity: "1. Identité",
      secAddress: "2. Adresse",
      secLicence: "3. Permis de conduire",
      secDocs: "4. Photos des documents",
      resident: "Résident au Maroc",
      residentHint: "Vous présenterez votre CIN (recto et verso) et votre permis marocain.",
      visitor: "Visiteur / touriste",
      visitorHint: "Vous présenterez votre passeport et votre permis étranger.",
      firstName: "Prénom (comme sur la pièce d'identité)",
      lastName: "Nom",
      birthDate: "Date de naissance",
      nationality: "Nationalité",
      phone: "Téléphone",
      phoneHint: "Avec l'indicatif pays. L'agence l'utilise pour vous contacter le jour du départ.",
      addressLine: "Adresse (rue, numéro, complément)",
      addressCity: "Ville",
      addressPostcode: "Code postal",
      addressCountry: "Pays",
      cinNumber: "Numéro de CIN",
      passportNumber: "Numéro de passeport",
      licenceNumber: "Numéro de permis",
      licenceCountry: "Pays de délivrance du permis",
      licenceIssued: "Date de délivrance",
      docsHint: "Placez le document bien à plat, dans le cadre, sans reflet. Les photos sont compressées automatiquement.",
      cameraOnly: "Photos prises en direct uniquement — l'import depuis la galerie n'est pas autorisé.",
      privacy: "Vos documents sont stockés de façon privée et chiffrée, visibles uniquement par l'équipe de vérification CarKari. Ils sont supprimés 90 jours après votre dernière location, et ne sont jamais transmis aux agences ni à des tiers.",
      idpNote: "Permis international : recommandé si votre permis n'est pas rédigé en arabe, français ou anglais. Ajoutez-le si vous en avez un — cela évite tout refus au comptoir.",
      cam: {
        take: "Prendre la photo", retake: "Reprendre", capture: "Capturer",
        cancel: "Annuler", optional: "facultatif",
        denied: "Accès à l'appareil photo refusé. Autorisez la caméra dans votre navigateur, puis réessayez.",
        unsupported: "Votre navigateur ne permet pas la prise de photo. Utilisez Chrome ou Safari sur votre téléphone.",
        guide: "Cadrez le document dans le rectangle, bien lisible",
        guideSelfie: "Regardez l'objectif, visage bien éclairé",
      },
      docLabels: {
        licenceFront: "Permis — recto", licenceBack: "Permis — verso",
        cinFront: "CIN — recto", cinBack: "CIN — verso",
        passport: "Passeport — page photo", idp: "Permis international",
        selfie: "Selfie",
      },
      docHints: {
        licenceFront: "Face avant du permis", licenceBack: "Face arrière",
        cinFront: "Recto de la carte", cinBack: "Verso de la carte",
        passport: "Page avec votre photo", idp: "Si vous en avez un",
        selfie: "Votre visage",
      },
      submit: "Envoyer pour vérification",
      sending: "Envoi en cours…",
      errDocs: "Toutes les photos obligatoires doivent être prises.",
      errAge: "Vous devez avoir au moins 21 ans pour louer.",
      errLicence: "Le permis doit être détenu depuis au moins 1 an.",
      errGeneric: "Une erreur est survenue. Réessayez ou contactez-nous.",
    },
  },
  en: {
    title: "Identity verification",
    sub: "One time only, about 3 minutes. Required before picking up a vehicle.",
    why: [
      "Agencies are legally required to check licence and ID — we do it in advance so there are no surprises at the counter.",
      "Photos are taken live with your camera: this prevents the use of stolen documents or screenshots.",
      "Your documents stay private: the agency never sees them, only the \"verified\" status.",
    ],
    pending: "Documents received — verification in progress (within 24h). You can already book; approval must happen before pickup.",
    verified: "Identity verified. You can collect your vehicles with no further CarKari formalities.",
    rejected: "Verification rejected:",
    emailWarn: "Please confirm your email address first — click the link we sent when you signed up.",
    backToBookings: "See my bookings",
    form: {
      secWho: "You are",
      secIdentity: "1. Identity",
      secAddress: "2. Address",
      secLicence: "3. Driving licence",
      secDocs: "4. Document photos",
      resident: "Resident in Morocco",
      residentHint: "You'll show your national ID card (both sides) and Moroccan licence.",
      visitor: "Visitor / tourist",
      visitorHint: "You'll show your passport and your foreign driving licence.",
      firstName: "First name (as on your ID)",
      lastName: "Last name",
      birthDate: "Date of birth",
      nationality: "Nationality",
      phone: "Phone",
      phoneHint: "Include the country code. The agency uses it to reach you on pickup day.",
      addressLine: "Address (street, number, unit)",
      addressCity: "City",
      addressPostcode: "Postal code",
      addressCountry: "Country",
      cinNumber: "National ID number",
      passportNumber: "Passport number",
      licenceNumber: "Licence number",
      licenceCountry: "Country that issued the licence",
      licenceIssued: "Date of issue",
      docsHint: "Lay the document flat inside the frame, avoid glare. Photos are compressed automatically.",
      cameraOnly: "Live photos only — uploading from your gallery is not allowed.",
      privacy: "Your documents are stored privately and encrypted, visible only to the CarKari verification team. They are deleted 90 days after your last rental, and never shared with agencies or third parties.",
      idpNote: "International Driving Permit: recommended if your licence is not written in Arabic, French or English. Add it if you have one — it avoids any refusal at the counter.",
      cam: {
        take: "Take photo", retake: "Retake", capture: "Capture",
        cancel: "Cancel", optional: "optional",
        denied: "Camera access denied. Allow the camera in your browser, then try again.",
        unsupported: "Your browser can't take photos. Use Chrome or Safari on your phone.",
        guide: "Fit the document inside the rectangle, clearly readable",
        guideSelfie: "Look at the camera, face well lit",
      },
      docLabels: {
        licenceFront: "Licence — front", licenceBack: "Licence — back",
        cinFront: "ID card — front", cinBack: "ID card — back",
        passport: "Passport — photo page", idp: "Int'l driving permit",
        selfie: "Selfie",
      },
      docHints: {
        licenceFront: "Front of the licence", licenceBack: "Back of the licence",
        cinFront: "Front of the card", cinBack: "Back of the card",
        passport: "Page with your photo", idp: "If you have one",
        selfie: "Your face",
      },
      submit: "Submit for verification",
      sending: "Uploading…",
      errDocs: "All required photos must be taken.",
      errAge: "You must be at least 21 to rent.",
      errLicence: "The licence must have been held for at least 1 year.",
      errGeneric: "Something went wrong. Try again or contact us.",
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

  const [{ data: verif }, { data: profile }] = await Promise.all([
    supabase.rpc("my_verification"),
    supabase.from("profiles").select("phone").eq("id", user.id).single(),
  ]);

  const state = (verif?.[0] ?? null) as
    | { kyc_status: string; reject_reason: string | null; email_confirmed: boolean }
    | null;
  const status = state?.kyc_status ?? "unverified";
  const emailOk = state?.email_confirmed ?? Boolean(user.email_confirmed_at);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-brand-950/[0.03] px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-brand-950/10 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-extrabold text-brand-950">{t.title}</h1>
            <p className="mt-1 text-sm text-brand-950/60">{t.sub}</p>

            {!emailOk && (
              <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                {t.emailWarn}
              </p>
            )}
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
