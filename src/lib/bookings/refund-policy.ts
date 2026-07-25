// Refund policy — SPEC.md §2. Mirrors the SQL function refund_eligible().
// The DB is authoritative; this copy exists so the UI can show the policy
// and countdowns without a round-trip.

const H = 3600_000;

export type RefundInfo =
  | { refundable: true; deadline: Date }
  | { refundable: false; reason: "within_48h_of_pickup" | "grace_period_over" };

export function refundInfo(bookedAt: Date, pickupAt: Date, now = new Date()): RefundInfo {
  if (pickupAt.getTime() - bookedAt.getTime() <= 48 * H) {
    return { refundable: false, reason: "within_48h_of_pickup" };
  }
  const deadline = new Date(bookedAt.getTime() + 24 * H);
  if (now <= deadline) return { refundable: true, deadline };
  return { refundable: false, reason: "grace_period_over" };
}
