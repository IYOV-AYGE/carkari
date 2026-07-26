import { ContentPage, Section } from "@/components/ContentPage";

export const metadata = {
  title: "À propos",
  description: "CarKari connecte les voyageurs aux meilleures agences de location de voiture du Maroc.",
};

export default function AboutPage() {
  return (
    <ContentPage
      title="À propos de CarKari"
      subtitle="La location de voiture au Maroc, simplifiée et sécurisée."
    >
      <Section h="Notre mission">
        <p>
          Trouver une voiture de location fiable au Maroc ne devrait pas être une
          loterie. CarKari réunit les agences de location professionnelles du
          pays sur une seule plateforme : prix transparents, véhicules récents,
          avis authentiques, réservation en ligne.
        </p>
      </Section>
      <Section h="Comment nous travaillons">
        <p>
          Chaque agence partenaire est vérifiée avant sa mise en ligne : registre
          de commerce, assurance, état de la flotte. Vous réservez avec un simple
          acompte en ligne ; le reste se règle directement à l&apos;agence lors
          de la prise du véhicule. Pas de frais cachés, jamais.
        </p>
      </Section>
      <Section h="Pour les agences">
        <p>
          CarKari est une vitrine et un canal de réservation sans effort :
          inscription gratuite, commission uniquement sur les locations
          réalisées. Vous gardez le contrôle de votre flotte et de vos prix.
        </p>
      </Section>
    </ContentPage>
  );
}
