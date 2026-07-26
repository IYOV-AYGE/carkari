// Creates a deposit checkout for a booking the caller owns.
// Amounts come from the DB — never from the request body (SPEC.md §2).
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { paymentProvider } from "@/lib/payments/stripe";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { bookingId } = (await request.json()) as { bookingId?: string };
  if (!bookingId) {
    return NextResponse.json({ error: "missing_booking" }, { status: 400 });
  }

  // RLS restricts this select to the caller's own bookings.
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, customer_id, deposit_mad, currency, status")
    .eq("id", bookingId)
    .single();

  if (!booking || booking.customer_id !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (booking.status !== "pending_payment") {
    return NextResponse.json({ error: "already_processed" }, { status: 409 });
  }

  const origin = new URL(request.url).origin;
  const result = await paymentProvider.createDepositCheckout({
    bookingId: booking.id,
    customerId: user.id,
    deposit: {
      amount: booking.deposit_mad,
      currency: (booking.currency ?? "MAD") as "MAD",
    },
    description: `CarKari — acompte réservation ${booking.id.slice(0, 8)}`,
    successUrl: `${origin}/reservation/${booking.id}?paid=1`,
    cancelUrl: `${origin}/reservation/${booking.id}`,
  });

  if (result.kind === "failed") {
    const notConfigured = result.reason === "stripe_not_configured";
    return NextResponse.json(
      {
        error: notConfigured
          ? "Le paiement en ligne n'est pas encore activé. / Online payment is not enabled yet."
          : "payment_error",
      },
      { status: notConfigured ? 503 : 500 }
    );
  }

  await supabase.from("payments").insert({
    booking_id: booking.id,
    provider: "stripe",
    provider_ref: result.providerRef,
    amount_mad: booking.deposit_mad,
    currency: booking.currency ?? "MAD",
    status: "pending",
  });

  return NextResponse.json({ url: result.url });
}
