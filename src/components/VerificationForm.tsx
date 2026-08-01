"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CameraCapture, type CamSlot, type CamLabels } from "@/components/CameraCapture";
import { LivenessCapture, type LivenessLabels } from "@/components/LivenessCapture";

export type VerifLabels = {
  secWho: string; secIdentity: string; secAddress: string;
  secLicence: string; secDocs: string;
  resident: string; residentHint: string;
  visitor: string; visitorHint: string;
  firstName: string; lastName: string; birthDate: string; nationality: string;
  phone: string; phoneHint: string;
  addressLine: string; addressCity: string; addressPostcode: string;
  addressCountry: string;
  cinNumber: string; passportNumber: string;
  licenceNumber: string; licenceCountry: string; licenceIssued: string;
  docsHint: string; cameraOnly: string; privacy: string;
  idpNote: string;
  secLive: string;
  liveRequired: string;
  cam: CamLabels;
  live: LivenessLabels;
  docLabels: {
    licenceFront: string; licenceBack: string;
    cinFront: string; cinBack: string; passport: string; idp: string;
    selfie: string;
  };
  docHints: {
    licenceFront: string; licenceBack: string;
    cinFront: string; cinBack: string; passport: string; idp: string;
    selfie: string;
  };
  submit: string; sending: string;
  errDocs: string; errAge: string; errLicence: string; errGeneric: string;
};

export function VerificationForm({
  t,
  userId,
  defaults,
}: {
  t: VerifLabels;
  userId: string;
  defaults: { phone: string | null };
}) {
  const router = useRouter();
  const [resident, setResident] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<Record<string, File>>({});
  // The selfie now comes from the liveness run, not a plain snapshot.
  const [live, setLive] = useState<{ passed: boolean; framePaths: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const slots: CamSlot[] = resident
    ? [
        { key: "licence_front", label: t.docLabels.licenceFront, hint: t.docHints.licenceFront, facing: "environment" },
        { key: "licence_back", label: t.docLabels.licenceBack, hint: t.docHints.licenceBack, facing: "environment" },
        { key: "id_front", label: t.docLabels.cinFront, hint: t.docHints.cinFront, facing: "environment" },
        { key: "id_back", label: t.docLabels.cinBack, hint: t.docHints.cinBack, facing: "environment" },
      ]
    : [
        { key: "licence_front", label: t.docLabels.licenceFront, hint: t.docHints.licenceFront, facing: "environment" },
        { key: "licence_back", label: t.docLabels.licenceBack, hint: t.docHints.licenceBack, facing: "environment" },
        { key: "id_front", label: t.docLabels.passport, hint: t.docHints.passport, facing: "environment" },
        { key: "idp", label: t.docLabels.idp, hint: t.docHints.idp, facing: "environment", optional: true },
      ];

  const missing = slots.filter((s) => !s.optional && !photos[s.key]).length;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (resident === null) return;
    if (missing > 0) {
      setError(t.errDocs);
      return;
    }
    if (!live?.framePaths.length) {
      setError(t.liveRequired);
      return;
    }
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();

    try {
      const birth = String(fd.get("birth_date") ?? "");
      if (!birth || (Date.now() - new Date(birth).getTime()) / 31557600000 < 21) {
        setError(t.errAge);
        setBusy(false);
        return;
      }
      const issued = String(fd.get("licence_issued_on") ?? "");
      if (!issued || (Date.now() - new Date(issued).getTime()) / 31557600000 < 1) {
        setError(t.errLicence);
        setBusy(false);
        return;
      }

      const paths: Record<string, string> = {};
      for (const s of slots) {
        const file = photos[s.key];
        if (!file) continue;
        const path = `${userId}/${s.key}-${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("customer-docs")
          .upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        paths[s.key] = path;
      }

      const { error: rpcErr } = await supabase.rpc("submit_verification", {
        p_first_name: String(fd.get("first_name") ?? ""),
        p_last_name: String(fd.get("last_name") ?? ""),
        p_birth_date: birth,
        p_nationality: String(fd.get("nationality") ?? ""),
        p_is_resident: resident,
        p_phone: String(fd.get("phone") ?? ""),
        p_address_line: String(fd.get("address_line") ?? ""),
        p_address_city: String(fd.get("address_city") ?? ""),
        p_address_postcode: String(fd.get("address_postcode") ?? ""),
        p_address_country: String(fd.get("address_country") ?? ""),
        p_id_number: String(fd.get("id_number") ?? ""),
        p_passport_number: String(fd.get("passport_number") ?? ""),
        p_licence_number: String(fd.get("licence_number") ?? ""),
        p_licence_country: String(fd.get("licence_country") ?? ""),
        p_licence_issued_on: issued,
        p_licence_front: paths.licence_front,
        p_licence_back: paths.licence_back,
        p_id_front: paths.id_front,
        p_id_back: paths.id_back ?? null,
        p_idp: paths.idp ?? null,
        p_selfie: live.framePaths[0],
      });
      if (rpcErr) throw rpcErr;
      router.refresh();
    } catch {
      setError(t.errGeneric);
      setBusy(false);
    }
  }

  const input =
    "mt-1 w-full rounded-lg border border-ink/15 px-3 py-2.5 text-ink";
  const label = "block text-sm font-medium text-ink";
  const section = "text-sm font-bold uppercase tracking-wide text-ink/50";

  // Step 0: who are you? Drives which documents we ask for.
  if (resident === null) {
    return (
      <div className="space-y-4">
        <p className={section}>{t.secWho}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setResident(true)}
            className="rounded-2xl border border-ink/15 p-5 text-left transition hover:border-accent-400 hover:shadow"
          >
            <p className="font-bold text-ink">{t.resident}</p>
            <p className="mt-1 text-sm text-ink/65">{t.residentHint}</p>
          </button>
          <button
            type="button"
            onClick={() => setResident(false)}
            className="rounded-2xl border border-ink/15 p-5 text-left transition hover:border-accent-400 hover:shadow"
          >
            <p className="font-bold text-ink">{t.visitor}</p>
            <p className="mt-1 text-sm text-ink/65">{t.visitorHint}</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <button
        type="button"
        onClick={() => {
          setResident(null);
          setPhotos({});
        }}
        className="text-sm font-medium text-accent-600 hover:underline"
      >
        ← {resident ? t.resident : t.visitor}
      </button>

      <div className="space-y-4">
        <p className={section}>{t.secIdentity}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>
            {t.firstName}
            <input name="first_name" required minLength={2} className={input} />
          </label>
          <label className={label}>
            {t.lastName}
            <input name="last_name" required minLength={2} className={input} />
          </label>
          <label className={label}>
            {t.birthDate}
            <input name="birth_date" type="date" required className={input} />
          </label>
          <label className={label}>
            {t.nationality}
            <input name="nationality" required className={input} />
          </label>
          <label className={label}>
            {t.phone}
            <input
              name="phone"
              type="tel"
              required
              defaultValue={defaults.phone ?? ""}
              className={input}
              placeholder="+212 6…"
            />
            <span className="mt-1 block text-xs font-normal text-ink/50">
              {t.phoneHint}
            </span>
          </label>
          {resident ? (
            <label className={label}>
              {t.cinNumber}
              <input name="id_number" required className={input} />
            </label>
          ) : (
            <label className={label}>
              {t.passportNumber}
              <input name="passport_number" required className={input} />
            </label>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <p className={section}>{t.secAddress}</p>
        <label className={label}>
          {t.addressLine}
          <input name="address_line" required className={input} />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className={label}>
            {t.addressCity}
            <input name="address_city" required className={input} />
          </label>
          <label className={label}>
            {t.addressPostcode}
            <input name="address_postcode" className={input} />
          </label>
          <label className={label}>
            {t.addressCountry}
            <input
              name="address_country"
              required
              defaultValue={resident ? "Maroc" : ""}
              className={input}
            />
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <p className={section}>{t.secLicence}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className={label}>
            {t.licenceNumber}
            <input name="licence_number" required className={input} />
          </label>
          <label className={label}>
            {t.licenceCountry}
            <input
              name="licence_country"
              required
              defaultValue={resident ? "MA" : ""}
              className={input}
            />
          </label>
          <label className={label}>
            {t.licenceIssued}
            <input name="licence_issued_on" type="date" required className={input} />
          </label>
        </div>
        {!resident && (
          <p className="rounded-lg bg-accent-500/[0.08] px-3 py-2 text-xs text-ink/70">
            {t.idpNote}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <p className={section}>{t.secDocs}</p>
        <p className="text-xs text-ink/55">{t.docsHint}</p>
        <p className="rounded-lg bg-amber-50 dark:bg-amber-400/15 px-3 py-2 text-xs font-medium text-amber-900 dark:text-amber-100">
          {t.cameraOnly}
        </p>
        <CameraCapture slots={slots} value={photos} onChange={setPhotos} t={t.cam} />
        <p className="rounded-lg bg-ink/[0.04] px-3 py-2 text-xs text-ink/60">
          {t.privacy}
        </p>
      </div>

      <div className="space-y-3">
        <p className={section}>{t.secLive}</p>
        <LivenessCapture t={t.live} userId={userId} onDone={setLive} />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-500/15 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error}</p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-accent-500 py-3 font-semibold text-white transition hover:bg-accent-400 disabled:opacity-60"
      >
        {busy ? t.sending : t.submit}
      </button>
    </form>
  );
}
