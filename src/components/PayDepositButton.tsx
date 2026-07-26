"use client";

import { useState } from "react";

export function PayDepositButton({
  bookingId,
  label,
}: {
  bookingId: string;
  label: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
        return;
      }
      setError(json.error ?? "Payment unavailable");
    } catch {
      setError("Payment unavailable");
    }
    setBusy(false);
  }

  return (
    <>
      <button
        onClick={pay}
        disabled={busy}
        className="w-full rounded-xl bg-accent-500 py-3 font-semibold text-white transition hover:bg-accent-400 disabled:opacity-60"
      >
        {busy ? "…" : label}
      </button>
      {error && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-center text-sm text-amber-800">
          {error}
        </p>
      )}
    </>
  );
}
