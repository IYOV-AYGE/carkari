"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CITIES } from "@/lib/mock/vehicles";
import { compressDocument } from "@/lib/images/compress";

export type ApplyLabels = {
  secCompany: string; secRep: string; secDocs: string;
  legalName: string; city: string; phone: string; rcNumber: string;
  repFirst: string; repLast: string; repBirth: string; repBirthCity: string;
  repPhone: string; repEmail: string;
  rcDoc: string; insuranceDoc: string; idFront: string; idBack: string;
  docHint: string; privacyNote: string;
  submit: string; uploading: string;
  errGeneric: string; errAge: string; done: string;
};

const FILE_FIELDS = ["rc_doc", "insurance_doc", "id_front", "id_back"] as const;

export function AgencyApplyForm({ t, userId }: { t: ApplyLabels; userId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();

    try {
      const birth = String(fd.get("rep_birth_date") ?? "");
      const age =
        (Date.now() - new Date(birth).getTime()) / (365.25 * 24 * 3600 * 1000);
      if (!birth || age < 18) {
        setError(t.errAge);
        setBusy(false);
        return;
      }

      const paths: Record<string, string> = {};
      for (const field of FILE_FIELDS) {
        const raw = fd.get(field) as File | null;
        if (!raw || raw.size === 0) throw new Error("missing file");
        // images get compressed; PDFs pass through untouched
        const file = raw.type.startsWith("image/") ? await compressDocument(raw) : raw;
        if (file.size > 10 * 1024 * 1024) throw new Error("file too large");
        const path = `${userId}/${field}-${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage
          .from("agency-docs")
          .upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        paths[field] = path;
      }

      const { error: rpcError } = await supabase.rpc("apply_agency", {
        p_legal_name: String(fd.get("legal_name") ?? ""),
        p_city: String(fd.get("city") ?? ""),
        p_phone: String(fd.get("phone") ?? ""),
        p_rc_number: String(fd.get("rc_number") ?? ""),
        p_rc_doc: paths.rc_doc,
        p_insurance_doc: paths.insurance_doc,
        p_rep_first_name: String(fd.get("rep_first_name") ?? ""),
        p_rep_last_name: String(fd.get("rep_last_name") ?? ""),
        p_rep_birth_date: birth,
        p_rep_birth_city: String(fd.get("rep_birth_city") ?? ""),
        p_rep_phone: String(fd.get("rep_phone") ?? ""),
        p_rep_email: String(fd.get("rep_email") ?? ""),
        p_rep_id_front: paths.id_front,
        p_rep_id_back: paths.id_back,
      });
      if (rpcError) throw rpcError;
      setDone(true);
    } catch {
      setError(t.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  const input =
    "mt-1 w-full rounded-lg border border-ink/15 px-3 py-2.5 text-ink";
  const label = "block text-sm font-medium text-ink";
  const section = "text-sm font-bold uppercase tracking-wide text-ink/50";

  if (done) {
    return <p className="rounded-xl bg-green-50 dark:bg-green-500/15 p-6 text-green-800 dark:text-green-300">{t.done}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="space-y-4">
        <p className={section}>{t.secCompany}</p>
        <label className={label}>
          {t.legalName}
          <input name="legal_name" required minLength={3} className={input} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>
            {t.city}
            <select name="city" required className={input}>
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className={label}>
            {t.phone}
            <input name="phone" type="tel" required className={input} />
          </label>
        </div>
        <label className={label}>
          {t.rcNumber}
          <input name="rc_number" required className={input} />
        </label>
      </div>

      <div className="space-y-4">
        <p className={section}>{t.secRep}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>
            {t.repFirst}
            <input name="rep_first_name" required minLength={2} className={input} />
          </label>
          <label className={label}>
            {t.repLast}
            <input name="rep_last_name" required minLength={2} className={input} />
          </label>
          <label className={label}>
            {t.repBirth}
            <input name="rep_birth_date" type="date" required className={input} />
          </label>
          <label className={label}>
            {t.repBirthCity}
            <input name="rep_birth_city" required className={input} />
          </label>
          <label className={label}>
            {t.repPhone}
            <input name="rep_phone" type="tel" required className={input} />
          </label>
          <label className={label}>
            {t.repEmail}
            <input name="rep_email" type="email" required className={input} />
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <p className={section}>{t.secDocs}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>
            {t.rcDoc}
            <input name="rc_doc" type="file" accept=".pdf,image/*" required className={input} />
          </label>
          <label className={label}>
            {t.insuranceDoc}
            <input name="insurance_doc" type="file" accept=".pdf,image/*" required className={input} />
          </label>
          <label className={label}>
            {t.idFront}
            <input name="id_front" type="file" accept="image/*,.pdf" capture="environment" required className={input} />
          </label>
          <label className={label}>
            {t.idBack}
            <input name="id_back" type="file" accept="image/*,.pdf" capture="environment" required className={input} />
          </label>
        </div>
        <p className="text-xs text-ink/50">{t.docHint}</p>
        <p className="rounded-lg bg-ink/[0.04] px-3 py-2 text-xs text-ink/60">
          {t.privacyNote}
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-500/15 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error}</p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-accent-500 py-3 font-semibold text-white transition hover:bg-accent-400 disabled:opacity-60"
      >
        {busy ? t.uploading : t.submit}
      </button>
    </form>
  );
}
