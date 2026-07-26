import { CITIES } from "@/lib/mock/vehicles";

/** Server-rendered search form — submits GET to /search. */
export function SearchBar({ defaultCity = "" }: { defaultCity?: string }) {
  return (
    <form
      action="/search"
      className="flex w-full max-w-3xl flex-col gap-3 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-brand-950/10 sm:flex-row sm:items-end"
    >
      <label className="flex-1 text-sm font-medium text-brand-950">
        Ville
        <select
          name="city"
          defaultValue={defaultCity}
          className="mt-1 w-full rounded-lg border border-brand-950/15 bg-white px-3 py-2.5 text-brand-950"
        >
          <option value="">Toutes les villes</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="flex-1 text-sm font-medium text-brand-950">
        Départ
        <input
          type="date"
          name="from"
          className="mt-1 w-full rounded-lg border border-brand-950/15 px-3 py-2.5 text-brand-950"
        />
      </label>
      <label className="flex-1 text-sm font-medium text-brand-950">
        Retour
        <input
          type="date"
          name="to"
          className="mt-1 w-full rounded-lg border border-brand-950/15 px-3 py-2.5 text-brand-950"
        />
      </label>
      <button
        type="submit"
        className="rounded-lg bg-accent-500 px-6 py-2.5 font-semibold text-white transition hover:bg-accent-400"
      >
        Rechercher
      </button>
    </form>
  );
}
