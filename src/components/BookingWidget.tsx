"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type BookingLabels = {
  perDay: string; perHour: string; from: string; to: string;
  days: string; hours: string; startTime: string; duration: string;
  total: string; deposit: string; balance: string;
  policyTitle: string; policyLines: string[];
  accept: string; book: string; booking: string;
  loginFirst: string; unavailable: string; pickDates: string;
  errGeneric: string; mockNote: string;
  freeCancel: string; noRefund: string;
};

type Quote = {
  days?: number;
  hours?: number;
  total_mad: number;
  deposit_mad: number;
  balance_mad: number;
  available: boolean;
};

const fmt = (c: number) =>
  `${(c / 100).toLocaleString("fr-MA", { maximumFractionDigits: 0 })} MAD`;

export function BookingWidget({
  t,
  vehicleId,
  dailyPriceMad,
  commissionRate,
  isMock,
  signedIn,
  rentalUnit = "day",
  hourlyPriceMad,
  minHours = 1,
}: {
  t: BookingLabels;
  vehicleId: string;
  dailyPriceMad: number;
  /** "hour" for quads and jet skis — changes the picker AND the RPCs used. */
  rentalUnit?: "day" | "hour";
  hourlyPriceMad?: number;
  minHours?: number;
  commissionRate: number;
  isMock: boolean;
  signedIn: boolean;
}) {
  const router = useRouter();
  const byHour = rentalUnit === "hour";
  const unitPrice = byHour ? (hourlyPriceMad ?? dailyPriceMad) : dailyPriceMad;
  const today = new Date().toISOString().slice(0, 10);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  // Hourly rentals: a start clock time plus a duration, instead of two dates.
  const [time, setTime] = useState("10:00");
  const [hours, setHours] = useState(String(Math.max(minHours, 1)));
  const [quote, setQuote] = useState<Quote | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Local estimate for instant feedback; the server quote overrides it.
  const localDays =
    start && end
      ? Math.max(
          0,
          Math.round(
            (new Date(end).getTime() - new Date(start).getTime()) / 86400000
          )
        )
      : 0;

  useEffect(() => {
    if (isMock) { setQuote(null); return; }
    if (byHour ? !start : !start || !end || localDays < 1) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = byHour
        ? await supabase.rpc("quote_booking_hours", {
            p_vehicle: vehicleId,
            p_start: new Date(`${start}T${time}`).toISOString(),
            p_hours: Number(hours),
          })
        : await supabase.rpc("quote_booking", {
            p_vehicle: vehicleId,
            p_start: start,
            p_end: end,
          });
      if (!cancelled) setQuote((data?.[0] as Quote) ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [vehicleId, start, end, time, hours, localDays, isMock, byHour]);

  const units = byHour
    ? (quote?.hours ?? Number(hours))
    : (quote?.days ?? localDays);
  const days = units; // keeps the existing render happy for day rentals
  const total = quote?.total_mad ?? unitPrice * units;
  const deposit = quote?.deposit_mad ?? Math.ceil(total * commissionRate);
  const balance = quote?.balance_mad ?? total - deposit;

  // Mirrors SPEC.md §2 so the customer knows before paying.
  const pickupAt = start
    ? new Date(byHour ? `${start}T${time}` : start).getTime()
    : 0;
  const pickupSoon = Boolean(start) && pickupAt - Date.now() <= 48 * 3600_000;

  async function book() {
    if (!signedIn) {
      // Come back to this exact car after signing in, dates still in the URL.
      const back = `${window.location.pathname}${window.location.search}`;
      router.push(`/auth?next=${encodeURIComponent(back)}`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const { data, error: rpcErr } = byHour
        ? await supabase.rpc("create_booking_hours", {
            p_vehicle: vehicleId,
            p_start: new Date(`${start}T${time}`).toISOString(),
            p_hours: Number(hours),
            p_policy_accepted: true,
          })
        : await supabase.rpc("create_booking", {
            p_vehicle: vehicleId,
            p_start: start,
            p_end: end,
            p_policy_accepted: true,
          });
      if (rpcErr || !data) throw rpcErr ?? new Error("failed");
      router.push(`/reservation/${data}`);
    } catch {
      setError(t.errGeneric);
      setBusy(false);
    }
  }

  const canBook =
    !isMock &&
    units >= (byHour ? Math.max(minHours, 1) : 1) &&
    accepted &&
    (quote?.available ?? false) &&
    !busy;

  const input =
    "mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink";

  return (
    <aside className="h-fit rounded-2xl border border-ink/10 p-6 shadow-sm lg:sticky lg:top-24">
      <p className="text-ink">
        <span className="text-3xl font-extrabold">{fmt(unitPrice)}</span>
        <span className="text-ink/60"> {byHour ? t.perHour : t.perDay}</span>
      </p>

      {byHour ? (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <label className="text-sm font-medium text-ink">
            {t.from}
            <input
              type="date"
              min={today}
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className={input}
            />
          </label>
          <label className="text-sm font-medium text-ink">
            {t.startTime}
            <input
              type="time"
              step={1800}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={input}
            />
          </label>
          <label className="text-sm font-medium text-ink">
            {t.duration}
            <select
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className={input}
            >
              {[1, 2, 3, 4, 6, 8].
                filter((h) => h >= Math.max(minHours, 1)).
                map((h) => (
                  <option key={h} value={h}>{h} h</option>
                ))}
            </select>
          </label>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="text-sm font-medium text-ink">
            {t.from}
            <input
              type="date"
              min={today}
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className={input}
            />
          </label>
          <label className="text-sm font-medium text-ink">
            {t.to}
            <input
              type="date"
              min={start || today}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className={input}
            />
          </label>
        </div>
      )}

      {units >= 1 ? (
        <div className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-sm text-ink/80">
          <div className="flex justify-between">
            <span>
              {(byHour ? t.hours : t.days).replace("{n}", String(units))}
            </span>
            <span className="font-semibold">{fmt(total)}</span>
          </div>
          <div className="flex justify-between text-ink">
            <span className="font-medium">{t.deposit}</span>
            <span className="font-bold text-accent-600">{fmt(deposit)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t.balance}</span>
            <span className="font-semibold">{fmt(balance)}</span>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink/50">{t.pickDates}</p>
      )}

      {quote && !quote.available && (
        <p className="mt-3 rounded-lg bg-red-50 dark:bg-red-500/15 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {t.unavailable}
        </p>
      )}

      {units >= 1 && (
        <div className="mt-4 rounded-xl bg-ink/[0.04] p-3 text-xs text-ink/70">
          <p className="font-semibold text-ink">{t.policyTitle}</p>
          <p className="mt-1">{pickupSoon ? t.noRefund : t.freeCancel}</p>
        </div>
      )}

      {!isMock && (
        <label className="mt-4 flex items-start gap-2 text-xs text-ink/70">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5"
          />
          <span>{t.accept}</span>
        </label>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 dark:bg-red-500/15 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      <button
        onClick={book}
        disabled={isMock || !canBook}
        className="mt-4 w-full rounded-xl bg-accent-500 py-3 font-semibold text-white transition hover:bg-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? t.booking : signedIn ? t.book : t.loginFirst}
      </button>

      {isMock && (
        <p className="mt-3 text-center text-xs text-ink/50">{t.mockNote}</p>
      )}
    </aside>
  );
}
