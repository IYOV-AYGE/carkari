"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Cancellation + refund decision happen in the DB (SPEC.md §2). */
export async function cancelBooking(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const { data } = await supabase.rpc("cancel_booking", { p_booking: id });
  const refundDue = data?.[0]?.refund_due === true;

  if (refundDue) {
    // Refund the deposit through the active provider, if it was paid.
    const { data: payment } = await supabase
      .from("payments")
      .select("provider_ref, status")
      .eq("booking_id", id)
      .eq("status", "succeeded")
      .maybeSingle();
    if (payment?.provider_ref) {
      const { paymentProvider } = await import("@/lib/payments/stripe");
      const res = await paymentProvider.refundDeposit(payment.provider_ref);
      if (res.kind === "refunded") {
        await supabase
          .from("payments")
          .update({ status: "refunded" })
          .eq("booking_id", id);
      }
    }
  }

  revalidatePath("/mes-reservations");
}
