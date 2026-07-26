import { ContentPage, Section } from "@/components/ContentPage";
import { getLang } from "@/lib/i18n/server";

const L = {
  fr: {
    title: "Politique de confidentialité",
    sub: "Ce que nous collectons, pourquoi, et vos droits.",
    sections: [
      ["Données collectées", "Compte : nom, email, téléphone. Réservations : véhicule, dates, montants. Paiement : traité par notre prestataire certifié — CarKari ne stocke jamais votre numéro de carte. Navigation : préférence de langue et mesures d'audience anonymisées."],
      ["Utilisation", "Exécuter vos réservations, transmettre à l'agence les informations nécessaires (nom, téléphone), vous envoyer les confirmations, améliorer le service. Jamais de vente de données à des tiers."],
      ["Conservation", "Les données de réservation sont conservées pour la durée légale comptable. Vous pouvez demander la suppression de votre compte à tout moment."],
      ["Vos droits", "Accès, rectification, suppression, portabilité : écrivez à privacy@carkari.com. Nous répondons sous 30 jours."],
    ] as [string, string][],
  },
  en: {
    title: "Privacy policy",
    sub: "What we collect, why, and your rights.",
    sections: [
      ["Data we collect", "Account: name, email, phone. Bookings: vehicle, dates, amounts. Payment: processed by our certified provider — CarKari never stores your card number. Browsing: language preference and anonymized analytics."],
      ["How we use it", "To fulfill your bookings, pass necessary information to the agency (name, phone), send confirmations, and improve the service. We never sell data to third parties."],
      ["Retention", "Booking data is kept for the legal accounting period. You can request account deletion at any time."],
      ["Your rights", "Access, rectification, deletion, portability: write to privacy@carkari.com. We reply within 30 days."],
    ] as [string, string][],
  },
};

export default async function PrivacyPage() {
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
