import { ContentPage, Section } from "@/components/ContentPage";
import { getLang } from "@/lib/i18n/server";

const L = {
  fr: {
    title: "Assurance",
    sub: "Tous les véhicules CarKari sont assurés par leurs agences.",
    sections: [
      ["Ce qui est toujours inclus", "Chaque véhicule mis en ligne appartient à une agence de location professionnelle, légalement tenue d'assurer sa flotte : responsabilité civile et assurance tous risques selon le contrat de l'agence. L'attestation d'assurance est vérifiée lors de l'inscription du partenaire."],
      ["Franchise et caution", "En cas de sinistre responsable, une franchise peut s'appliquer — son montant figure sur le contrat signé à la prise du véhicule, et la caution sert généralement à la couvrir. Lisez le contrat avant de signer ; les conditions par véhicule sont affichées sur l'annonce."],
      ["Rachat de franchise", "Certaines agences proposent un rachat partiel ou total de franchise en option payante à la prise du véhicule. Si cette option compte pour vous, mentionnez-le à l'agence via WhatsApp avant votre départ."],
    ] as [string, string][],
  },
  en: {
    title: "Insurance",
    sub: "All CarKari vehicles are insured by their agencies.",
    sections: [
      ["Always included", "Every listed vehicle belongs to a professional rental agency, legally required to insure its fleet: liability and comprehensive coverage per the agency's contract. The insurance certificate is verified during partner onboarding."],
      ["Excess and security deposit", "In an at-fault incident, an excess (deductible) may apply — the amount is in the contract signed at pickup, and the security deposit generally covers it. Read the contract before signing; per-vehicle conditions are shown on the listing."],
      ["Excess buy-back", "Some agencies offer partial or full excess buy-back as a paid option at pickup. If this matters to you, mention it to the agency via WhatsApp before your trip."],
    ] as [string, string][],
  },
};

export default async function InsurancePage() {
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
