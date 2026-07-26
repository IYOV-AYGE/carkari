import { ContentPage, Section } from "@/components/ContentPage";

export const metadata = {
  title: "Assurance",
  description: "Comment fonctionne l'assurance des véhicules loués via CarKari.",
};

export default function InsurancePage() {
  return (
    <ContentPage
      title="Assurance"
      subtitle="Tous les véhicules CarKari sont assurés par leurs agences."
    >
      <Section h="Ce qui est toujours inclus">
        <p>
          Chaque véhicule mis en ligne appartient à une agence de location
          professionnelle, légalement tenue d&apos;assurer sa flotte :
          responsabilité civile et assurance tous risques selon le contrat de
          l&apos;agence. L&apos;attestation d&apos;assurance est vérifiée lors de
          l&apos;inscription du partenaire.
        </p>
      </Section>
      <Section h="Franchise et caution">
        <p>
          En cas de sinistre responsable, une franchise peut s&apos;appliquer —
          son montant figure sur le contrat signé à la prise du véhicule, et la
          caution sert généralement à la couvrir. Lisez le contrat avant de
          signer ; les conditions par véhicule sont affichées sur l&apos;annonce.
        </p>
      </Section>
      <Section h="Rachat de franchise">
        <p>
          Certaines agences proposent un rachat partiel ou total de franchise en
          option payante à la prise du véhicule. Si cette option compte pour
          vous, mentionnez-le à l&apos;agence via WhatsApp avant votre départ.
        </p>
      </Section>
    </ContentPage>
  );
}
