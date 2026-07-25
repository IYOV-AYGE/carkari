// Stripe implementation of PaymentProvider — wired for real in Step 4.
// Server-side only. Requires STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET env vars.
import type {
  PaymentProvider,
  ChargeRequest,
  ChargeResult,
  RefundResult,
} from "./provider";

export const stripeProvider: PaymentProvider = {
  name: "stripe",

  async createDepositCheckout(req: ChargeRequest): Promise<ChargeResult> {
    // Step 4: create a Stripe Checkout Session with
    //   line item = deposit, metadata.bookingId = req.bookingId,
    //   currency MAD (Stripe presents MAD, settles to USD bank).
    void req;
    return { kind: "failed", reason: "not implemented until Step 4" };
  },

  async refundDeposit(providerRef: string): Promise<RefundResult> {
    void providerRef;
    return { kind: "failed", reason: "not implemented until Step 4" };
  },

  async parseWebhook() {
    // Step 4: stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET)
    return null;
  },
};

/** The active provider for the app. Swap here when migrating processors. */
export const paymentProvider: PaymentProvider = stripeProvider;
