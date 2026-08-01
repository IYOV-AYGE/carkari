import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CarculatorWidget, type CarcLabels } from "@/components/CarculatorWidget";
import { getLang } from "@/lib/i18n/server";

const carc: Record<"fr" | "en", CarcLabels> = {
  fr: {
    sub: "Estimez ce que votre flotte peut rapporter.",
    type: "Type de véhicule", days: "Jours loués par mois :",
    perDay: "Prix indicatif / jour", total: "Revenu brut estimé",
    deposit: "Commission CarKari", balance: "Vous encaissez",
    cta: "Devenir hôte",
    cats: [
      "Citadine (Logan, Clio, i10...)",
      "Compacte (Golf, 208...)",
      "SUV (Tucson, Kadjar, RAV4...)",
      "Luxe (Mercedes, Range Rover...)",
      "Prestige (Bentley, Lamborghini...)",
    ],
  },
  en: {
    sub: "Estimate what your fleet could earn.",
    type: "Vehicle type", days: "Rented days per month:",
    perDay: "Indicative price / day", total: "Estimated gross revenue",
    deposit: "CarKari commission", balance: "You collect",
    cta: "Become a host",
    cats: [
      "City car (Logan, Clio, i10...)",
      "Compact (Golf, 208...)",
      "SUV (Tucson, Kadjar, RAV4...)",
      "Luxury (Mercedes, Range Rover...)",
      "Prestige (Bentley, Lamborghini...)",
    ],
  },
};

const L = {
  fr: {
    h1: "Votre flotte mérite plus de clients",
    sub: "CarKari apporte des réservations aux agences de location vérifiées du Maroc. Zéro frais fixes — nous gagnons uniquement quand vous louez.",
    cta: "Devenir hôte",
    ctaSecondary: "Parler à un conseiller",
    stats: [
      ["0 MAD", "frais d'inscription"],
      ["17,5 %", "commission, uniquement sur locations réalisées"],
      ["48 h", "délai de vérification"],
      ["FR · EN", "clients locaux et touristes"],
    ],
    benefitsTitle: "Pourquoi les agences choisissent CarKari",
    benefits: [
      ["Inscription gratuite", "Aucun abonnement, aucun frais d'entrée. Vous listez votre flotte, c'est tout."],
      ["Commission simple", "Environ 17,5 % uniquement sur les locations réalisées — c'est l'acompte payé en ligne par le client. Le solde vous est réglé directement à la prise du véhicule."],
      ["Vous gardez le contrôle", "Vos prix, vos conditions, votre calendrier. Publiez, mettez en pause ou retirez un véhicule à tout moment."],
      ["Des clients sérieux", "L'acompte non remboursable élimine les fausses réservations et les no-shows."],
      ["Visibilité nationale", "Pages optimisées Google pour chaque ville, en français et en anglais pour capter les touristes."],
      ["Badge vérifié", "La vérification CarKari rassure les clients et augmente vos conversions."],
    ],
    how: "Comment devenir hôte",
    steps: [
      ["1. Créez un compte", "Gratuitement, avec Google ou votre email professionnel."],
      ["2. Complétez le dossier", "Infos de l'agence, représentant légal, registre de commerce, assurance et pièce d'identité."],
      ["3. Ajoutez vos véhicules", "5 photos par voiture (avant, arrière, côtés, intérieur), prix et disponibilités."],
      ["4. Recevez des réservations", "Notification à chaque réservation, acompte déjà encaissé par CarKari."],
    ],
    reqTitle: "Ce qu'il faut préparer",
    reqs: [
      "Registre de commerce de l'agence (PDF ou photo)",
      "Attestation d'assurance de la flotte",
      "Pièce d'identité du représentant légal (recto et verso)",
      "Coordonnées du représentant : nom, date et ville de naissance, téléphone, email",
      "5 photos par véhicule — prises directement avec votre téléphone",
    ],
    calcTitle: "Combien pouvez-vous gagner ?",
    faqTitle: "Questions fréquentes des agences",
    faq: [
      ["Quand suis-je payé ?", "Le client vous règle le solde directement à la prise du véhicule, en espèces ou par carte. Vous n'attendez aucun virement de notre part."],
      ["Puis-je refuser une réservation ?", "Votre calendrier fait foi : bloquez les dates indisponibles et le véhicule n'est plus réservable. En cas d'imprévu, contactez-nous immédiatement."],
      ["Combien de véhicules puis-je lister ?", "Autant que vous voulez, sans frais supplémentaires."],
      ["Mes documents sont-ils publics ?", "Jamais. Ils sont stockés de façon privée et seuls nos vérificateurs y accèdent."],
    ],
    finalCta: "Prêt à remplir votre calendrier ?",
  },
  en: {
    h1: "Your fleet deserves more customers",
    sub: "CarKari brings bookings to verified rental agencies across Morocco. Zero fixed fees — we only earn when you rent.",
    cta: "Become a host",
    ctaSecondary: "Talk to us",
    stats: [
      ["0 MAD", "signup fee"],
      ["17.5%", "commission, only on completed rentals"],
      ["48h", "verification time"],
      ["FR · EN", "locals and tourists"],
    ],
    benefitsTitle: "Why agencies choose CarKari",
    benefits: [
      ["Free signup", "No subscription, no entry fee. List your fleet, that's it."],
      ["Simple commission", "About 17.5% only on completed rentals — that's the deposit paid online by the customer. The balance is paid to you directly at pickup."],
      ["You stay in control", "Your prices, your conditions, your calendar. Publish, pause or remove a vehicle anytime."],
      ["Serious customers", "The non-refundable deposit eliminates fake bookings and no-shows."],
      ["National visibility", "Google-optimized pages for every city, in French and English to capture tourists."],
      ["Verified badge", "CarKari verification reassures customers and increases your conversions."],
    ],
    how: "How to become a host",
    steps: [
      ["1. Create an account", "Free, with Google or your business email."],
      ["2. Complete the application", "Agency info, legal representative, business registry, insurance and government ID."],
      ["3. Add your vehicles", "5 photos per car (front, rear, sides, interior), price and availability."],
      ["4. Receive bookings", "Notification for every booking, deposit already collected by CarKari."],
    ],
    reqTitle: "What to prepare",
    reqs: [
      "Agency business registry (PDF or photo)",
      "Fleet insurance certificate",
      "Legal representative's government ID (front and back)",
      "Representative details: name, date and city of birth, phone, email",
      "5 photos per vehicle — taken directly with your phone",
    ],
    calcTitle: "How much could you earn?",
    faqTitle: "Frequent questions from agencies",
    faq: [
      ["When do I get paid?", "The customer pays you the balance directly at pickup, in cash or by card. You never wait for a transfer from us."],
      ["Can I refuse a booking?", "Your calendar rules: block unavailable dates and the vehicle can't be booked. If something unexpected happens, contact us immediately."],
      ["How many vehicles can I list?", "As many as you want, at no extra cost."],
      ["Are my documents public?", "Never. They are stored privately and only our verification team can access them."],
    ],
    finalCta: "Ready to fill your calendar?",
  },
};

export async function generateMetadata() {
  const t = L[await getLang()];
  return { title: t.h1, description: t.sub };
}

export default async function PartnersPage() {
  const lang = await getLang();
  const t = L[lang];
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-band px-4 py-20 text-center text-white">
          <Image src="/hero-car.jpg" alt="" fill sizes="100vw" className="object-cover opacity-20" />
          <div className="relative mx-auto max-w-3xl">
            <h1 className="text-4xl font-extrabold sm:text-5xl">{t.h1}</h1>
            <p className="mx-auto mt-4 max-w-xl text-brand-100/85">{t.sub}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/partenaires/inscription"
                className="rounded-full bg-accent-500 px-8 py-3 font-semibold text-white transition hover:bg-accent-400"
              >
                {t.cta}
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-white/30 px-8 py-3 font-semibold text-white transition hover:bg-card/10"
              >
                {t.ctaSecondary}
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-ink/10 bg-card py-8">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 text-center lg:grid-cols-4">
            {t.stats.map(([n, label]) => (
              <div key={label}>
                <p className="text-2xl font-extrabold text-ink">{n}</p>
                <p className="mt-1 text-xs text-ink/60">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="mb-8 text-center text-2xl font-bold text-ink">
            {t.benefitsTitle}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {t.benefits.map(([h, d]) => (
              <div key={h} className="rounded-2xl border border-ink/10 p-6">
                <p className="font-bold text-ink">{h}</p>
                <p className="mt-2 text-sm text-ink/70">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-ink/[0.03] py-14">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-8 text-center text-2xl font-bold text-ink">{t.how}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {t.steps.map(([h, d]) => (
                <div key={h} className="rounded-2xl bg-card p-6 ring-1 ring-ink/10">
                  <p className="font-bold text-ink">{h}</p>
                  <p className="mt-2 text-sm text-ink/70">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-ink">{t.reqTitle}</h2>
            <ul className="mt-4 space-y-3">
              {t.reqs.map((r) => (
                <li key={r} className="flex gap-3 text-ink/80">
                  <span className="mt-0.5 text-green-600">✓</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-4 text-2xl font-bold text-ink">{t.calcTitle}</h2>
            <CarculatorWidget L={carc[lang]} />
          </div>
        </section>

        <section className="bg-ink/[0.03] py-14">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="mb-6 text-2xl font-bold text-ink">{t.faqTitle}</h2>
            <div className="space-y-4">
              {t.faq.map(([q, a]) => (
                <div key={q} className="rounded-2xl bg-card p-5 ring-1 ring-ink/10">
                  <p className="font-semibold text-ink">{q}</p>
                  <p className="mt-1 text-sm text-ink/70">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-band py-14 text-center text-white">
          <h2 className="text-2xl font-bold">{t.finalCta}</h2>
          <Link
            href="/partenaires/inscription"
            className="mt-6 inline-block rounded-full bg-accent-500 px-8 py-3 font-semibold text-white transition hover:bg-accent-400"
          >
            {t.cta}
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
