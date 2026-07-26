// Per-city SEO landing pages: /location-voiture/casablanca etc. Bilingual.
import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SearchBar } from "@/components/SearchBar";
import { VehicleCard } from "@/components/VehicleCard";
import { CITIES, MOCK_VEHICLES } from "@/lib/mock/vehicles";
import { getLang } from "@/lib/i18n/server";

const slugify = (c: string) =>
  c.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const fromSlug = (slug: string) => CITIES.find((c) => slugify(c) === slug);

export function generateStaticParams() {
  return CITIES.map((c) => ({ city: slugify(c) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const city = fromSlug((await params).city);
  if (!city) return {};
  const lang = await getLang();
  return lang === "fr"
    ? {
        title: `Location de voiture à ${city} — dès 200 MAD/jour`,
        description: `Louez une voiture à ${city} auprès d'agences vérifiées. Citadines, SUV et voitures de luxe. Réservation en ligne, acompte sécurisé, annulation gratuite 24 h.`,
      }
    : {
        title: `Car rental in ${city} — from 200 MAD/day`,
        description: `Rent a car in ${city} from verified agencies. City cars, SUVs and luxury vehicles. Online booking, secure deposit, free 24h cancellation.`,
      };
}

const L = {
  fr: {
    h1a: "Location de voiture à",
    intro: (n: number, city: string, min: string) =>
      `${n} véhicules d'agences vérifiées à ${city}, à partir de ${min} MAD par jour. Réservez en ligne avec un simple acompte — le reste se règle à la prise du véhicule.`,
    h2: (city: string) => `Louer une voiture à ${city} avec CarKari`,
    body: (city: string) =>
      `CarKari travaille uniquement avec des agences de location professionnelles et vérifiées à ${city}. Les prix affichés sont définitifs : pas de frais cachés au comptoir. Annulation gratuite pendant 24 heures après la réservation (hors départs à moins de 48 heures). Besoin d'aide ? Contactez-nous sur WhatsApp ou visitez notre `,
    helpLink: "centre d'aide",
  },
  en: {
    h1a: "Car rental in",
    intro: (n: number, city: string, min: string) =>
      `${n} vehicles from verified agencies in ${city}, from ${min} MAD per day. Book online with a simple deposit — pay the rest at pickup.`,
    h2: (city: string) => `Renting a car in ${city} with CarKari`,
    body: (city: string) =>
      `CarKari works only with professional, verified rental agencies in ${city}. Displayed prices are final: no hidden fees at the counter. Free cancellation for 24 hours after booking (except pickups within 48 hours). Need help? Contact us on WhatsApp or visit our `,
    helpLink: "help center",
  },
};

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const city = fromSlug((await params).city);
  if (!city) notFound();
  const t = L[await getLang()];

  const cars = MOCK_VEHICLES.filter((v) => v.city === city);
  const minPrice = (
    Math.min(...cars.map((v) => v.dailyPriceMad)) / 100
  ).toLocaleString("fr-MA");

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="bg-brand-950 px-4 pb-16 pt-12 text-white">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-3xl font-extrabold sm:text-4xl">
              {t.h1a} <span className="text-accent-400">{city}</span>
            </h1>
            <p className="mt-3 max-w-2xl text-brand-100/80">
              {t.intro(cars.length, city, minPrice)}
            </p>
            <div className="mt-6">
              <SearchBar defaultCity={city} />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cars.map((v) => (
              <VehicleCard key={v.id} v={v} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-14 text-sm leading-relaxed text-brand-950/70">
          <h2 className="mb-2 text-lg font-bold text-brand-950">{t.h2(city)}</h2>
          <p>
            {t.body(city)}
            <Link href="/aide" className="font-medium text-accent-600 hover:underline">
              {t.helpLink}
            </Link>
            .
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
