import Link from "next/link";
import { ContentPage, Section } from "@/components/ContentPage";
import { VehicleCard } from "@/components/VehicleCard";
import { MOCK_VEHICLES } from "@/lib/mock/vehicles";

export const metadata = {
  title: "Voitures de mariage",
  description: "Louez une voiture de prestige pour votre mariage au Maroc : Mercedes, Bentley, Maybach, Porsche avec ou sans chauffeur.",
};

export default function WeddingsPage() {
  const luxe = MOCK_VEHICLES.filter((v) => v.category === "luxe").slice(0, 6);
  return (
    <ContentPage
      title="Votre mariage mérite une entrée remarquée"
      subtitle="Mercedes, Bentley, Maybach, Porsche — les plus belles voitures du Maroc pour le plus beau jour."
    >
      <Section h="Pourquoi réserver avec CarKari">
        <p>
          Un mariage ne laisse aucune place à l&apos;imprévu. Nos agences
          partenaires vérifiées confirment le véhicule, l&apos;heure et le lieu
          par écrit — et notre politique de remplacement s&apos;applique : si le
          véhicule réservé n&apos;est pas fourni, remboursement intégral et
          remplacement en priorité par un modèle équivalent ou supérieur.
        </p>
      </Section>
      <Section h="Nos voitures de prestige">
        <div className="grid gap-5 sm:grid-cols-2">
          {luxe.map((v) => <VehicleCard key={v.id} v={v} />)}
        </div>
        <p className="mt-4">
          <Link href="/search?category=luxe" className="font-semibold text-accent-600 hover:underline">
            Voir toute la collection luxe →
          </Link>
        </p>
      </Section>
      <Section h="Avec ou sans chauffeur">
        <p>
          La plupart des agences proposent un chauffeur pour les mariages
          (recommandé : vous profitez de la journée). Précisez-le simplement sur
          WhatsApp après la réservation, l&apos;agence vous fera un devis.
        </p>
      </Section>
    </ContentPage>
  );
}
