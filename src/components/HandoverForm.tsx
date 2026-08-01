"use client";

/**
 * Condition record for a pickup or a return.
 *
 * Same five angles every time, deliberately: a before/after pair only proves
 * anything if the viewpoints match. Photos are camera-only (no gallery), so a
 * dent cannot be hidden behind a picture taken last week.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CameraCapture, type CamSlot, type CamLabels } from "@/components/CameraCapture";

export type HandoverLabels = {
  angles: { front: string; rear: string; left: string; right: string; interior: string };
  angleHints: { front: string; rear: string; left: string; right: string; interior: string };
  odometer: string;
  fuel: string;
  fuelHint: string;
  notes: string;
  notesHint: string;
  submitPickup: string;
  submitReturn: string;
  sending: string;
  errPhotos: string;
  errGeneric: string;
  cam: CamLabels;
};

const ANGLES = ["front", "rear", "left", "right", "interior"] as const;

export function HandoverForm({
  t,
  bookingId,
  kind,
  /** pickup only: the agency must tick identity before this becomes usable */
  identityOk = true,
  customerPhotoPath = null,
  onDone,
}: {
  t: HandoverLabels;
  bookingId: string;
  kind: "pickup" | "return";
  identityOk?: boolean;
  customerPhotoPath?: string | null;
  onDone?: (message: string) => void;
}) {
  const router = useRouter();
  const [photos, setPhotos] = useState<Record<string, File>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const slots: CamSlot[] = ANGLES.map((a) => ({
    key: a,
    label: t.angles[a],
    hint: t.angleHints[a],
    facing: "environment",
  }));

  const missing = slots.filter((s) => !photos[s.key]).length;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (missing > 0) {
      setError(t.errPhotos);
      return;
    }
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();

    try {
      const paths: string[] = [];
      for (const a of ANGLES) {
        // Path starts with the booking id — storage RLS reads that first
        // segment to decide who may look at the photo.
        const path = `${bookingId}/${kind}-${a}-${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("handover-photos")
          .upload(path, photos[a], { contentType: "image/jpeg" });
        if (upErr) throw upErr;
        paths.push(path);
      }

      const odo = fd.get("odometer");
      const fuel = fd.get("fuel");
      const { data, error: rpcErr } = await supabase.rpc("record_handover", {
        p_booking: bookingId,
        p_kind: kind,
        p_photos: paths,
        p_odometer: odo ? Number(odo) : null,
        p_fuel: fuel ? Number(fuel) : null,
        p_customer_photo: customerPhotoPath,
        p_identity_ok: kind === "pickup" ? identityOk : null,
        p_notes: String(fd.get("notes") ?? "") || null,
      });
      if (rpcErr) throw rpcErr;

      const row = data?.[0] as { ok: boolean; message: string };
      if (!row?.ok) {
        setError(row?.message ?? t.errGeneric);
        setBusy(false);
        return;
      }
      onDone?.(row.message);
      router.refresh();
    } catch {
      setError(t.errGeneric);
      setBusy(false);
    }
  }

  const input =
    "mt-1 w-full rounded-lg border border-ink/15 px-3 py-2.5 text-ink";

  return (
    <form onSubmit={submit} className="space-y-5">
      <CameraCapture slots={slots} value={photos} onChange={setPhotos} t={t.cam} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-ink">
          {t.odometer}
          <input name="odometer" type="number" min={0} className={input} />
        </label>
        <label className="block text-sm font-medium text-ink">
          {t.fuel}
          <select name="fuel" defaultValue="" className={input}>
            <option value="">—</option>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n}/8
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs font-normal text-ink/50">
            {t.fuelHint}
          </span>
        </label>
      </div>

      <label className="block text-sm font-medium text-ink">
        {t.notes}
        <textarea name="notes" rows={2} className={input} placeholder={t.notesHint} />
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !identityOk}
        className="w-full rounded-xl bg-accent-500 py-3 font-semibold text-white transition hover:bg-accent-400 disabled:opacity-50"
      >
        {busy ? t.sending : kind === "pickup" ? t.submitPickup : t.submitReturn}
      </button>
    </form>
  );
}
