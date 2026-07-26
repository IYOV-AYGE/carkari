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
    sub: "Remplissez ce formulaire — vérification sous 48 h.",
    loginFirst: "Créez d'abord un compte (gratuit), puis revenez ici pour inscrire votre agence.",
    loginBtn: "Créer un compte / Connexion",
    statusTitle: "Votre agence",
    pending: "Dossier reçu — vérification en cours (sous 48 h). Nous vous contactons par email.",
    verified: "Agence vérifiée ! Votre tableau de bord arrive très bientôt — vous pourrez y gérer votre flotte.",
    suspended: "Compte suspendu. Contactez-nous pour plus d'informations.",
    dashboard: "Tableau de bord (bientôt)",
    form: {
      legalName: "Raison sociale de l'agence",
      city: "Ville principale",
      phone: "Téléphone (WhatsApp de préférence)",
      rcNumber: "Numéro de registre de commerce (RC)",
      rcDoc: "Registre de commerce (PDF ou photo)",
      insuranceDoc: "Attestation d'assurance flotte (PDF ou photo)",
      docHint: "Fichiers acceptés : PDF, JPG, PNG — 10 Mo max. Vos documents restent privés et ne sont visibles que par l'équipe CarKari.",
      submit: "Envoyer mon dossier",
      uploading: "Envoi en cours…",
      errGeneric: "Une erreur est survenue. Vérifiez les fichiers et réessayez, ou contactez-nous sur WhatsApp.",
      done: "Dossier envoyé ! Nous vérifions vos documents sous 48 h et revenons vers vous par email.",
    },
  },
  en: {
    title: "Agency registration",
    sub: "Fill in this form — verification within 48h.",
    loginFirst: "Create a free account first, then come back here to register your agency.",
    loginBtn: "Create account / Sign in",
    statusTitle: "Your agency",
    pending: "Application received — verification in progress (within 48h). We'll contact you by email.",
    verified: "Agency verified! Your dashboard is coming very soon — you'll manage your fleet there.",
    suspended: "Account suspended. Contact us for more information.",
    dashboard: "Dashboard (soon)",
    form: {
      legalName: "Agency legal name",
      city: "Main city",
      phone: "Phone (WhatsApp preferred)",
      rcNumber: "Business registry number (RC)",
      rcDoc: "Business registry document (PDF or photo)",
      insuranceDoc: "Fleet insurance certificate (PDF or photo)",
      docHint: "Accepted files: PDF, JPG, PNG — 10 MB max. Your documents stay private and are only visible to the CarKari team.",
      submit: "Submit my application",
      uploading: "Uploading…",
      errGeneric: "Something went wrong. Check the files and try again, or contact us on WhatsApp.",
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
      <main className="flex-1 bg-brand-950/[0.03] px-4 py-12">
        <div className="mx-auto max-w-xl rounded-2xl border border-brand-950/10 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-extrabold text-brand-950">{t.title}</h1>
          <p className="mt-1 text-sm text-brand-950/60">{t.sub}</p>

          <div className="mt-6">
            {!user ? (
              <div className="space-y-4">
                <p className="text-brand-950/80">{t.loginFirst}</p>
                <Link
                  href="/auth"
                  className="block rounded-xl bg-accent-500 py-3 text-center font-semibold text-white transition hover:bg-accent-400"
                >
                  {t.loginBtn}
                </Link>
              </div>
            ) : existing ? (
              <div>
                <p className="font-semibold text-brand-950">
                  {t.statusTitle}: {existing.legal_name}
                </p>
                <p
                  className={`mt-3 rounded-xl p-4 text-sm ${
                    existing.status === "verified"
                      ? "bg-green-50 text-green-800"
                      : existing.status === "suspended"
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {existing.status === "verified"
                    ? t.verified
                    : existing.status === "suspended"
                      ? t.suspended
                      : t.pending}
                </p>
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
