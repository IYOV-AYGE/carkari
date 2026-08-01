"use client";

/**
 * Host-side pickup: identity check, then the condition record.
 *
 * The comparison is done by a human on purpose. The host is standing in front
 * of the customer holding their actual passport — a better judge than any
 * similarity score — and it keeps us out of GDPR Article 9 automated biometric
 * processing. Both photos are stored, so the match can be automated later
 * without changing anything the host does.
 */

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { CameraCapture, type CamSlot, type CamLabels } from "@/components/CameraCapture";
import { HandoverForm, type HandoverLabels } from "@/components/HandoverForm";

export type PickupLabels = {
  step1: string;
  step1Hint: string;
  onFile: string;
  justTaken: string;
  consent: string;
  confirmSame: string;
  mismatch: string;
  notVerified: string;
  step2: string;
  step2Hint: string;
  uploading: string;
  customerSlot: string;
  customerSlotHint: string;
  cam: CamLabels;
  handover: HandoverLabels;
};

export function PickupFlow({
  t,
  bookingId,
  selfieUrl,
  kycVerified,
}: {
  t: PickupLabels;
  bookingId: string;
  /** short-lived signed URL of the verified selfie, or null */
  selfieUrl: string | null;
  kycVerified: boolean;
}) {
  const [shot, setShot] = useState<Record<string, File>>({});
  const [preview, setPreview] = useState<string | null>(null);
  const [path, setPath] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

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
    setPreview(URL.createObjectURL(file));
    setBusy(true);
    try {
      const supabase = createClient();
      const p = `${bookingId}/customer-${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from("handover-photos")
        .upload(p, file, { contentType: "image/jpeg" });
      if (!error) setPath(p);
    } finally {
      setBusy(false);
    }
  }

  if (!kycVerified) {
    return (
      <p className="rounded-2xl bg-red-50 p-5 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300">
        {t.notVerified}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm font-bold uppercase tracking-wide text-ink/50">
          {t.step1}
        </p>
        <p className="text-sm text-ink/65">{t.step1Hint}</p>

        <CameraCapture slots={slot} value={shot} onChange={onShot} t={t.cam} />

        {(preview || selfieUrl) && (
          <div className="grid grid-cols-2 gap-3">
            <figure className="space-y-1">
              <figcaption className="text-xs font-medium text-ink/55">
                {t.onFile}
              </figcaption>
              <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-ink/5">
                {selfieUrl && (
                  <Image
                    src={selfieUrl}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                  />
                )}
              </div>
            </figure>
            <figure className="space-y-1">
              <figcaption className="text-xs font-medium text-ink/55">
                {t.justTaken}
              </figcaption>
              <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-ink/5">
                {preview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                )}
              </div>
            </figure>
          </div>
        )}

        <p className="rounded-lg bg-ink/[0.04] px-3 py-2 text-xs text-ink/60">
          {t.consent}
        </p>

        <label className="flex items-start gap-3 rounded-xl border border-ink/15 p-4">
          <input
            type="checkbox"
            checked={confirmed}
            disabled={!path || busy}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm font-medium text-ink">
            {busy ? t.uploading : t.confirmSame}
          </span>
        </label>

        <p className="text-xs text-ink/55">{t.mismatch}</p>
      </section>

      <section className={confirmed ? "space-y-3" : "space-y-3 opacity-40"}>
        <p className="text-sm font-bold uppercase tracking-wide text-ink/50">
          {t.step2}
        </p>
        <p className="text-sm text-ink/65">{t.step2Hint}</p>
        {confirmed && path && (
          <HandoverForm
            t={t.handover}
            bookingId={bookingId}
            kind="pickup"
            identityOk={confirmed}
            customerPhotoPath={path}
          />
        )}
      </section>
    </div>
  );
}
