import Link from "next/link";
import Image from "next/image";
import { formatMad, type MockVehicle } from "@/lib/mock/vehicles";

export function VehicleCard({ v }: { v: MockVehicle }) {
  return (
    <Link
      href={`/vehicles/${v.id}`}
      className="group overflow-hidden rounded-2xl border border-brand-950/10 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative h-44 overflow-hidden">
        <Image
          src={v.image}
          alt={`${v.make} ${v.model}`}
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        <span className="absolute bottom-2 left-3 rounded-md bg-black/50 px-2 py-0.5 text-sm font-semibold text-white">
          {v.make} {v.model}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between text-sm text-brand-950/70">
          <span>{v.city} · {v.agency}</span>
          <span className="font-medium text-brand-950">
            ★ {v.rating} <span className="text-brand-950/50">({v.reviewCount})</span>
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs text-brand-950/70">
          <span className="rounded-full bg-brand-950/5 px-2 py-0.5">{v.year}</span>
          <span className="rounded-full bg-brand-950/5 px-2 py-0.5">{v.transmission}</span>
          <span className="rounded-full bg-brand-950/5 px-2 py-0.5">{v.fuel}</span>
          <span className="rounded-full bg-brand-950/5 px-2 py-0.5">{v.seats} places</span>
        </div>
        <p className="pt-1 text-brand-950">
          <span className="text-lg font-bold">{formatMad(v.dailyPriceMad)}</span>
          <span className="text-sm text-brand-950/60"> / jour</span>
        </p>
      </div>
    </Link>
  );
}
