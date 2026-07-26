import Link from "next/link";
import { formatMad, type MockVehicle } from "@/lib/mock/vehicles";

export function VehicleCard({ v }: { v: MockVehicle }) {
  return (
    <Link
      href={`/vehicles/${v.id}`}
      className="group overflow-hidden rounded-2xl border border-emerald-950/10 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div
        className={`flex h-40 items-end bg-gradient-to-br p-4 ${v.tone}`}
        aria-hidden
      >
        <span className="text-lg font-bold text-white/95 drop-shadow">
          {v.make} {v.model}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between text-sm text-emerald-950/70">
          <span>{v.city} · {v.agency}</span>
          <span className="font-medium text-emerald-950">
            ★ {v.rating} <span className="text-emerald-950/50">({v.reviewCount})</span>
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs text-emerald-950/70">
          <span className="rounded-full bg-emerald-950/5 px-2 py-0.5">{v.year}</span>
          <span className="rounded-full bg-emerald-950/5 px-2 py-0.5">{v.transmission}</span>
          <span className="rounded-full bg-emerald-950/5 px-2 py-0.5">{v.fuel}</span>
          <span className="rounded-full bg-emerald-950/5 px-2 py-0.5">{v.seats} places</span>
        </div>
        <p className="pt-1 text-emerald-950">
          <span className="text-lg font-bold">{formatMad(v.dailyPriceMad)}</span>
          <span className="text-sm text-emerald-950/60"> / jour</span>
        </p>
      </div>
    </Link>
  );
}
