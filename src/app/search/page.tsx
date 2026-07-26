import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SearchBar } from "@/components/SearchBar";
import { VehicleCard } from "@/components/VehicleCard";
import { CATEGORIES, MOCK_VEHICLES } from "@/lib/mock/vehicles";
import Link from "next/link";

export const metadata = { title: "Rechercher une voiture" };

type Params = { city?: string; category?: string; from?: string; to?: string };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const { city = "", category = "" } = await searchParams;

  const results = MOCK_VEHICLES.filter(
    (v) =>
      (!city || v.city === city) && (!category || v.category === category)
  );

  const qs = (cat: string) =>
    "?" +
    new URLSearchParams({
      ...(city ? { city } : {}),
      ...(cat ? { category: cat } : {}),
    }).toString();

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="bg-brand-950 px-4 py-8">
          <div className="mx-auto max-w-6xl">
            <SearchBar defaultCity={city} />
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-6 flex flex-wrap gap-2">
            <Link
              href={`/search${qs("")}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${!category ? "bg-brand-950 text-white" : "bg-brand-950/5 text-brand-950 hover:bg-brand-950/10"}`}
            >
              Tous
            </Link>
            {CATEGORIES.map((c) => (
              <Link
                key={c.key}
                href={`/search${qs(c.key)}`}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${category === c.key ? "bg-brand-950 text-white" : "bg-brand-950/5 text-brand-950 hover:bg-brand-950/10"}`}
              >
                {c.label}
              </Link>
            ))}
          </div>

          <p className="mb-4 text-sm text-brand-950/60">
            {results.length} véhicule{results.length > 1 ? "s" : ""}
            {city ? ` à ${city}` : " au Maroc"}
          </p>

          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-950/20 p-12 text-center text-brand-950/60">
              Aucun véhicule pour ces critères. Essayez une autre ville ou catégorie.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((v) => <VehicleCard key={v.id} v={v} />)}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
