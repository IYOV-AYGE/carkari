// PaymentProvider abstraction — SPEC.md §2.
// Rule: nothing outside src/lib/payments/ may import a payment SDK directly.
// Swapping Stripe for CMI (or adding full online payment) touches only this folder.

export type Money = {
  /** integer minor units (centimes) — never floats */
  amount: number;
  currency: "MAD" | "USD" | "EUR";
};

export type ChargeRequest = {
  bookingId: string;
  customerId: string;
  deposit: Money;
  /** shown on the payment page / statement */
  description: string;
  /** where the provider should send the user back */
  successUrl: string;
  cancelUrl: string;
};

export type ChargeResult =
  | { kind: "redirect"; url: string; providerRef: string }
  | { kind: "failed"; reason: string };

export type RefundResult =
  | { kind: "refunded"; providerRef: string }
  | { kind: "failed"; reason: string };

export interface PaymentProvider {
  readonly name: "stripe" | "cmi";

  /** Create a checkout for the booking deposit. */
  createDepositCheckout(req: ChargeRequest): Promise<ChargeResult>;

  /** Refund a previously succeeded deposit (full refund only in v1). */
  refundDeposit(providerRef: string): Promise<RefundResult>;

  /**
   * Verify + parse an incoming webhook. Returns the event we care about
   * or null for events we ignore. MUST verify the signature.
   */
  parseWebhook(rawBody: string, signatureHeader: string): Promise<
    | { type: "deposit_succeeded"; bookingId: string; providerRef: string }
    | { type: "deposit_failed"; bookingId: string }
    | null
  >;
}
