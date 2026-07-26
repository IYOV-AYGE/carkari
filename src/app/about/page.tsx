import { ContentPage, Section } from "@/components/ContentPage";
import { getLang } from "@/lib/i18n/server";

const L = {
  fr: {
    title: "À propos de CarKari",
    sub: "La location de voiture au Maroc, simplifiée et sécurisée.",
    sections: [
      ["Notre mission", "Trouver une voiture de location fiable au Maroc ne devrait pas être une loterie. CarKari réunit les agences de location professionnelles du pays sur une seule plateforme : prix transparents, véhicules récents, avis authentiques, réservation en ligne."],
      ["Comment nous travaillons", "Chaque agence partenaire est vérifiée avant sa mise en ligne : registre de commerce, assurance, état de la flotte. Vous réservez avec un simple acompte en ligne ; le reste se règle directement à l'agence lors de la prise du véhicule. Pas de frais cachés, jamais."],
      ["Pour les agences", "CarKari est une vitrine et un canal de réservation sans effort : inscription gratuite, commission uniquement sur les locations réalisées. Vous gardez le contrôle de votre flotte et de vos prix."],
    ] as [string, string][],
  },
  en: {
    title: "About CarKari",
    sub: "Car rental in Morocco, simplified and secure.",
    sections: [
      ["Our mission", "Finding a reliable rental car in Morocco shouldn't be a lottery. CarKari brings the country's professional rental agencies onto a single platform: transparent prices, recent vehicles, authentic reviews, online booking."],
      ["How we work", "Every partner agency is verified before going live: business registry, insurance, fleet condition. You book with a simple online deposit; the rest is paid directly to the agency at pickup. No hidden fees, ever."],
      ["For agencies", "CarKari is a storefront and an effortless booking channel: free signup, commission only on completed rentals. You keep control of your fleet and your prices."],
    ] as [string, string][],
  },
};

export default async function AboutPage() {
  const t = L[await getLang()];
  return (
    <ContentPage title={t.title} subtitle={t.sub}>
      {t.sections.map(([h, p]) => (
        <Section key={h} h={h}><p>{p}</p></Section>
      ))}
    </ContentPage>
  );
}

export async function generateMetadata() {
  const t = L[await getLang()];
  return { title: t.title, description: t.sub };
}
