"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  PhotoSlots,
  ANGLE_SLOTS_FR,
  ANGLE_SLOTS_EN,
  type PhotoMap,
} from "@/components/PhotoSlots";

export type VehicleFormLabels = {
  heading: string; make: string; model: string; year: string; category: string;
  transmission: string; fuel: string; seats: string; price: string;
  priceHour: string; minHours: string; hourlyNote: string;
  photos: string; photosHint: string; photosMissing: string;
  submit: string; saving: string; err: string;
  slots: { add: string; replace: string; optimizing: string; savedPct: string };
  cats: Record<string, string>;
  manual: string; auto: string;
  diesel: string; petrol: string; hybrid: string; electric: string;
};

export function AddVehicleForm({
  L,
  lang,
  agencyId,
  city,
}: {
  L: VehicleFormLabels;
  lang: "fr" | "en";
  agencyId: string;
  city: string;
}) {
  const router = useRouter();
  // Quads and jet skis are sold by the hour, so the price field has to
  // change with the category rather than sitting there mislabelled.
  const [category, setCategory] = useState("citadine");
  const byHour = category === "quad" || category === "jetski";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<PhotoMap>({});

  const slots = lang === "fr" ? ANGLE_SLOTS_FR : ANGLE_SLOTS_EN;
  const missing = slots.filter((s) => !photos[s.key]).length;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (missing > 0) {
      setError(L.photosMissing);
      return;
    }
    setBusy(true);
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const supabase = createClient();

    try {
      const priceMad = Number(fd.get("price_mad"));
      if (!Number.isFinite(priceMad) || priceMad <= 0) throw new Error("price");

      const { data: vehicle, error: insErr } = await supabase
        .from("vehicles")
        .insert({
          agency_id: agencyId,
          make: String(fd.get("make") ?? "").trim(),
          model: String(fd.get("model") ?? "").trim(),
          year: Number(fd.get("year")),
          category,
          transmission: String(fd.get("transmission") ?? "manuelle"),
          fuel: String(fd.get("fuel") ?? "diesel"),
          seats: Number(fd.get("seats")),
          rental_unit: byHour ? "hour" : "day",
          // daily_price_mad is NOT NULL, so an hourly vehicle still carries a
          // notional day rate (10 x the hour) for sorting and price filters.
          daily_price_mad: Math.round(priceMad * 100) * (byHour ? 10 : 1),
          hourly_price_mad: byHour ? Math.round(priceMad * 100) : null,
          min_hours: byHour ? Number(fd.get("min_hours") ?? 1) : 1,
          status: "draft",
        })
        .select("id")
        .single();
      if (insErr || !vehicle) throw insErr ?? new Error("insert");

      // upload the 5 angles in slot order (sort keeps galleries consistent)
      const rows: { vehicle_id: string; path: string; sort: number }[] = [];
      for (let i = 0; i < slots.length; i++) {
        const file = photos[slots[i].key];
        const path = `${agencyId}/${vehicle.id}/${slots[i].key}-${Date.now()}.${file.name.split(".").pop()}`;
        const { error: upErr } = await supabase.storage
          .from("vehicle-photos")
          .upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        rows.push({ vehicle_id: vehicle.id, path, sort: i });
      }
      const { error: imgErr } = await supabase.from("vehicle_images").insert(rows);
      if (imgErr) throw imgErr;

      form.reset();
      setPhotos({});
      router.refresh();
    } catch {
      setError(L.err);
    } finally {
      setBusy(false);
    }
  }

  const input =
    "mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink";
  const label = "block text-sm font-medium text-ink";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <p className="font-bold text-ink">{L.heading}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          {L.make}
          <input name="make" required className={input} placeholder="Dacia" />
        </label>
        <label className={label}>
          {L.model}
          <input name="model" required className={input} placeholder="Logan" />
        </label>
        <label className={label}>
          {L.year}
          <input name="year" type="number" min={1990} max={2100} defaultValue={2024} required className={input} />
        </label>
        <label className={label}>
          {L.category}
          <select
            name="category"
            className={input}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {Object.entries(L.cats).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          {L.transmission}
          <select name="transmission" className={input}>
            <option value="manuelle">{L.manual}</option>
            <option value="automatique">{L.auto}</option>
          </select>
        </label>
        <label className={label}>
          {L.fuel}
          <select name="fuel" className={input}>
            <option value="diesel">{L.diesel}</option>
            <option value="essence">{L.petrol}</option>
            <option value="hybride">{L.hybrid}</option>
            <option value="électrique">{L.electric}</option>
          </select>
        </label>
        <label className={label}>
          {L.seats}
          <input name="seats" type="number" min={1} max={9} defaultValue={5} required className={input} />
        </label>
        <label className={label}>
          {byHour ? L.priceHour : L.price}
          <input
            name="price_mad"
            type="number"
            min={1}
            step={10}
            required
            className={input}
            placeholder={byHour ? "250" : "350"}
          />
          {byHour && (
            <span className="mt-1 block text-xs font-normal text-ink/55">
              {L.hourlyNote}
            </span>
          )}
        </label>

        {byHour && (
          <label className={label}>
            {L.minHours}
            <select name="min_hours" defaultValue="1" className={input}>
              {[1, 2, 3, 4, 6, 8].map((h) => (
                <option key={h} value={h}>{h} h</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div>
        <p className={label}>{L.photos}</p>
        <p className="mb-2 text-xs text-ink/50">{L.photosHint}</p>
        <PhotoSlots slots={slots} value={photos} onChange={setPhotos} labels={L.slots} />
      </div>

      <p className="text-xs text-ink/50">{city}</p>

      {error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-500/15 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error}</p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-accent-500 px-6 py-2.5 font-semibold text-white transition hover:bg-accent-400 disabled:opacity-60"
      >
        {busy ? L.saving : L.submit}
      </button>
    </form>
  );
}
