"use client";

/**
 * Host-side pickup.
 *
 * The host photographs the customer and gets an immediate verdict, because the
 * decision "do I hand over these keys" has to be made in three seconds at a
 * counter. What they never get is the customer's photo or documents: the
 * device receives a face DESCRIPTOR (128 numbers, not reconstructable into a
 * portrait) and does the comparison locally.
 *
 * Two verdicts with two different jobs:
 *   device  — decides whether the keys move, now
 *   CarKari — decides whether the rental gets flagged, from the stored photo,
 *             because a browser check can be tampered with
 */

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CameraCapture, type CamSlot, type CamLabels } from "@/components/CameraCapture";
import { HandoverForm, type HandoverLabels } from "@/components/HandoverForm";
import { compareToStored, type DeviceVerdict } from "@/lib/identity/descriptor";

export type PickupLabels = {
  step1: string;
  step1Hint: string;
  checking: string;
  matched: string;
  notMatched: string;
  notMatchedWhat: string;
  unavailable: string;
  failed: string;
  fallbackConfirm: string;
  privacy: string;
  consent: string;
  notVerified: string;
  step2: string;
  step2Hint: string;
  customerSlot: string;
  customerSlotHint: string;
  cam: CamLabels;
  handover: HandoverLabels;
};

type State = "idle" | "checking" | DeviceVerdict | "failed";

export function PickupFlow({
  t,
  bookingId,
  kycVerified,
}: {
  t: PickupLabels;
  bookingId: string;
  kycVerified: boolean;
}) {
  const [shot, setShot] = useState<Record<string, File>>({});
  const [state, setState] = useState<State>("idle");
  const [path, setPath] = useState<string | null>(null);
  const [fallbackOk, setFallbackOk] = useState(false);

  const slot: CamSlot[] = [
    {
      key: "customer",
      label: t.customerSlot,
      hint: t.customerSlotHint,
      facing: "environment", // the host photographs the person opposite them
    },
  ];

  async function onShot(next: Record<string, File>) {
    setShot(next);
    const file = next.customer;
    if (!file) return;
    setState("checking");
    setFallbackOk(false);
    try {
      const supabase = createClient();

      // Numbers only. The stored photograph stays inside CarKari.
      const { data: stored } = await supabase.rpc("booking_face_descriptor", {
        p_booking: bookingId,
      });
      const result = await compareToStored(file, (stored as number[] | null) ?? null);

      const p = `${bookingId}/customer-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("handover-photos")
        .upload(p, file, { contentType: "image/jpeg" });
      if (upErr) throw upErr;

      const { error: rpcErr } = await supabase.rpc("capture_counter_photo", {
        p_booking: bookingId,
        p_photo: p,
        p_device_verdict: result.verdict,
        p_distance: result.distance,
      });
      if (rpcErr) throw rpcErr;

      setPath(p);
      setState(result.verdict);
    } catch {
      setState("failed");
    }
  }

  if (!kycVerified) {
    return (
      <p className="rounded-2xl bg-red-50 p-5 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300">
        {t.notVerified}
      </p>
    );
  }

  const canProceed = state === "match" || (state === "unavailable" && fallbackOk);

  const box: Record<string, { text: string; cls: string }> = {
    checking: { text: t.checking, cls: "bg-ink/5 text-ink/70" },
    match: {
      text: t.matched,
      cls: "bg-green-50 text-green-800 dark:bg-green-500/15 dark:text-green-300",
    },
    no_match: {
      text: t.notMatched,
      cls: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    },
    unavailable: {
      text: t.unavailable,
      cls: "bg-amber-50 text-amber-900 dark:bg-amber-400/15 dark:text-amber-100",
    },
    failed: {
      text: t.failed,
      cls: "bg-amber-50 text-amber-900 dark:bg-amber-400/15 dark:text-amber-100",
    },
  };

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm font-bold uppercase tracking-wide text-ink/50">
          {t.step1}
        </p>
        <p className="text-sm text-ink/65">{t.step1Hint}</p>

        <CameraCapture slots={slot} value={shot} onChange={onShot} t={t.cam} />

        {state !== "idle" && (
          <p className={`rounded-xl px-4 py-3 text-sm font-semibold ${box[state].cls}`}>
            {box[state].text}
          </p>
        )}

        {state === "no_match" && (
          <p className="text-sm text-ink/70">{t.notMatchedWhat}</p>
        )}

        {state === "unavailable" && path && (
          <label className="flex items-start gap-3 rounded-xl border border-ink/15 p-4">
            <input
              type="checkbox"
              checked={fallbackOk}
              onChange={(e) => setFallbackOk(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm font-medium text-ink">{t.fallbackConfirm}</span>
          </label>
        )}

        <p className="rounded-lg bg-ink/[0.04] px-3 py-2 text-xs text-ink/60">
          {t.privacy}
        </p>
        <p className="rounded-lg bg-ink/[0.04] px-3 py-2 text-xs text-ink/60">
          {t.consent}
        </p>
      </section>

      <section className={canProceed ? "space-y-3" : "space-y-3 opacity-40"}>
        <p className="text-sm font-bold uppercase tracking-wide text-ink/50">
          {t.step2}
        </p>
        <p className="text-sm text-ink/65">{t.step2Hint}</p>
        {canProceed && path && (
          <HandoverForm
            t={t.handover}
            bookingId={bookingId}
            kind="pickup"
            identityOk={state === "match" ? true : fallbackOk}
            customerPhotoPath={path}
          />
        )}
      </section>
    </div>
  );
}
