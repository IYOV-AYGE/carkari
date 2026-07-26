import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getLang } from "@/lib/i18n/server";

const L = {
  fr: {
    h1: "Votre flotte mérite plus de clients",
    sub: "CarKari apporte des réservations aux agences de location vérifiées du Maroc. Zéro frais fixes — nous gagnons uniquement quand vous louez.",
    cta: "Créer mon compte agence",
    benefits: [
      ["Inscription gratuite", "Aucun abonnement, aucun frais d'entrée. Vous listez votre flotte, c'est tout."],
      ["Commission simple", "Environ 17,5 % uniquement sur les locations réalisées — l'acompte payé en ligne par le client. Le solde vous est payé directement à la prise du véhicule."],
      ["Vous gardez le contrôle", "Vos prix, vos conditions, votre calendrier. Bloquez des dates à tout moment."],
      ["Des clients sérieux", "L'acompte non remboursable élimine les fausses réservations et les no-shows."],
      ["Visibilité nationale", "Pages optimisées Google pour chaque ville, versions française et anglaise pour les touristes."],
      ["Badge vérifié", "La vérification CarKari rassure les clients et augmente vos conversions."],
    ],
    how: "Comment devenir partenaire",
    steps: [
      ["1. Créez un compte", "Inscrivez-vous gratuitement avec l'email de votre agence."],
      ["2. Envoyez vos documents", "Registre de commerce et attestation d'assurance — vérification sous 48 h."],
      ["3. Listez votre flotte", "Photos, prix, disponibilités. Votre tableau de bord gère tout."],
      ["4. Recevez des réservations", "Notification à chaque réservation confirmée, acompte déjà encaissé."],
    ],
    faq: "Une question ? Écrivez-nous sur WhatsApp ou via la page contact.",
  },
  en: {
    h1: "Your fleet deserves more customers",
    sub: "CarKari brings bookings to verified rental agencies across Morocco. Zero fixed fees — we only earn when you rent.",
    cta: "Create my agency account",
    benefits: [
      ["Free signup", "No subscription, no entry fee. List your fleet, that's it."],
      ["Simple commission", "About 17.5% only on completed rentals — the deposit paid online by the customer. The balance is paid to you directly at pickup."],
      ["You stay in control", "Your prices, your conditions, your calendar. Block dates anytime."],
      ["Serious customers", "The non-refundable deposit eliminates fake bookings and no-shows."],
      ["National visibility", "Google-optimized pages for every city, French and English versions for tourists."],
      ["Verified badge", "CarKari verification reassures customers and increases your conversions."],
    ],
    how: "How to become a partner",
    steps: [
      ["1. Create an account", "Sign up free with your agency email."],
      ["2. Send your documents", "Business registry and insurance certificate — verified within 48h."],
      ["3. List your fleet", "Photos, prices, availability. Your dashboard handles everything."],
      ["4. Receive bookings", "Notification for every confirmed booking, deposit already collected."],
    ],
    faq: "Questions? Message us on WhatsApp or via the contact page.",
  },
};

export default async function PartnersPage() {
  const t = L[await getLang()];
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="bg-brand-950 px-4 py-16 text-center text-white">
          <h1 className="mx-auto max-w-2xl text-4xl font-extrabold">{t.h1}</h1>
          <p className="mx-auto mt-4 max-w-xl text-brand-100/80">{t.sub}</p>
          <Link
            href="/auth"
            className="mt-8 inline-block rounded-full bg-accent-500 px-8 py-3 font-semibold text-white transition hover:bg-accent-400"
          >
            {t.cta}
          </Link>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {t.benefits.map(([h, d]) => (
              <div key={h} className="rounded-2xl border border-brand-950/10 p-6">
                <p className="font-bold text-brand-950">{h}</p>
                <p className="mt-2 text-sm text-brand-950/70">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-brand-950/[0.03] py-14">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-8 text-center text-2xl font-bold text-brand-950">{t.how}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {t.steps.map(([h, d]) => (
                <div key={h} className="rounded-2xl bg-white p-6 ring-1 ring-brand-950/10">
                  <p className="font-bold text-brand-950">{h}</p>
                  <p className="mt-2 text-sm text-brand-950/70">{d}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-brand-950/60">{t.faq}</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export async function generateMetadata() {
  const t = L[await getLang()];
  return { title: t.h1, description: t.sub };
}
