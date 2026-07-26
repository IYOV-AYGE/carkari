import { ContentPage, Section } from "@/components/ContentPage";
import { getLang } from "@/lib/i18n/server";

export const metadata = { title: "Conditions d'utilisation" };

const L = {
  fr: {
    title: "Conditions d'utilisation",
    sub: "Version simplifiée — dernière mise à jour : juillet 2026.",
    sections: [
      ["1. Le service", "CarKari est une place de marché qui met en relation des clients et des agences de location de voitures professionnelles au Maroc. Le contrat de location est conclu directement entre le client et l'agence ; CarKari n'est pas le loueur."],
      ["2. Réservation et acompte", "La réservation est confirmée au paiement de l'acompte en ligne. L'acompte correspond à la part de CarKari ; le solde est payé directement à l'agence à la prise du véhicule."],
      ["3. Annulation", "Annulation gratuite pendant 24 heures après la réservation, sauf si le départ a lieu dans moins de 48 heures — dans ce cas l'acompte est non remboursable dès la réservation. Passé le délai de 24 h, l'acompte n'est pas remboursable."],
      ["4. Obligations du client", "Fournir des documents valides (permis, pièce d'identité), respecter le contrat signé avec l'agence et restituer le véhicule dans l'état de prise en charge."],
      ["5. Obligations des agences", "Fournir le véhicule réservé (ou un équivalent supérieur), assuré et conforme. En cas de manquement, le client est intégralement remboursé et l'agence s'expose à une suspension."],
      ["6. Responsabilité", "CarKari s'efforce d'assurer l'exactitude des annonces mais ne peut être tenu responsable de l'exécution du contrat de location, qui relève de l'agence. Les litiges de location sont traités en premier lieu entre client et agence, avec la médiation de CarKari."],
      ["7. Compte", "Vous êtes responsable de la confidentialité de vos identifiants. Les comptes frauduleux sont supprimés."],
    ] as [string, string][],
  },
  en: {
    title: "Terms of use",
    sub: "Simplified version — last updated: July 2026.",
    sections: [
      ["1. The service", "CarKari is a marketplace connecting customers with professional car rental agencies in Morocco. The rental contract is concluded directly between the customer and the agency; CarKari is not the lessor."],
      ["2. Booking and deposit", "A booking is confirmed upon online payment of the deposit. The deposit is CarKari's share; the balance is paid directly to the agency at pickup."],
      ["3. Cancellation", "Free cancellation for 24 hours after booking, unless pickup is within 48 hours — in that case the deposit is non-refundable from the moment of booking. After the 24h window, the deposit is non-refundable."],
      ["4. Customer obligations", "Provide valid documents (license, ID), comply with the contract signed with the agency, and return the vehicle in its original condition."],
      ["5. Agency obligations", "Provide the booked vehicle (or a superior equivalent), insured and compliant. Otherwise the customer is fully refunded and the agency risks suspension."],
      ["6. Liability", "CarKari strives to keep listings accurate but cannot be held liable for the performance of the rental contract, which is the agency's responsibility. Rental disputes are handled first between customer and agency, with CarKari mediating."],
      ["7. Account", "You are responsible for keeping your credentials confidential. Fraudulent accounts are removed."],
    ] as [string, string][],
  },
};

export default async function TermsPage() {
  const t = L[await getLang()];
  return (
    <ContentPage title={t.title} subtitle={t.sub}>
      {t.sections.map(([h, p]) => (
        <Section key={h} h={h}><p>{p}</p></Section>
      ))}
    </ContentPage>
  );
}
