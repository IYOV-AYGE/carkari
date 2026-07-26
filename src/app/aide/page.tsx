import { ContentPage, Section } from "@/components/ContentPage";
import { getLang } from "@/lib/i18n/server";

export const metadata = {
  title: "Centre d'aide",
  description: "Questions fréquentes sur la réservation, le paiement et l'annulation chez CarKari.",
};

const L = {
  fr: {
    title: "Centre d'aide",
    sub: "Les réponses aux questions les plus fréquentes.",
    faq: [
      ["Comment fonctionne la réservation ?", "Choisissez votre voiture et vos dates, payez un acompte en ligne (environ 17 % du total). Le solde se règle directement à l'agence lors de la prise du véhicule, en espèces ou par carte."],
      ["Puis-je annuler gratuitement ?", "Oui — pendant 24 heures après la réservation, l'acompte est intégralement remboursé. Passé ce délai, il n'est plus remboursable. Attention : pour les départs à moins de 48 heures, l'acompte n'est pas remboursable dès la réservation."],
      ["Que se passe-t-il si l'agence n'a pas ma voiture ?", "Si l'agence ne fournit pas le véhicule réservé (ou un équivalent supérieur), vous êtes intégralement remboursé et l'agence est sanctionnée sur la plateforme."],
      ["Quels documents faut-il pour louer ?", "Permis de conduire valide (depuis 1 an minimum en général), pièce d'identité ou passeport, et l'âge minimum exigé par l'agence (souvent 21 ans). Les conditions exactes figurent sur chaque annonce."],
      ["Une caution est-elle demandée ?", "La plupart des agences demandent une caution à la prise du véhicule (empreinte bancaire ou espèces). Son montant est indiqué sur l'annonce du véhicule."],
      ["Comment vous contacter ?", "Le plus simple : le bouton WhatsApp en bas de page. Nous répondons 7j/7."],
    ] as [string, string][],
  },
  en: {
    title: "Help center",
    sub: "Answers to the most frequent questions.",
    faq: [
      ["How does booking work?", "Choose your car and dates, pay an online deposit (about 17% of the total). The balance is paid directly to the agency at pickup, in cash or by card."],
      ["Can I cancel for free?", "Yes — for 24 hours after booking, the deposit is fully refunded. After that window it's non-refundable. Note: for pickups within 48 hours, the deposit is non-refundable from the moment of booking."],
      ["What if the agency doesn't have my car?", "If the agency fails to provide the booked vehicle (or a superior equivalent), you are fully refunded and the agency is penalized on the platform."],
      ["What documents do I need?", "A valid driving license (usually held for at least 1 year), ID or passport, and the minimum age required by the agency (often 21). Exact conditions are shown on each listing."],
      ["Is a security deposit required?", "Most agencies require a security deposit at pickup (card hold or cash). The amount is shown on the vehicle listing."],
      ["How do I contact you?", "Easiest: the WhatsApp button at the bottom of the page. We reply 7 days a week."],
    ] as [string, string][],
  },
};

export default async function HelpPage() {
  const t = L[await getLang()];
  return (
    <ContentPage title={t.title} subtitle={t.sub}>
      {t.faq.map(([q, a]) => (
        <Section key={q} h={q}><p>{a}</p></Section>
      ))}
    </ContentPage>
  );
}
