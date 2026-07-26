"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** All writes go through RLS: a member can only touch their own agency's rows. */

export async function setVehicleStatus(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["draft", "live", "paused"].includes(status)) return;
  await supabase.from("vehicles").update({ status }).eq("id", id);
  revalidatePath("/agence");
}

export async function updateVehiclePrice(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const mad = Number(formData.get("price_mad") ?? 0);
  if (!Number.isFinite(mad) || mad <= 0) return;
  await supabase
    .from("vehicles")
    .update({ daily_price_mad: Math.round(mad * 100) })
    .eq("id", id);
  revalidatePath("/agence");
}

export async function deleteVehicle(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("vehicles").delete().eq("id", String(formData.get("id") ?? ""));
  revalidatePath("/agence");
}
