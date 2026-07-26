// Stripe implementation of PaymentProvider. Server-side only.
// Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.
import Stripe from "stripe";
import type {
  PaymentProvider,
  ChargeRequest,
  ChargeResult,
  RefundResult,
} from "./provider";

function client(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null; // not configured yet — callers degrade gracefully
  return new Stripe(key);
}

export const stripeProvider: PaymentProvider = {
  name: "stripe",

  async createDepositCheckout(req: ChargeRequest): Promise<ChargeResult> {
    const stripe = client();
    if (!stripe) return { kind: "failed", reason: "stripe_not_configured" };
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: req.deposit.currency.toLowerCase(),
              unit_amount: req.deposit.amount, // integer minor units
              product_data: { name: req.description },
            },
          },
        ],
        client_reference_id: req.bookingId,
        metadata: { bookingId: req.bookingId, customerId: req.customerId },
        success_url: req.successUrl,
        cancel_url: req.cancelUrl,
      });
      if (!session.url) return { kind: "failed", reason: "no_session_url" };
      return { kind: "redirect", url: session.url, providerRef: session.id };
    } catch (e) {
      return { kind: "failed", reason: (e as Error).message };
    }
  },

  async refundDeposit(providerRef: string): Promise<RefundResult> {
    const stripe = client();
    if (!stripe) return { kind: "failed", reason: "stripe_not_configured" };
    try {
      // providerRef is the checkout session id — resolve its payment intent.
      const session = await stripe.checkout.sessions.retrieve(providerRef);
      const pi =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
      if (!pi) return { kind: "failed", reason: "no_payment_intent" };
      const refund = await stripe.refunds.create({ payment_intent: pi });
      return { kind: "refunded", providerRef: refund.id };
    } catch (e) {
      return { kind: "failed", reason: (e as Error).message };
    }
  },

  async parseWebhook(rawBody: string, signatureHeader: string) {
    const stripe = client();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !secret) return null;

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signatureHeader, secret);
    } catch {
      return null; // bad signature — ignore, never trust unverified input
    }

    if (event.type === "checkout.session.completed") {
      const s = event.data.object as Stripe.Checkout.Session;
      const bookingId = s.metadata?.bookingId ?? s.client_reference_id ?? "";
      if (!bookingId) return null;
      return { type: "deposit_succeeded" as const, bookingId, providerRef: s.id };
    }
    if (
      event.type === "checkout.session.expired" ||
      event.type === "payment_intent.payment_failed"
    ) {
      const s = event.data.object as { metadata?: { bookingId?: string } };
      const bookingId = s.metadata?.bookingId ?? "";
      if (!bookingId) return null;
      return { type: "deposit_failed" as const, bookingId };
    }
    return null;
  },
};

/** The active provider for the app. Swap here when migrating processors. */
export const paymentProvider: PaymentProvider = stripeProvider;
