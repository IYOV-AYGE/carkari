// Reads real listings (live vehicles of verified agencies) and maps them to the
// same shape the UI already uses for mock cars. RLS guarantees only public rows.
import { createClient } from "@/lib/supabase/server";
import type { MockVehicle } from "@/lib/mock/vehicles";

const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PLACEHOLDER = "/vehicles/dacia-logan.jpg";

type Row = {
  id: string;
  make: string;
  model: string;
  year: number | null;
  category: string;
  transmission: string;
  fuel: string;
  seats: number;
  daily_price_mad: number;
  rental_unit?: string | null;
  hourly_price_mad?: number | null;
  min_hours?: number | null;
  agencies: { legal_name: string; city: string; status: string } | null;
  vehicle_images: { path: string; sort: number }[] | null;
};

const CATS = ["citadine", "compacte", "suv", "luxe", "utilitaire", "quad", "jetski"] as const;

export async function getLiveVehicles(): Promise<MockVehicle[]> {
  try {
    const supabase = await createClient();

    // The hourly columns only exist once 00013 has run. Asking for a column
    // that is not there fails the WHOLE query, which would silently empty the
    // homepage — so try the full shape, then fall back to the legacy one.
    // Migrations and deploys are not atomic; the site must survive the gap.
    const FULL =
      "id, make, model, year, category, transmission, fuel, seats, daily_price_mad, rental_unit, hourly_price_mad, min_hours, agencies(legal_name, city, status), vehicle_images(path, sort)";
    const LEGACY =
      "id, make, model, year, category, transmission, fuel, seats, daily_price_mad, agencies(legal_name, city, status), vehicle_images(path, sort)";

    let res = await supabase
      .from("vehicles")
      .select(FULL)
      .eq("status", "live")
      .limit(200);

    if (res.error) {
      res = (await supabase
        .from("vehicles")
        .select(LEGACY)
        .eq("status", "live")
        .limit(200)) as typeof res;
    }
    const { data, error } = res;
    if (error || !data) return [];

    // Supabase types nested relations as arrays; normalize to a single object.
    const rows: Row[] = (data as unknown[]).map((raw) => {
      const r = raw as Omit<Row, "agencies"> & {
        agencies: Row["agencies"] | Row["agencies"][];
      };
      return {
        ...r,
        agencies: Array.isArray(r.agencies) ? (r.agencies[0] ?? null) : r.agencies,
      };
    });

    return rows
      .filter((r) => r.agencies?.status === "verified")
      .map((r) => {
        const sorted = (r.vehicle_images ?? []).slice().sort((a, b) => a.sort - b.sort);
        const urls = sorted.map(
          (i) => `${SUPA}/storage/v1/object/public/vehicle-photos/${i.path}`
        );
        const img = sorted[0];
        const category = (CATS as readonly string[]).includes(r.category)
          ? (r.category as MockVehicle["category"])
          : "citadine";
        return {
          id: r.id,
          make: r.make,
          model: r.model,
          year: r.year ?? 2024,
          category,
          transmission: (r.transmission === "automatique"
            ? "automatique"
            : "manuelle") as MockVehicle["transmission"],
          fuel: (["diesel", "essence", "hybride", "électrique"].includes(r.fuel)
            ? r.fuel
            : "diesel") as MockVehicle["fuel"],
          seats: r.seats,
          dailyPriceMad: r.daily_price_mad,
          rentalUnit: r.rental_unit === "hour" ? "hour" : "day",
          hourlyPriceMad: r.hourly_price_mad ?? undefined,
          minHours: r.min_hours ?? 1,
          city: r.agencies?.city ?? "Casablanca",
          agency: r.agencies?.legal_name ?? "CarKari",
          rating: 5,
          reviewCount: 0,
          image: img ? urls[0] : PLACEHOLDER,
          images: urls.length ? urls : [PLACEHOLDER],
          tone: "",
        } satisfies MockVehicle;
      });
  } catch {
    return [];
  }
}
