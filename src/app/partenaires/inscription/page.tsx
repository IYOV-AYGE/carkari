import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AgencyApplyForm, type ApplyLabels } from "@/components/AgencyApplyForm";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n/server";

const L: Record<"fr" | "en", {
  title: string; sub: string; loginFirst: string; loginBtn: string;
  statusTitle: string; pending: string; verified: string; suspended: string;
  dashboard: string; form: ApplyLabels;
}> = {
  fr: {
    title: "Inscription agence",
    sub: "Un seul formulaire — vérification sous 48 h.",
    loginFirst: "Créez d'abord votre compte hôte (gratuit) — vous serez ramené ici automatiquement pour inscrire votre agence.",
    loginBtn: "Créer mon compte hôte",
    statusTitle: "Votre agence",
    pending: "Dossier reçu — vérification en cours (sous 48 h). Nous vous contactons par email.",
    verified: "Agence vérifiée ! Rendez-vous dans votre espace agence pour ajouter vos véhicules.",
    suspended: "Compte suspendu. Contactez-nous pour plus d'informations.",
    dashboard: "Ouvrir mon espace agence",
    form: {
      secCompany: "1. L'agence",
      secRep: "2. Représentant légal",
      secDocs: "3. Documents",
      legalName: "Raison sociale de l'agence",
      city: "Ville principale",
      phone: "Téléphone de l'agence",
      rcNumber: "Numéro de registre de commerce (RC)",
      repFirst: "Prénom du représentant",
      repLast: "Nom du représentant",
      repBirth: "Date de naissance",
      repBirthCity: "Ville de naissance",
      repPhone: "Téléphone (WhatsApp de préférence)",
      repEmail: "Email du représentant",
      rcDoc: "Registre de commerce",
      insuranceDoc: "Attestation d'assurance flotte",
      idFront: "Pièce d'identité — recto",
      idBack: "Pièce d'identité — verso",
      docHint: "PDF ou photo (JPG, PNG). Vous pouvez photographier vos documents directement avec votre téléphone — les images sont compressées automatiquement.",
      privacyNote: "Vos documents et données personnelles sont stockés de façon privée et chiffrée. Seule l'équipe de vérification CarKari peut y accéder ; ils ne sont jamais publics ni partagés avec les clients.",
      submit: "Envoyer mon dossier",
      uploading: "Envoi en cours…",
      errGeneric: "Une erreur est survenue. Vérifiez les fichiers et réessayez, ou contactez-nous sur WhatsApp.",
      errAge: "Le représentant légal doit être majeur (18 ans ou plus).",
      done: "Dossier envoyé ! Nous vérifions vos documents sous 48 h et revenons vers vous par email.",
    },
  },
  en: {
    title: "Agency registration",
    sub: "One single form — verification within 48h.",
    loginFirst: "Create your free host account first — we'll bring you straight back here to register your agency.",
    loginBtn: "Create my host account",
    statusTitle: "Your agency",
    pending: "Application received — verification in progress (within 48h). We'll contact you by email.",
    verified: "Agency verified! Head to your agency space to add your vehicles.",
    suspended: "Account suspended. Contact us for more information.",
    dashboard: "Open my agency space",
    form: {
      secCompany: "1. The agency",
      secRep: "2. Legal representative",
      secDocs: "3. Documents",
      legalName: "Agency legal name",
      city: "Main city",
      phone: "Agency phone",
      rcNumber: "Business registry number (RC)",
      repFirst: "Representative first name",
      repLast: "Representative last name",
      repBirth: "Date of birth",
      repBirthCity: "City of birth",
      repPhone: "Phone (WhatsApp preferred)",
      repEmail: "Representative email",
      rcDoc: "Business registry document",
      insuranceDoc: "Fleet insurance certificate",
      idFront: "Government ID — front",
      idBack: "Government ID — back",
      docHint: "PDF or photo (JPG, PNG). You can photograph your documents directly with your phone — images are compressed automatically.",
      privacyNote: "Your documents and personal data are stored privately and encrypted. Only the CarKari verification team can access them; they are never public nor shared with customers.",
      submit: "Submit my application",
      uploading: "Uploading…",
      errGeneric: "Something went wrong. Check the files and try again, or contact us on WhatsApp.",
      errAge: "The legal representative must be 18 or older.",
      done: "Application sent! We verify your documents within 48h and get back to you by email.",
    },
  },
};

export async function generateMetadata() {
  const t = L[await getLang()];
  return { title: t.title, description: t.sub };
}

export default async function AgencyApplyPage() {
  const t = L[await getLang()];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let existing: { legal_name: string; status: string } | null = null;
  if (user) {
    const { data } = await supabase.rpc("my_agency");
    existing = data?.[0] ?? null;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-ink/[0.03] px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-2xl border border-ink/10 bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-extrabold text-ink">{t.title}</h1>
          <p className="mt-1 text-sm text-ink/60">{t.sub}</p>

          <div className="mt-8">
            {!user ? (
              <div className="space-y-4">
                <p className="text-ink/80">{t.loginFirst}</p>
                <Link
                  href="/auth?mode=signup&next=%2Fpartenaires%2Finscription"
                  className="block rounded-xl bg-accent-500 py-3 text-center font-semibold text-white transition hover:bg-accent-400"
                >
                  {t.loginBtn}
                </Link>
              </div>
            ) : existing ? (
              <div>
                <p className="font-semibold text-ink">
                  {t.statusTitle}: {existing.legal_name}
                </p>
                <p
                  className={`mt-3 rounded-xl p-4 text-sm ${
                    existing.status === "verified"
                      ? "bg-green-50 dark:bg-green-500/15 text-green-800 dark:text-green-300"
                      : existing.status === "suspended"
                        ? "bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300"
                        : "bg-amber-50 dark:bg-amber-400/15 text-amber-800 dark:text-amber-200"
                  }`}
                >
                  {existing.status === "verified"
                    ? t.verified
                    : existing.status === "suspended"
                      ? t.suspended
                      : t.pending}
                </p>
                {existing.status === "verified" && (
                  <Link
                    href="/agence"
                    className="mt-4 inline-block rounded-xl bg-accent-500 px-6 py-3 font-semibold text-white hover:bg-accent-400"
                  >
                    {t.dashboard}
                  </Link>
                )}
              </div>
            ) : (
              <AgencyApplyForm t={t.form} userId={user.id} />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
