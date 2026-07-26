import { ContentPage, Section } from "@/components/ContentPage";
import { getLang } from "@/lib/i18n/server";

export const metadata = { title: "Contact" };

const L = {
  fr: {
    title: "Contact",
    sub: "Nous répondons 7j/7, généralement en moins d'une heure.",
    s1: "WhatsApp (recommandé)",
    p1: "Le canal le plus rapide : cliquez sur le bouton vert en bas de page. Idéal pendant une location en cours.",
    s2: "Email",
    p2: "Écrivez-nous à contact@carkari.com — réponse sous 24 h.",
    s3: "Agences",
    p3: "Pour devenir partenaire ou pour toute question sur votre compte agence : partenaires@carkari.com.",
  },
  en: {
    title: "Contact",
    sub: "We reply 7 days a week, usually within the hour.",
    s1: "WhatsApp (recommended)",
    p1: "The fastest channel: click the green button at the bottom of the page. Ideal during an ongoing rental.",
    s2: "Email",
    p2: "Write to contact@carkari.com — reply within 24h.",
    s3: "Agencies",
    p3: "To become a partner or for any agency account question: partenaires@carkari.com.",
  },
};

export default async function ContactPage() {
  const t = L[await getLang()];
  return (
    <ContentPage title={t.title} subtitle={t.sub}>
      <Section h={t.s1}><p>{t.p1}</p></Section>
      <Section h={t.s2}><p>{t.p2}</p></Section>
      <Section h={t.s3}><p>{t.p3}</p></Section>
    </ContentPage>
  );
}
