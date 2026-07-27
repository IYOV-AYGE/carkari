"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { compressDocument } from "@/lib/images/compress";
import { PhotoSlots, type SlotDef, type PhotoMap } from "@/components/PhotoSlots";

export type VerifLabels = {
  step1: string; step2: string; step3: string;
  firstName: string; lastName: string; birthDate: string; nationality: string;
  phone: string; idNumber: string;
  licenceNumber: string; licenceCountry: string; licenceIssued: string;
  docsHint: string; privacy: string;
  slots: { add: string; replace: string; optimizing: string; savedPct: string };
  docLabels: { licenceFront: string; licenceBack: string; idFront: string; idBack: string; selfie: string };
  docHints: { licenceFront: string; licenceBack: string; idFront: string; idBack: string; selfie: string };
  submit: string; sending: string;
  errDocs: string; errAge: string; errLicence: string; errGeneric: string;
  whatsappTitle: string; whatsappBody: string; whatsappBtn: string;
  yourCode: string;
};

export function VerificationForm({
  t,
  userId,
  phoneCode,
  whatsappNumber,
  defaults,
}: {
  t: VerifLabels;
  userId: string;
  phoneCode: string;
  whatsappNumber: string;
  defaults: { phone: string | null };
}) {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoMap>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const slots: SlotDef[] = [
    { key: "licence_front", label: t.docLabels.licenceFront, hint: t.docHints.licenceFront },
    { key: "licence_back", label: t.docLabels.licenceBack, hint: t.docHints.licenceBack },
    { key: "id_front", label: t.docLabels.idFront, hint: t.docHints.idFront },
    { key: "id_back", label: t.docLabels.idBack, hint: t.docHints.idBack },
    { key: "selfie", label: t.docLabels.selfie, hint: t.docHints.selfie },
  ];
  const missing = slots.filter((s) => !photos[s.key]).length;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (missing > 0) {
      setError(t.errDocs);
      return;
    }
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();

    try {
      const birth = String(fd.get("birth_date") ?? "");
      const years = (Date.now() - new Date(birth).getTime()) / 31557600000;
      if (!birth || years < 21) {
        setError(t.errAge);
        setBusy(false);
        return;
      }
      const issued = String(fd.get("licence_issued_on") ?? "");
      const heldYears = (Date.now() - new Date(issued).getTime()) / 31557600000;
      if (!issued || heldYears < 1) {
        setError(t.errLicence);
        setBusy(false);
        return;
      }

      // Documents are compressed client-side, then stored privately.
      const paths: Record<string, string> = {};
      for (const s of slots) {
        const file = await compressDocument(photos[s.key]);
        const path = `${userId}/${s.key}-${Date.now()}.${file.name.split(".").pop()}`;
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
        p_phone: String(fd.get("phone") ?? ""),
        p_id_number: String(fd.get("id_number") ?? ""),
        p_licence_number: String(fd.get("licence_number") ?? ""),
        p_licence_country: String(fd.get("licence_country") ?? ""),
        p_licence_issued_on: issued,
        p_licence_front: paths.licence_front,
        p_licence_back: paths.licence_back,
        p_id_front: paths.id_front,
        p_id_back: paths.id_back,
        p_selfie: paths.selfie,
      });
      if (rpcErr) throw rpcErr;
      router.refresh();
    } catch {
      setError(t.errGeneric);
      setBusy(false);
    }
  }

  const input =
    "mt-1 w-full rounded-lg border border-brand-950/15 px-3 py-2.5 text-brand-950";
  const label = "block text-sm font-medium text-brand-950";
  const section = "text-sm font-bold uppercase tracking-wide text-brand-950/50";

  const waText = encodeURIComponent(
    `${t.whatsappBody} ${phoneCode}`
  );

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="space-y-4">
        <p className={section}>{t.step1}</p>
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
            <input name="nationality" required className={input} placeholder="Maroc / France…" />
          </label>
          <label className={label}>
            {t.phone}
            <input
              name="phone"
              type="tel"
              required
              defaultValue={defaults.phone ?? ""}
              className={input}
            />
          </label>
          <label className={label}>
            {t.idNumber}
            <input name="id_number" required className={input} />
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <p className={section}>{t.step2}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className={label}>
            {t.licenceNumber}
            <input name="licence_number" required className={input} />
          </label>
          <label className={label}>
            {t.licenceCountry}
            <input name="licence_country" required className={input} placeholder="MA" />
          </label>
          <label className={label}>
            {t.licenceIssued}
            <input name="licence_issued_on" type="date" required className={input} />
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <p className={section}>{t.step3}</p>
        <p className="text-xs text-brand-950/55">{t.docsHint}</p>
        <PhotoSlots slots={slots} value={photos} onChange={setPhotos} labels={t.slots} />
        <p className="rounded-lg bg-brand-950/[0.04] px-3 py-2 text-xs text-brand-950/60">
          {t.privacy}
        </p>
      </div>

      {/* free phone check: the customer messages us, inbound WhatsApp is free */}
      <div className="rounded-2xl border border-green-600/25 bg-green-50/60 p-5">
        <p className="font-semibold text-brand-950">{t.whatsappTitle}</p>
        <p className="mt-1 text-sm text-brand-950/70">{t.whatsappBody}</p>
        <p className="mt-3 text-sm text-brand-950/70">
          {t.yourCode}{" "}
          <span className="rounded-md bg-white px-2 py-1 font-mono font-bold text-brand-950 ring-1 ring-brand-950/10">
            {phoneCode}
          </span>
        </p>
        <a
          href={`https://wa.me/${whatsappNumber}?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 font-semibold text-white transition hover:brightness-105"
        >
          {t.whatsappBtn}
        </a>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
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
