// Stripe webhook: the ONLY place a booking becomes confirmed.
// Uses the service-role key so it can write regardless of RLS, and only ever
// acts on events whose signature Stripe verified.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { paymentProvider } from "@/lib/payments/stripe";

export async function POST(request: Request) {
  const raw = await request.text();
  const sig = request.headers.get("stripe-signature") ?? "";

  const event = await paymentProvider.parseWebhook(raw, sig);
  if (!event) return NextResponse.json({ received: true });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "server_not_configured" }, { status: 500 });
  }
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  if (event.type === "deposit_succeeded") {
    await admin
      .from("payments")
      .update({ status: "succeeded" })
      .eq("booking_id", event.bookingId)
      .eq("provider_ref", event.providerRef);

    await admin
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", event.bookingId)
      .eq("status", "pending_payment");
  }

  if (event.type === "deposit_failed") {
    await admin
      .from("payments")
      .update({ status: "failed" })
      .eq("booking_id", event.bookingId)
      .eq("status", "pending");
  }

  return NextResponse.json({ received: true });
}
