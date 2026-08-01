import { CITIES } from "@/lib/mock/vehicles";
import { getDict } from "@/lib/i18n/server";

/** Server-rendered search form — submits GET to /search. */
export async function SearchBar({ defaultCity = "" }: { defaultCity?: string }) {
  const t = await getDict();
  return (
    <form
      action="/search"
      className="flex w-full flex-col gap-3 rounded-2xl bg-card p-4 shadow-xl ring-1 ring-ink/10 sm:flex-row sm:items-end"
    >
      <label className="flex-1 text-sm font-medium text-ink">
        {t.search.city}
        <select
          name="city"
          defaultValue={defaultCity}
          className="mt-1 w-full rounded-lg border border-ink/15 bg-card px-3 py-2.5 text-ink"
        >
          <option value="">{t.search.allCities}</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="flex-1 text-sm font-medium text-ink">
        {t.search.from}
        <input
          type="date"
          name="from"
          className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2.5 text-ink"
        />
      </label>
      <label className="flex-1 text-sm font-medium text-ink">
        {t.search.to}
        <input
          type="date"
          name="to"
          className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2.5 text-ink"
        />
      </label>
      <button
        type="submit"
        className="rounded-lg bg-accent-500 px-6 py-2.5 font-semibold text-white transition hover:bg-accent-400"
      >
        {t.search.btn}
      </button>
    </form>
  );
}
