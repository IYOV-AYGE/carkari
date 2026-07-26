import { ContentPage, Section } from "@/components/ContentPage";

export const metadata = {
  title: "Confiance et sécurité",
  description: "Comment CarKari vérifie ses agences partenaires et protège vos réservations.",
};

export default function TrustPage() {
  return (
    <ContentPage
      title="Confiance et sécurité"
      subtitle="Votre réservation est protégée à chaque étape."
    >
      <Section h="Agences vérifiées">
        <p>
          Avant d&apos;apparaître sur CarKari, chaque agence fournit son registre
          de commerce, son attestation d&apos;assurance et des informations sur
          sa flotte. Le badge <span className="font-medium text-green-700">✓ vérifiée</span>{" "}
          signifie que ces contrôles sont passés.
        </p>
      </Section>
      <Section h="Paiement sécurisé">
        <p>
          L&apos;acompte est traité par un prestataire de paiement international
          certifié PCI-DSS. CarKari ne stocke jamais votre numéro de carte. Le
          solde se paie directement à l&apos;agence — vous ne payez jamais la
          totalité avant d&apos;avoir vu le véhicule.
        </p>
      </Section>
      <Section h="Avis authentiques">
        <p>
          Seuls les clients ayant réellement terminé une location peuvent
          laisser un avis. Pas d&apos;avis achetés, pas d&apos;avis anonymes.
        </p>
      </Section>
      <Section h="En cas de problème">
        <p>
          Véhicule non conforme, agence en retard, litige ? Contactez-nous sur
          WhatsApp pendant la prise du véhicule — nous intervenons directement
          auprès de l&apos;agence. Les agences accumulant des incidents sont
          suspendues de la plateforme.
        </p>
      </Section>
    </ContentPage>
  );
}
