# CarKari — Project Specification (Source of Truth)

> Read this file first in every session. It defines the business rules, schema,
> and security invariants. If code and this spec disagree, the spec wins — or
> update the spec deliberately.

## 1. What CarKari is

Marketplace for car rentals in Morocco (www.carkari.com), Airbnb model.
Verified **rental agencies** (businesses, not individuals) list their fleets.
**Customers** book online. Operating company + bank are in the **USA**.

## 2. Money model (v1)

- Customer pays a **deposit online** at booking (Stripe). Deposit = CarKari's
  commission, default **17.5%** of rental total (configurable per agency:
  `agencies.commission_rate`).
- Customer pays the **remaining balance directly to the agency at pickup**
  (cash/card at agency). CarKari never holds the agency's money → **no payouts
  needed in v1**.
- All amounts stored as **integer centimes** (`_mad` suffix, MAD × 100).
  Never floats. Currency column on every money table for future multi-currency.
- All price/commission math happens **server-side only** (DB functions or
  server actions). Client sends vehicle id + dates, nothing else.

### Refund policy (enforced in code, shown at checkout)

Let `booked_at` = booking creation time, `pickup_at` = rental start.

1. If `pickup_at - booked_at <= 48h` → deposit **non-refundable immediately**.
2. Else → free cancellation until `booked_at + 24h`; after that,
   deposit **non-refundable**.
3. Agency no-show / vehicle unavailable → **full refund** to customer +
   strike recorded against agency (3 strikes → suspended).
4. Customer must tick policy checkbox at checkout; store
   `policy_accepted_at` on the booking (chargeback defense).

### Future transition

`PaymentProvider` interface in `src/lib/payments/`. Stripe is the only
implementation now. Full-online-payment + payouts, or CMI, are later drop-ins.
Do not call Stripe SDK anywhere except inside the Stripe provider.

## 3. Roles

- `customer` — browse, book, review, favorite.
- `agency_owner` / `agency_staff` — manage own agency's branches, fleet,
  bookings (via `agency_members` join table).
- `admin` — CarKari staff: approve agencies, view all, handle disputes.
- Roles live in `profiles.role` + `agency_members`. **Never** trust
  client-supplied role. RLS enforces everything in Postgres.

## 4. Schema (Supabase Postgres)

profiles(id=auth.uid, full_name, phone, role)
agencies(id, legal_name, slug, status[pending|verified|suspended],
         city, commission_rate, strikes)
agency_members(agency_id, profile_id, member_role[owner|staff])
branches(id, agency_id, city, address, lat, lng)
vehicles(id, agency_id, branch_id, make, model, year, category,
         transmission, fuel, seats, daily_price_mad, status[draft|live|paused])
vehicle_images(id, vehicle_id, path, sort)
availability_blocks(id, vehicle_id, start_date, end_date, reason)
bookings(id, vehicle_id, customer_id, start_date, end_date,
         total_mad, deposit_mad, balance_due_mad, currency,
         status[pending_payment|confirmed|active|completed|
                cancelled_customer|cancelled_agency|no_show],
         policy_accepted_at, booked_at)
payments(id, booking_id, provider[stripe], provider_ref, amount_mad,
         status[pending|succeeded|refunded|failed], created_at)
reviews(id, booking_id, rating 1-5, comment) — only after `completed`
favorites(profile_id, vehicle_id)

### Security invariants (RLS)

- Public can read only `vehicles.status='live'` AND agency `verified`.
- Customers: own bookings/favorites/reviews only.
- Agency members: own agency rows only (via `agency_members`).
- Admin: all. Admin check via `profiles.role='admin'` security-definer fn.
- Booking prices computed by DB function `create_booking()` — client cannot
  set any money column. Overlapping-dates prevented by exclusion constraint.

## 5. Stack & conventions

- Next.js (App Router, src dir) + TypeScript + Tailwind 4 + shadcn/ui.
- Supabase: Postgres, Auth, Storage (vehicle images). Migrations in
  `supabase/migrations/`.
- Server components by default; `"use client"` only when interactive.
- Languages: FR first, then AR (RTL) and EN. Currency display: MAD.
- SEO matters: server-render public pages, per-city landing pages later.

## 6. Build phases

- **P1 (MVP)**: public search/browse/vehicle pages, auth, booking + Stripe
  deposit, refund logic, agency dashboard (fleet + bookings), admin approval
  panel.
- **P2**: reviews, favorites, notifications (email), AR/EN i18n, agency
  statements.
- **P3**: full online payment + payouts, promotions, dynamic pricing, mobile.

## 7. Status log (update as we finish steps)

- [x] Step 1: skeleton, SPEC.md, DB schema + RLS, PaymentProvider interface
- [ ] Step 2: Supabase project connect + auth
- [ ] Step 3: public pages (home, search, vehicle details)
- [ ] Step 4: booking flow + Stripe deposit
- [ ] Step 5: agency dashboard
- [ ] Step 6: admin panel
