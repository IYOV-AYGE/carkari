import Link from "next/link";
import Image from "next/image";
import { formatMad, type MockVehicle } from "@/lib/mock/vehicles";
import { VerifiedBadge } from "@/components/badges";
import { getDict } from "@/lib/i18n/server";

export async function VehicleCard({ v }: { v: MockVehicle }) {
  const t = await getDict();
  return (
    <Link
      href={`/vehicles/${v.id}`}
      className="group overflow-hidden rounded-2xl border border-ink/10 bg-card transition hover:-translate-y-0.5 hover:shadow-lg"
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
        <div className="flex items-center justify-between text-sm text-ink/70">
          <span className="flex items-center gap-1.5">
            {v.city} · {v.agency} <VerifiedBadge small />
          </span>
          <span className="font-medium text-ink">
            ★ {v.rating} <span className="text-ink/50">({v.reviewCount})</span>
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs text-ink/70">
          <span className="rounded-full bg-ink/5 px-2 py-0.5">{v.year}</span>
          <span className="rounded-full bg-ink/5 px-2 py-0.5">{v.transmission}</span>
          <span className="rounded-full bg-ink/5 px-2 py-0.5">{v.fuel}</span>
          <span className="rounded-full bg-ink/5 px-2 py-0.5">{v.seats} {t.card.seats}</span>
        </div>
        <p className="pt-1 text-ink">
          <span className="text-lg font-bold">{formatMad(v.dailyPriceMad)}</span>
          <span className="text-sm text-ink/60"> {t.card.perDay}</span>
        </p>
      </div>
    </Link>
  );
}

/** Compact card for Turo-style homepage rows. */
export async function VehicleCardCompact({ v }: { v: MockVehicle }) {
  const t = await getDict();
  return (
    <Link
      href={`/vehicles/${v.id}`}
      className="group overflow-hidden rounded-xl border border-ink/10 bg-card transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-32 overflow-hidden">
        <Image
          src={v.image}
          alt={`${v.make} ${v.model}`}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-3">
        <p className="truncate font-semibold text-ink">{v.make} {v.model}</p>
        <p className="mt-0.5 text-xs text-ink/60">
          {v.year} · ★ {v.rating} ({v.reviewCount})
        </p>
        <p className="mt-1 text-sm text-ink">
          <span className="font-bold">{formatMad(v.dailyPriceMad)}</span>
          <span className="text-ink/60"> {t.card.perDay}</span>
        </p>
      </div>
    </Link>
  );
}
