"use client";

// Live-camera capture. Deliberately NO file input: documents must be
// photographed on the spot, which blocks recycled scans and screenshots of
// someone else's papers. Uses getUserMedia so it works on phones and laptops.

import { useCallback, useEffect, useRef, useState } from "react";
import { compressDocument } from "@/lib/images/compress";

export type CamSlot = {
  key: string;
  label: string;
  hint: string;
  /** "environment" = rear camera (documents), "user" = front (selfie) */
  facing: "environment" | "user";
  optional?: boolean;
};

export type CamLabels = {
  take: string; retake: string; capture: string; cancel: string;
  optional: string; denied: string; unsupported: string;
  guide: string; guideSelfie: string;
};

export function CameraCapture({
  slots,
  value,
  onChange,
  t,
}: {
  slots: CamSlot[];
  value: Record<string, File>;
  onChange: (next: Record<string, File>) => void;
  t: CamLabels;
}) {
  const [active, setActive] = useState<CamSlot | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stop(), [stop]);

  async function open(slot: CamSlot) {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(t.unsupported);
      return;
    }
    setActive(slot);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: slot.facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch {
      setError(t.denied);
      setActive(null);
      stop();
    }
  }

  function close() {
    stop();
    setActive(null);
  }

  async function shoot() {
    const video = videoRef.current;
    const slot = active;
    if (!video || !slot) return;
    setBusy(true);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setBusy(false);
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", 0.92)
    );
    if (blob) {
      const raw = new File([blob], `${slot.key}.jpg`, { type: "image/jpeg" });
      const file = await compressDocument(raw);
      onChange({ ...value, [slot.key]: file });
      setPreviews((p) => ({ ...p, [slot.key]: URL.createObjectURL(file) }));
    }
    setBusy(false);
    close();
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {slots.map((s) => {
          const has = Boolean(value[s.key]);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => open(s)}
              className={`relative flex aspect-4/3 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed p-2 text-center transition ${
                has
                  ? "border-green-500/40 bg-green-50 dark:bg-green-500/15/40"
                  : "border-ink/20 hover:border-accent-400 hover:bg-ink/[0.02]"
              }`}
            >
              {previews[s.key] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previews[s.key]}
                  alt={s.label}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <div
                className={`relative z-10 ${previews[s.key] ? "rounded-lg bg-black/55 px-2 py-1 text-white" : ""}`}
              >
                <p className="text-sm font-semibold">
                  {s.label} {has ? "✓" : s.optional ? "" : "*"}
                </p>
                {!previews[s.key] && (
                  <p className="mt-0.5 text-[11px] leading-tight text-ink/50">
                    {s.hint}
                    {s.optional ? ` · ${t.optional}` : ""}
                  </p>
                )}
                <p className="mt-1 text-[11px] font-medium">
                  {has ? t.retake : t.take}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 dark:bg-red-500/15 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      {active && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black">
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm font-medium">{active.label}</span>
            <button
              type="button"
              onClick={close}
              className="rounded-full px-3 py-1 text-sm hover:bg-card/10"
            >
              {t.cancel}
            </button>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`h-full w-full object-cover ${active.facing === "user" ? "scale-x-[-1]" : ""}`}
            />
            {/* framing guide */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
              <div
                className={`rounded-2xl border-2 border-white/70 ${active.facing === "user" ? "aspect-3/4 h-3/5" : "aspect-3/2 w-full max-w-md"}`}
              />
            </div>
            <p className="pointer-events-none absolute bottom-4 left-0 right-0 px-6 text-center text-sm text-white/90">
              {active.facing === "user" ? t.guideSelfie : t.guide}
            </p>
          </div>

          <div className="flex items-center justify-center py-6">
            <button
              type="button"
              onClick={shoot}
              disabled={busy}
              aria-label={t.capture}
              className="h-16 w-16 rounded-full border-4 border-white bg-card/20 transition active:scale-95 disabled:opacity-50"
            />
          </div>
        </div>
      )}
    </>
  );
}
