"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// RLS: only admins can update agencies — these actions fail safely otherwise.
export async function setAgencyStatus(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["verified", "suspended", "pending"].includes(status)) return;
  await supabase.from("agencies").update({ status }).eq("id", id);
  revalidatePath("/admin");
}

/** Signed URLs so the admin can view private documents. */
export async function getDocUrl(path: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("agency-docs")
    .createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}
