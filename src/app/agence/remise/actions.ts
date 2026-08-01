"use server";

/**
 * Counter identity check, run by CarKari — never by the agency.
 *
 * The host uploads a photo of the customer. This action fetches BOTH images
 * with the service role (so the agency's own session can never read the
 * customer's selfie), compares them, stores the verdict, and returns only
 * "match" / "no match". No score, no image, no document ever reaches the
 * agency's browser.
 */

import { createClient } from "@/lib/supabase/server";
import { compareFaces, isConfigured, type MatchStatus } from "@/lib/identity/faceMatch";
import { reportError } from "@/lib/observability/report";

export type CheckOutcome = { status: MatchStatus; message: string };

/** Service-role fetch of a private object. Server-only, never exposed. */
async function download(bucket: string, path: string): Promise<Buffer | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const res = await fetch(
    `${url}/storage/v1/object/${bucket}/${encodeURI(path)}`,
    { headers: { apikey: key, authorization: `Bearer ${key}` } }
  );
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

export async function verifyCustomerPhoto(
  bookingId: string,
  photoPath: string
): Promise<CheckOutcome> {
  const supabase = await createClient();

  // Authorisation: this RPC returns a path only to a member of the agency
  // that owns the vehicle, and only while the booking is confirmed.
  const { data: selfiePath, error: pathErr } = await supabase.rpc(
    "kyc_selfie_path",
    { p_booking: bookingId }
  );
  if (pathErr) {
    await reportError(pathErr, { where: "verifyCustomerPhoto", bookingId });
    return { status: "error", message: "check_failed" };
  }

  async function save(status: MatchStatus, score: number | null, detail?: string) {
    await supabase.rpc("record_face_check", {
      p_booking: bookingId,
      p_photo: photoPath,
      p_status: status,
      p_score: score,
      p_detail: detail ?? null,
    });
  }

  if (!selfiePath || !isConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Degrade honestly rather than block a real customer at the counter.
    await save("unavailable", null, !selfiePath ? "no selfie on file" : "matcher off");
    return { status: "unavailable", message: "unavailable" };
  }

  const [live, onFile] = await Promise.all([
    download("handover-photos", photoPath),
    download("customer-docs", selfiePath as string),
  ]);
  if (!live || !onFile) {
    await save("error", null, "image fetch failed");
    return { status: "error", message: "check_failed" };
  }

  const result = await compareFaces(live, onFile);
  await save(result.status, result.score, result.detail);

  return {
    status: result.status,
    message:
      result.status === "match"
        ? "matched"
        : result.status === "no_match"
          ? "not_matched"
          : result.status === "unavailable"
            ? "unavailable"
            : "check_failed",
  };
}
