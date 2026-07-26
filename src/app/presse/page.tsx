import { ContentPage, Section } from "@/components/ContentPage";
import { getLang } from "@/lib/i18n/server";

export const metadata = { title: "Presse" };

const L = {
  fr: {
    title: "Presse",
    sub: "Ressources et contact pour les médias.",
    s1: "À propos de CarKari",
    p1: "CarKari (www.carkari.com) est la place de marché de la location de voiture au Maroc : des agences professionnelles vérifiées, une réservation en ligne avec acompte sécurisé, et des prix sans surprise. L'entreprise est basée aux États-Unis et opère au Maroc.",
    s2: "Contact presse",
    p2: "press@carkari.com — nous répondons sous 24 h. Logo et visuels disponibles sur demande.",
  },
  en: {
    title: "Press",
    sub: "Resources and contact for media.",
    s1: "About CarKari",
    p1: "CarKari (www.carkari.com) is Morocco's car rental marketplace: verified professional agencies, online booking with a secure deposit, and no-surprise pricing. The company is US-based and operates in Morocco.",
    s2: "Press contact",
    p2: "press@carkari.com — we reply within 24h. Logo and visuals available on request.",
  },
};

export default async function PressPage() {
  const t = L[await getLang()];
  return (
    <ContentPage title={t.title} subtitle={t.sub}>
      <Section h={t.s1}><p>{t.p1}</p></Section>
      <Section h={t.s2}><p>{t.p2}</p></Section>
    </ContentPage>
  );
}
