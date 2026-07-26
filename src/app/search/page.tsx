import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SearchBar } from "@/components/SearchBar";
import { VehicleCard } from "@/components/VehicleCard";
import { CATEGORIES, MOCK_VEHICLES } from "@/lib/mock/vehicles";
import Link from "next/link";
import { getDict, tpl } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { getLang } = await import("@/lib/i18n/server");
  return { title: (await getLang()) === "fr" ? "Rechercher une voiture" : "Find a car" };
}

type Params = {
  city?: string;
  category?: string;
  price?: string;
  trans?: string;
  sort?: string;
};

const PRICE_BANDS: Record<string, [number, number]> = {
  eco: [0, 35000],
  mid: [35000, 100000],
  high: [100000, 300000],
  lux: [300000, Infinity],
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const { city = "", category = "", price = "", trans = "", sort = "" } =
    await searchParams;
  const t = await getDict();

  let results = MOCK_VEHICLES.filter(
    (v) =>
      (!city || v.city === city) &&
      (!category || v.category === category) &&
      (!trans || v.transmission === trans)
  );
  if (price && PRICE_BANDS[price]) {
    const [lo, hi] = PRICE_BANDS[price];
    results = results.filter((v) => v.dailyPriceMad >= lo && v.dailyPriceMad < hi);
  }
  if (sort === "price_asc") results.sort((a, b) => a.dailyPriceMad - b.dailyPriceMad);
  else if (sort === "price_desc") results.sort((a, b) => b.dailyPriceMad - a.dailyPriceMad);
  else if (sort === "rating") results.sort((a, b) => b.rating - a.rating);

  const current: Record<string, string> = {};
  if (city) current.city = city;
  if (category) current.category = category;
  if (price) current.price = price;
  if (trans) current.trans = trans;
  if (sort) current.sort = sort;

  const qs = (patch: Record<string, string>) => {
    const p = { ...current, ...patch };
    Object.keys(p).forEach((k) => p[k] === "" && delete p[k]);
    const s = new URLSearchParams(p).toString();
    return s ? `?${s}` : "";
  };

  const sel =
    "rounded-lg border border-brand-950/15 bg-white px-3 py-2 text-sm text-brand-950";

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
          <div className="mb-4 flex flex-wrap gap-2">
            <Link
              href={`/search${qs({ category: "" })}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${!category ? "bg-brand-950 text-white" : "bg-brand-950/5 text-brand-950 hover:bg-brand-950/10"}`}
            >
              {t.cats.all}
            </Link>
            {CATEGORIES.map((c) => (
              <Link
                key={c.key}
                href={`/search${qs({ category: c.key })}`}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${category === c.key ? "bg-brand-950 text-white" : "bg-brand-950/5 text-brand-950 hover:bg-brand-950/10"}`}
              >
                {t.cats[c.key]}
              </Link>
            ))}
          </div>

          <form
            action="/search"
            className="mb-6 flex flex-wrap items-center gap-3"
          >
            {city && <input type="hidden" name="city" value={city} />}
            {category && <input type="hidden" name="category" value={category} />}
            <select name="price" defaultValue={price} className={sel}>
              <option value="">{t.filters.allPrices}</option>
              <option value="eco">{t.filters.under}</option>
              <option value="mid">{t.filters.mid}</option>
              <option value="high">{t.filters.high}</option>
              <option value="lux">{t.filters.lux}</option>
            </select>
            <select name="trans" defaultValue={trans} className={sel}>
              <option value="">{t.filters.anyTrans}</option>
              <option value="manuelle">{t.filters.manual}</option>
              <option value="automatique">{t.filters.auto}</option>
            </select>
            <select name="sort" defaultValue={sort} className={sel}>
              <option value="">{t.filters.sort}</option>
              <option value="price_asc">{t.filters.priceAsc}</option>
              <option value="price_desc">{t.filters.priceDesc}</option>
              <option value="rating">{t.filters.rating}</option>
            </select>
            <button className="rounded-lg bg-brand-950 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
              {t.filters.apply}
            </button>
            {(price || trans || sort) && (
              <Link
                href={`/search${qs({ price: "", trans: "", sort: "" })}`}
                className="text-sm text-brand-950/60 hover:underline"
              >
                {t.filters.reset}
              </Link>
            )}
          </form>

          <p className="mb-4 text-sm text-brand-950/60">
            {tpl(t.results.count, { n: results.length })}{" "}
            {city ? `${t.results.at} ${city}` : t.results.inMorocco}
          </p>

          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-950/20 p-12 text-center text-brand-950/60">
              {t.results.none}
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
