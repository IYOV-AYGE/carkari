"use client";

import { useState } from "react";
import { COMMISSION_RATE } from "@/lib/mock/vehicles";

const PRICES = [250, 400, 600, 1800, 5500];

export type CarcLabels = {
  sub: string; type: string; days: string; perDay: string; total: string;
  deposit: string; balance: string; cta: string;
  cats: [string, string, string, string, string];
};

export function CarculatorWidget({ L }: { L: CarcLabels }) {
  const [cat, setCat] = useState(0);
  const [days, setDays] = useState(3);

  const daily = PRICES[cat];
  const total = daily * days;
  const deposit = Math.ceil(total * COMMISSION_RATE);

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-brand-950/10 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-extrabold text-brand-950">
        Car<span className="text-accent-500">culator</span>
      </h1>
      <p className="mt-1 text-sm text-brand-950/60">
{L.sub}</p>

      <label className="mt-6 block text-sm font-medium text-brand-950">
{L.type}
        <select
          value={cat}
          onChange={(e) => setCat(Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-brand-950/15 px-3 py-2.5"
        >
          {L.cats.map((c, i) => (
            <option key={c} value={i}>{c}</option>
          ))}
        </select>
      </label>

      <label className="mt-4 block text-sm font-medium text-brand-950">
        {L.days} <span className="font-bold">{days}</span>
        <input
          type="range"
          min={1}
          max={30}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="mt-2 w-full accent-[#2278c9]"
        />
      </label>

      <div className="mt-6 space-y-2 rounded-xl bg-brand-50 p-5 text-brand-950">
        <div className="flex justify-between text-sm">
          <span>{L.perDay}</span>
          <span className="font-semibold">{daily.toLocaleString("fr-MA")} MAD</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>{L.total} ({days}j)</span>
          <span className="font-semibold">{total.toLocaleString("fr-MA")} MAD</span>
        </div>
        <div className="flex justify-between border-t border-brand-950/10 pt-2">
          <span className="font-medium">{L.deposit}</span>
          <span className="font-bold text-accent-600">{deposit.toLocaleString("fr-MA")} MAD</span>
        </div>
        <div className="flex justify-between text-sm text-brand-950/60">
          <span>{L.balance}</span>
          <span>{(total - deposit).toLocaleString("fr-MA")} MAD</span>
        </div>
      </div>

      <a
        href="/search"
        className="mt-6 block rounded-xl bg-accent-500 py-3 text-center font-semibold text-white transition hover:bg-accent-400"
      >
{L.cta}</a>
    </div>
  );
}
