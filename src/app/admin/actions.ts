"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/** Caller IP, for the audit trail. Vercel sets x-forwarded-for. */
async function callerIp(): Promise<string | null> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
}

/**
 * Append to the audit trail. Deliberately never throws: a logging failure
 * must not block an admin from doing their job, but it must be visible.
 */
async function audit(
  action: string,
  subject: string | null,
  detail: Record<string, unknown> = {}
) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("log_audit", {
      p_action: action,
      p_subject: subject,
      p_detail: detail,
      p_ip: await callerIp(),
    });
    if (error) console.error("[audit] failed", action, error.message);
  } catch (e) {
    console.error("[audit] threw", action, e);
  }
}

// RLS: only admins can update agencies — these actions fail safely otherwise.
export async function setAgencyStatus(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["verified", "suspended", "pending"].includes(status)) return;
  const { error } = await supabase.from("agencies").update({ status }).eq("id", id);
  if (!error) await audit("agency_status", null, { agency_id: id, status });
  revalidatePath("/admin");
}

/** Signed URLs so the admin can view private documents. */
export async function getDocUrl(path: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("agency-docs")
    .createSignedUrl(path, 60 * 10);
  if (data?.signedUrl) await audit("agency_doc_view", null, { document: path });
  return data?.signedUrl ?? null;
}

/**
 * Signed URL for a customer KYC document (admins only, short-lived).
 *
 * Every call is recorded against the customer it belongs to. Paths are
 * `<user-id>/<slot>-<ts>.jpg`, so the owner is the first segment.
 */
export async function getCustomerDocUrl(path: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("customer-docs")
    .createSignedUrl(path, 60 * 10);
  if (data?.signedUrl) {
    const owner = path.split("/")[0];
    const uuid = /^[0-9a-f-]{36}$/i.test(owner) ? owner : null;
    await audit("kyc_doc_view", uuid, { document: path });
  }
  return data?.signedUrl ?? null;
}

/** Approve or reject a customer's identity verification. */
export async function setKyc(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["verified", "rejected", "pending"].includes(status)) return;
  const reason = String(formData.get("reason") ?? "") || null;
  const { error } = await supabase.rpc("admin_set_kyc", {
    p_user: id,
    p_status: status,
    p_reason: reason,
  });
  if (!error) await audit("kyc_decision", id, { status, reason });
  revalidatePath("/admin/clients");
}
