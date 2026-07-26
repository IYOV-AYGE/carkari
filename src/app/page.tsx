import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SearchBar } from "@/components/SearchBar";
import { VehicleCardCompact } from "@/components/VehicleCard";
import { CATEGORIES, CITIES, MOCK_VEHICLES, type MockVehicle } from "@/lib/mock/vehicles";
import { getDict, tpl } from "@/lib/i18n/server";

function Row({
  title,
  seeAllHref,
  seeAllLabel,
  cars,
}: {
  title: string;
  seeAllHref: string;
  seeAllLabel: string;
  cars: MockVehicle[];
}) {
  if (cars.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-xl font-bold text-brand-950">{title}</h2>
        <Link href={seeAllHref} className="text-sm font-semibold text-accent-600 hover:underline">
          {seeAllLabel} →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cars.slice(0, 4).map((v) => (
          <VehicleCardCompact key={v.id} v={v} />
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const t = await getDict();
  const byRating = [...MOCK_VEHICLES].sort((a, b) => b.rating - a.rating);
  const casa = byRating.filter((v) => v.city === "Casablanca");
  const suvMarrakech = byRating.filter((v) => v.category === "suv");
  const luxe = byRating.filter((v) => v.category === "luxe");
  const budget = [...MOCK_VEHICLES].sort((a, b) => a.dailyPriceMad - b.dailyPriceMad);
  const vans = byRating.filter((v) => v.category === "utilitaire");

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pt-6">
          <div className="relative overflow-hidden rounded-3xl bg-brand-950">
            <Image
              src="/hero-car.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-30"
            />
            <div className="relative px-6 py-12 text-center text-white sm:px-12 sm:py-16">
              <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
                {t.hero.title}{" "}
                <span className="text-accent-400">{t.hero.titleAccent}</span>
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-brand-100/90">{t.hero.sub}</p>
              <div className="mx-auto mt-7 max-w-3xl text-left">
                <SearchBar />
              </div>
            </div>
          </div>
        </section>

        <nav className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 pt-6">
          <Link
            href="/search"
            className="rounded-full bg-brand-950 px-4 py-1.5 text-sm font-medium text-white"
          >
            {t.cats.all}
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              href={`/search?category=${c.key}`}
              className="rounded-full bg-brand-950/5 px-4 py-1.5 text-sm font-medium text-brand-950 hover:bg-brand-950/10"
            >
              {t.cats[c.key]}
            </Link>
          ))}
        </nav>

        <Row
          title={tpl(t.rows.popular, { city: "Casablanca" })}
          seeAllHref="/search?city=Casablanca"
          seeAllLabel={t.rows.seeAll}
          cars={casa}
        />
        <Row
          title={t.rows.luxury}
          seeAllHref="/search?category=luxe"
          seeAllLabel={t.rows.seeAll}
          cars={luxe}
        />
        <Row
          title={tpl(t.rows.suvIn, { city: "Marrakech" })}
          seeAllHref="/search?category=suv"
          seeAllLabel={t.rows.seeAll}
          cars={suvMarrakech}
        />
        <Row
          title={t.rows.budget}
          seeAllHref="/search?sort=price_asc"
          seeAllLabel={t.rows.seeAll}
          cars={budget}
        />
        <Row
          title={t.rows.vans}
          seeAllHref="/search?category=utilitaire"
          seeAllLabel={t.rows.seeAll}
          cars={vans}
        />

        <section id="villes" className="bg-brand-950/[0.03] py-12">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-6 text-2xl font-bold text-brand-950">{t.cities}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {CITIES.map((c) => (
                <Link
                  key={c}
                  href={`/search?city=${encodeURIComponent(c)}`}
                  className="rounded-xl border border-brand-950/10 bg-white px-4 py-6 text-center font-semibold text-brand-950 transition hover:border-accent-400 hover:shadow"
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="mb-8 text-center text-2xl font-bold text-brand-950">
            {t.how.title}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {t.how.steps.map(([h, d]) => (
              <div key={h} className="rounded-2xl border border-brand-950/10 p-6">
                <p className="text-lg font-bold text-brand-950">{h}</p>
                <p className="mt-2 text-brand-950/70">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="agences" className="bg-brand-950 py-14 text-white">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h2 className="text-2xl font-bold">{t.cta.title}</h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-100/80">{t.cta.sub}</p>
            <Link
              href="/auth"
              className="mt-6 inline-block rounded-full bg-accent-500 px-8 py-3 font-semibold text-white transition hover:bg-accent-400"
            >
              {t.cta.btn}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
