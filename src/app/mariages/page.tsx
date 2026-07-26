import Link from "next/link";
import { ContentPage, Section } from "@/components/ContentPage";
import { VehicleCard } from "@/components/VehicleCard";
import { MOCK_VEHICLES } from "@/lib/mock/vehicles";
import { getLang } from "@/lib/i18n/server";

const L = {
  fr: {
    title: "Votre mariage mérite une entrée remarquée",
    sub: "Mercedes, Bentley, Maybach, Porsche — les plus belles voitures du Maroc pour le plus beau jour.",
    s1: "Pourquoi réserver avec CarKari",
    p1: "Un mariage ne laisse aucune place à l'imprévu. Nos agences partenaires vérifiées confirment le véhicule, l'heure et le lieu par écrit — et notre politique de remplacement s'applique : si le véhicule réservé n'est pas fourni, remboursement intégral et remplacement en priorité par un modèle équivalent ou supérieur.",
    s2: "Nos voitures de prestige",
    seeAll: "Voir toute la collection luxe →",
    s3: "Avec ou sans chauffeur",
    p3: "La plupart des agences proposent un chauffeur pour les mariages (recommandé : vous profitez de la journée). Précisez-le simplement sur WhatsApp après la réservation, l'agence vous fera un devis.",
  },
  en: {
    title: "Your wedding deserves a grand entrance",
    sub: "Mercedes, Bentley, Maybach, Porsche — Morocco's finest cars for your finest day.",
    s1: "Why book with CarKari",
    p1: "A wedding leaves no room for surprises. Our verified partner agencies confirm the vehicle, time and place in writing — and our replacement policy applies: if the booked vehicle isn't provided, full refund and priority replacement with an equivalent or superior model.",
    s2: "Our prestige cars",
    seeAll: "See the full luxury collection →",
    s3: "With or without a chauffeur",
    p3: "Most agencies offer a chauffeur for weddings (recommended: enjoy your day). Just mention it on WhatsApp after booking and the agency will quote you.",
  },
};

export default async function WeddingsPage() {
  const t = L[await getLang()];
  const luxe = MOCK_VEHICLES.filter((v) => v.category === "luxe").slice(0, 6);
  return (
    <ContentPage title={t.title} subtitle={t.sub}>
      <Section h={t.s1}><p>{t.p1}</p></Section>
      <Section h={t.s2}>
        <div className="grid gap-5 sm:grid-cols-2">
          {luxe.map((v) => <VehicleCard key={v.id} v={v} />)}
        </div>
        <p className="mt-4">
          <Link href="/search?category=luxe" className="font-semibold text-accent-600 hover:underline">
            {t.seeAll}
          </Link>
        </p>
      </Section>
      <Section h={t.s3}><p>{t.p3}</p></Section>
    </ContentPage>
  );
}

export async function generateMetadata() {
  const t = L[await getLang()];
  return { title: t.title, description: t.sub };
}
