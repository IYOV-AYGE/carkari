import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CarculatorWidget, type CarcLabels } from "@/components/CarculatorWidget";
import { getLang } from "@/lib/i18n/server";

const L: Record<"fr" | "en", CarcLabels> = {
  fr: {
    sub: "Estimez le budget de votre location en 10 secondes.",
    type: "Type de véhicule",
    days: "Nombre de jours :",
    perDay: "Prix indicatif / jour",
    total: "Total estimé",
    deposit: "Acompte en ligne",
    balance: "À régler à l'agence",
    cta: "Voir les vraies offres",
    cats: [
      "Citadine (Logan, Clio, i10...)",
      "Compacte (Golf, 208...)",
      "SUV (Tucson, Kadjar, RAV4...)",
      "Luxe (Mercedes, Range Rover...)",
      "Prestige (Bentley, Lamborghini...)",
    ],
  },
  en: {
    sub: "Estimate your rental budget in 10 seconds.",
    type: "Vehicle type",
    days: "Number of days:",
    perDay: "Indicative price / day",
    total: "Estimated total",
    deposit: "Online deposit",
    balance: "Due at the agency",
    cta: "See real offers",
    cats: [
      "City car (Logan, Clio, i10...)",
      "Compact (Golf, 208...)",
      "SUV (Tucson, Kadjar, RAV4...)",
      "Luxury (Mercedes, Range Rover...)",
      "Prestige (Bentley, Lamborghini...)",
    ],
  },
};

export async function generateMetadata() {
  const lang = await getLang();
  return {
    title: lang === "fr" ? "Carculator — estimez votre budget location" : "Carculator — estimate your rental budget",
    description: L[lang].sub,
  };
}

export default async function CarculatorPage() {
  const lang = await getLang();
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-brand-950/[0.03] px-4 py-12">
        <CarculatorWidget L={L[lang]} />
      </main>
      <Footer />
    </>
  );
}
