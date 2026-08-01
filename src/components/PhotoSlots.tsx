"use client";

import { useEffect, useState } from "react";
import { compressImage } from "@/lib/images/compress";

export type SlotDef = { key: string; label: string; hint: string };

/** The 5 required angles — same order everywhere so listings look consistent. */
export const ANGLE_SLOTS_FR: SlotDef[] = [
  { key: "front", label: "Avant", hint: "Face avant, voiture entière" },
  { key: "rear", label: "Arrière", hint: "Face arrière, voiture entière" },
  { key: "side_left", label: "Côté gauche", hint: "Profil complet" },
  { key: "side_right", label: "Côté droit", hint: "Profil complet" },
  { key: "interior", label: "Intérieur", hint: "Tableau de bord et sièges" },
];

export const ANGLE_SLOTS_EN: SlotDef[] = [
  { key: "front", label: "Front", hint: "Front view, whole car" },
  { key: "rear", label: "Rear", hint: "Rear view, whole car" },
  { key: "side_left", label: "Left side", hint: "Full profile" },
  { key: "side_right", label: "Right side", hint: "Full profile" },
  { key: "interior", label: "Interior", hint: "Dashboard and seats" },
];

export type PhotoMap = Record<string, File>;

export function PhotoSlots({
  slots,
  value,
  onChange,
  labels,
}: {
  slots: SlotDef[];
  value: PhotoMap;
  onChange: (next: PhotoMap) => void;
  labels: { add: string; replace: string; optimizing: string; savedPct: string };
}) {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState<Record<string, number>>({});

  useEffect(() => {
    return () => Object.values(previews).forEach((u) => URL.revokeObjectURL(u));
  }, [previews]);

  async function pick(key: string, file: File | undefined) {
    if (!file) return;
    setBusy(key);
    const original = file.size;
    const out = await compressImage(file);
    setBusy(null);
    onChange({ ...value, [key]: out });
    setPreviews((p) => ({ ...p, [key]: URL.createObjectURL(out) }));
    setSaved((s) => ({
      ...s,
      [key]: Math.max(0, Math.round((1 - out.size / original) * 100)),
    }));
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {slots.map((s) => {
        const has = Boolean(value[s.key]);
        return (
          <label
            key={s.key}
            className={`relative flex aspect-4/3 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed p-2 text-center transition ${
              has
                ? "border-green-500/40 bg-green-50 dark:bg-green-500/15/40"
                : "border-ink/20 hover:border-accent-400 hover:bg-ink/[0.02]"
            }`}
          >
            {previews[s.key] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previews[s.key]}
                alt={s.label}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <div
              className={`relative z-10 ${previews[s.key] ? "rounded-lg bg-black/55 px-2 py-1 text-white" : ""}`}
            >
              <p className="text-sm font-semibold">
                {s.label} {has ? "✓" : "*"}
              </p>
              {!previews[s.key] && (
                <p className="mt-0.5 text-[11px] leading-tight text-ink/50">
                  {s.hint}
                </p>
              )}
              <p className="mt-1 text-[11px] font-medium">
                {busy === s.key
                  ? labels.optimizing
                  : has
                    ? `${labels.replace}${saved[s.key] ? ` · −${saved[s.key]}%` : ""}`
                    : labels.add}
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(e) => pick(s.key, e.target.files?.[0])}
            />
          </label>
        );
      })}
    </div>
  );
}
