"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type VehicleFormLabels = {
  heading: string; make: string; model: string; year: string; category: string;
  transmission: string; fuel: string; seats: string; price: string;
  photo: string; submit: string; saving: string; err: string;
  cats: Record<string, string>;
  manual: string; auto: string;
  diesel: string; petrol: string; hybrid: string; electric: string;
};

export function AddVehicleForm({
  L,
  agencyId,
  city,
}: {
  L: VehicleFormLabels;
  agencyId: string;
  city: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
          category: String(fd.get("category") ?? "citadine"),
          transmission: String(fd.get("transmission") ?? "manuelle"),
          fuel: String(fd.get("fuel") ?? "diesel"),
          seats: Number(fd.get("seats")),
          daily_price_mad: Math.round(priceMad * 100),
          status: "draft",
        })
        .select("id")
        .single();
      if (insErr || !vehicle) throw insErr ?? new Error("insert");

      const file = fd.get("photo") as File | null;
      if (file && file.size > 0) {
        if (file.size > 8 * 1024 * 1024) throw new Error("too large");
        const path = `${agencyId}/${vehicle.id}-${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage
          .from("vehicle-photos")
          .upload(path, file);
        if (upErr) throw upErr;
        const { error: imgErr } = await supabase
          .from("vehicle_images")
          .insert({ vehicle_id: vehicle.id, path, sort: 0 });
        if (imgErr) throw imgErr;
      }

      form.reset();
      router.refresh();
    } catch {
      setError(L.err);
    } finally {
      setBusy(false);
    }
  }

  const input =
    "mt-1 w-full rounded-lg border border-brand-950/15 px-3 py-2 text-brand-950";
  const label = "block text-sm font-medium text-brand-950";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="font-bold text-brand-950">{L.heading}</p>
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
          <select name="category" className={input}>
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
          {L.price}
          <input name="price_mad" type="number" min={1} step={10} required className={input} placeholder="350" />
        </label>
      </div>
      <label className={label}>
        {L.photo}
        <input name="photo" type="file" accept="image/*" className={input} />
      </label>
      <p className="text-xs text-brand-950/50">{city}</p>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
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
