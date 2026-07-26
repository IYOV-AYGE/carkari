import { ContentPage, Section } from "@/components/ContentPage";
import { getLang } from "@/lib/i18n/server";

const L = {
  fr: {
    title: "Confiance et sécurité",
    sub: "Votre réservation est protégée à chaque étape.",
    sections: [
      ["Agences vérifiées", "Avant d'apparaître sur CarKari, chaque agence fournit son registre de commerce, son attestation d'assurance et des informations sur sa flotte. Le badge « vérifiée » signifie que ces contrôles sont passés."],
      ["Paiement sécurisé", "L'acompte est traité par un prestataire de paiement international certifié PCI-DSS. CarKari ne stocke jamais votre numéro de carte. Le solde se paie directement à l'agence — vous ne payez jamais la totalité avant d'avoir vu le véhicule."],
      ["Avis authentiques", "Seuls les clients ayant réellement terminé une location peuvent laisser un avis. Pas d'avis achetés, pas d'avis anonymes."],
      ["En cas de problème", "Véhicule non conforme, agence en retard, litige ? Contactez-nous sur WhatsApp pendant la prise du véhicule — nous intervenons directement auprès de l'agence. Les agences accumulant des incidents sont suspendues de la plateforme."],
    ] as [string, string][],
  },
  en: {
    title: "Trust and safety",
    sub: "Your booking is protected at every step.",
    sections: [
      ["Verified agencies", "Before appearing on CarKari, every agency provides its business registry, insurance certificate, and fleet information. The \"verified\" badge means these checks passed."],
      ["Secure payment", "The deposit is processed by a PCI-DSS certified international payment provider. CarKari never stores your card number. The balance is paid directly to the agency — you never pay the full amount before seeing the vehicle."],
      ["Authentic reviews", "Only customers who actually completed a rental can leave a review. No bought reviews, no anonymous reviews."],
      ["If something goes wrong", "Wrong vehicle, late agency, dispute? Contact us on WhatsApp at pickup — we intervene directly with the agency. Agencies accumulating incidents are suspended from the platform."],
    ] as [string, string][],
  },
};

export default async function TrustPage() {
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
