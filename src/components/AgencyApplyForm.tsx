"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CITIES } from "@/lib/mock/vehicles";

export type ApplyLabels = {
  legalName: string; city: string; phone: string; rcNumber: string;
  rcDoc: string; insuranceDoc: string; docHint: string;
  submit: string; uploading: string;
  errGeneric: string; done: string;
};

export function AgencyApplyForm({ t, userId }: { t: ApplyLabels; userId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const supabase = createClient();

    try {
      const upload = async (field: string) => {
        const file = fd.get(field) as File | null;
        if (!file || file.size === 0) throw new Error("missing file");
        if (file.size > 10 * 1024 * 1024) throw new Error("file too large");
        const path = `${userId}/${field}-${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error } = await supabase.storage
          .from("agency-docs")
          .upload(path, file);
        if (error) throw error;
        return path;
      };

      const rcPath = await upload("rc_doc");
      const insPath = await upload("insurance_doc");

      const { error: rpcError } = await supabase.rpc("apply_agency", {
        p_legal_name: String(fd.get("legal_name") ?? ""),
        p_city: String(fd.get("city") ?? ""),
        p_phone: String(fd.get("phone") ?? ""),
        p_rc_number: String(fd.get("rc_number") ?? ""),
        p_rc_doc: rcPath,
        p_insurance_doc: insPath,
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
    "mt-1 w-full rounded-lg border border-brand-950/15 px-3 py-2.5 text-brand-950";

  if (done) {
    return (
      <p className="rounded-xl bg-green-50 p-6 text-green-800">{t.done}</p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm font-medium text-brand-950">
        {t.legalName}
        <input name="legal_name" required minLength={3} className={input} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-brand-950">
          {t.city}
          <select name="city" required className={input}>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-brand-950">
          {t.phone}
          <input name="phone" type="tel" required className={input} />
        </label>
      </div>
      <label className="block text-sm font-medium text-brand-950">
        {t.rcNumber}
        <input name="rc_number" required className={input} />
      </label>
      <label className="block text-sm font-medium text-brand-950">
        {t.rcDoc}
        <input name="rc_doc" type="file" accept=".pdf,.jpg,.jpeg,.png" required className={input} />
      </label>
      <label className="block text-sm font-medium text-brand-950">
        {t.insuranceDoc}
        <input name="insurance_doc" type="file" accept=".pdf,.jpg,.jpeg,.png" required className={input} />
      </label>
      <p className="text-xs text-brand-950/50">{t.docHint}</p>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
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
