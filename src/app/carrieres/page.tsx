import { ContentPage, Section } from "@/components/ContentPage";
import { getLang } from "@/lib/i18n/server";

export const metadata = { title: "Carrières" };

const L = {
  fr: {
    title: "Carrières",
    sub: "Construisez l'avenir de la mobilité au Maroc avec nous.",
    s1: "Pourquoi CarKari",
    p1: "Nous sommes une jeune équipe qui digitalise un marché immense et encore largement hors ligne. Chaque personne qui nous rejoint a un impact direct et visible sur le produit.",
    s2: "Postes ouverts",
    p2: "Aucun poste ouvert pour le moment — mais nous lisons toutes les candidatures spontanées. Envoyez CV et quelques lignes sur ce que vous voulez construire à jobs@carkari.com.",
  },
  en: {
    title: "Careers",
    sub: "Build the future of mobility in Morocco with us.",
    s1: "Why CarKari",
    p1: "We're a young team digitizing a huge, still largely offline market. Everyone who joins has a direct, visible impact on the product.",
    s2: "Open positions",
    p2: "No open positions right now — but we read every spontaneous application. Send your CV and a few lines about what you want to build to jobs@carkari.com.",
  },
};

export default async function CareersPage() {
  const t = L[await getLang()];
  return (
    <ContentPage title={t.title} subtitle={t.sub}>
      <Section h={t.s1}><p>{t.p1}</p></Section>
      <Section h={t.s2}><p>{t.p2}</p></Section>
    </ContentPage>
  );
}
