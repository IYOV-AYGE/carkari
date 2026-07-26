import { ContentPage, Section } from "@/components/ContentPage";

export const metadata = {
  title: "Centre d'aide",
  description: "Questions fréquentes sur la réservation, le paiement et l'annulation chez CarKari.",
};

const FAQ: [string, string][] = [
  [
    "Comment fonctionne la réservation ?",
    "Choisissez votre voiture et vos dates, payez un acompte en ligne (environ 17 % du total). Le solde se règle directement à l'agence lors de la prise du véhicule, en espèces ou par carte.",
  ],
  [
    "Puis-je annuler gratuitement ?",
    "Oui — pendant 24 heures après la réservation, l'acompte est intégralement remboursé. Passé ce délai, il n'est plus remboursable. Attention : pour les départs à moins de 48 heures, l'acompte n'est pas remboursable dès la réservation.",
  ],
  [
    "Que se passe-t-il si l'agence n'a pas ma voiture ?",
    "Si l'agence ne fournit pas le véhicule réservé (ou un équivalent supérieur), vous êtes intégralement remboursé et l'agence est sanctionnée sur la plateforme.",
  ],
  [
    "Quels documents faut-il pour louer ?",
    "Permis de conduire valide (depuis 1 an minimum en général), pièce d'identité ou passeport, et l'âge minimum exigé par l'agence (souvent 21 ans). Les conditions exactes figurent sur chaque annonce.",
  ],
  [
    "Une caution est-elle demandée ?",
    "La plupart des agences demandent une caution à la prise du véhicule (empreinte bancaire ou espèces). Son montant est indiqué sur l'annonce du véhicule.",
  ],
  [
    "Comment vous contacter ?",
    "Le plus simple : le bouton WhatsApp en bas de page. Nous répondons 7j/7.",
  ],
];

export default function HelpPage() {
  return (
    <ContentPage
      title="Centre d'aide"
      subtitle="Les réponses aux questions les plus fréquentes."
    >
      {FAQ.map(([q, a]) => (
        <Section key={q} h={q}>
          <p>{a}</p>
        </Section>
      ))}
    </ContentPage>
  );
}
