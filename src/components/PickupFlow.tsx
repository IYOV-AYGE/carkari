"use client";

/**
 * Host-side pickup: photograph the customer, CarKari decides, keys released.
 *
 * The host sees a VERDICT and nothing else. They never see the selfie we hold
 * — the comparison happens on our server with the service role, so the
 * agency's session cannot read the customer's KYC material even in principle.
 * That is the promise we make to customers, and it is also more consistent
 * than a tired clerk squinting at two photos at 7am.
 */

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CameraCapture, type CamSlot, type CamLabels } from "@/components/CameraCapture";
import { HandoverForm, type HandoverLabels } from "@/components/HandoverForm";
import { verifyCustomerPhoto } from "@/app/agence/remise/actions";

export type PickupLabels = {
  step1: string;
  step1Hint: string;
  checking: string;
  matched: string;
  notMatched: string;
  notMatchedWhat: string;
  unavailable: string;
  checkFailed: string;
  retry: string;
  fallbackConfirm: string;
  consent: string;
  notVerified: string;
  step2: string;
  step2Hint: string;
  customerSlot: string;
  customerSlotHint: string;
  cam: CamLabels;
  handover: HandoverLabels;
};

type Status = "idle" | "working" | "match" | "no_match" | "unavailable" | "error";

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
  const [status, setStatus] = useState<Status>("idle");
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
    setStatus("working");
    setFallbackOk(false);
    try {
      const supabase = createClient();
      const p = `${bookingId}/customer-${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from("handover-photos")
        .upload(p, file, { contentType: "image/jpeg" });
      if (error) throw error;
      setPath(p);
      const outcome = await verifyCustomerPhoto(bookingId, p);
      setStatus(outcome.status);
    } catch {
      setStatus("error");
    }
  }

  if (!kycVerified) {
    return (
      <p className="rounded-2xl bg-red-50 p-5 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300">
        {t.notVerified}
      </p>
    );
  }

  // Keys may be released on a clean match, or — when our matcher is down —
  // on the host confirming the physical document, which they must check anyway.
  const canProceed =
    status === "match" || ((status === "unavailable" || status === "error") && fallbackOk);

  const verdict: Record<string, { text: string; cls: string }> = {
    working: { text: t.checking, cls: "bg-ink/5 text-ink/70" },
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
    error: {
      text: t.checkFailed,
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

        {status !== "idle" && (
          <p className={`rounded-xl px-4 py-3 text-sm font-semibold ${verdict[status].cls}`}>
            {verdict[status].text}
          </p>
        )}

        {status === "no_match" && (
          <p className="text-sm text-ink/70">{t.notMatchedWhat}</p>
        )}

        {(status === "unavailable" || status === "error") && path && (
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
            identityOk={status === "match" ? true : fallbackOk}
            customerPhotoPath={path}
          />
        )}
      </section>
    </div>
  );
}
