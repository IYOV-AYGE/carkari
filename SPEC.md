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
- Languages: FR + EN live (auto-detect by IP country via x-vercel-ip-country in
  middleware, FR_COUNTRIES set in src/lib/i18n/dict.ts, cookie `lang`, manual
  switcher /lang/[code]). AR (RTL) later. Currency display: MAD.
- **Theming**: three flipping tokens in globals.css drive both modes —
  `ink` (text, hairlines, subtle tints, always usable as `ink/NN`), `card`
  (raised surfaces) and `surface` (page behind the cards). The `brand-*` ramp
  is FIXED and used for deliberate navy bands (`bg-band`) that stay dark in
  both modes. Never write `bg-white` or `text-brand-950` again — use
  `bg-card` / `text-ink`, or dark mode silently breaks on that element.
- **Dark mode**: class-based (`.dark` on <html>), chosen by the visitor via the
  navbar toggle, stored in a `theme` cookie so the SERVER renders the right
  class and there is no white flash. First visit with no cookie follows the OS
  setting via a tiny pre-paint script in layout.tsx.
- UI strings live in src/lib/i18n/dict.ts — add keys to BOTH fr and en.
- SEO matters: server-render public pages, per-city landing pages later.

## 5b. Customer identity verification (KYC)

- **Timing**: verification is required BEFORE PICKUP, not before booking.
  Customers book + pay the deposit freely, then verify. Unverified at pickup →
  agency does not release the car, deposit refunded. Best conversion, no risk.
- **Two paths**, chosen by the customer at step 0 (`profiles.is_resident`):
  - **Resident in Morocco**: CIN number + CIN recto/verso.
  - **Visitor / tourist**: passport number + passport photo page, plus an
    optional International Driving Permit photo.
- **Collected for everyone**: first/last name, birth date (21+ enforced),
  nationality, phone (required contact data), full postal address (line, city,
  postcode, country), driving licence number + issuing country + issue date
  (held ≥1 year enforced), licence recto/verso photos, and a selfie.
- **Contact verification = email only.** Supabase Auth's
  `email_confirmed_at` is the single verification signal; it surfaces in
  `my_verification()` and `admin_kyc_queue()`. No phone/SMS verification and no
  WhatsApp code — those were removed (no free, ToS-clean SMS path exists, and
  Google Voice is US/CA-only with no API). Revisit with a paid provider later.
- **Camera-only capture**: every document photo and the selfie are taken live
  through `getUserMedia` (src/components/CameraCapture.tsx). There is
  deliberately NO file input anywhere in the flow, which blocks recycled scans,
  screenshots and photos of someone else's papers.
- **Storage**: private bucket `customer-docs`, per-user folders, admin-only
  read via short-lived signed URLs. Agencies NEVER see documents — only
  `customer_verified` boolean via agency_bookings().
- **Retention**: purge_old_kyc_documents() nulls document paths 90 days after
  the customer's last rental. Decision is kept, images are not.
- **Fraud signals**: kyc_ip / kyc_country stored silently for chargeback
  defense alongside policy_accepted_at on the booking.
- **Review**: manual in /admin/clients (approve / reject with reason).
  Swappable for Stripe Identity later without schema change.

## 5c. Audit trail and observability

- **Every privileged action is logged** to `audit_log` via `log_audit()`:
  opening a customer KYC document, opening an agency document, KYC decisions,
  agency status changes. Actor, subject, IP and timestamp.
- The table is **append-only by construction**: no INSERT policy (rows arrive
  only through the security-definer function, so code cannot forge an actor)
  and UPDATE/DELETE are revoked from client roles, so an admin cannot erase
  their own tracks. Readable by admins at /admin/journal.
- `admin_kyc_access_history(user)` answers "who has seen this person's
  documents" — the query required for a subject access request or to scope a
  breach.
- **Error reporting** is SDK-free (src/lib/observability/report.ts): server
  errors via `onRequestError` in instrumentation.ts, client crashes via
  global-error.tsx → /api/report. Sends to Sentry's HTTP ingest API if
  `SENTRY_DSN` is set and/or a Slack/Discord webhook via `ALERT_WEBHOOK_URL`.
  With neither set it degrades to console logging and never throws.
- **/api/health** hits the database and returns 200/503 — point uptime
  monitoring here, not at the homepage, which can serve from cache while
  Postgres is down.

## 6. Build phases

- **P1 (MVP)**: public search/browse/vehicle pages, auth, booking + Stripe
  deposit, refund logic, agency dashboard (fleet + bookings), admin approval
  panel.
- **P2**: reviews, favorites, notifications (email), AR/EN i18n, agency
  statements.
- **P3**: full online payment + payouts, promotions, dynamic pricing, mobile.

## 7. Status log (update as we finish steps)

- [x] Step 1: skeleton, SPEC.md, DB schema + RLS, PaymentProvider interface
- [x] Step 2a: Supabase clients wired (project vjcmzkraaeijsiwekhcr, us-east-1)
- [ ] Step 2b: run migration 00001 in Supabase SQL editor + auth pages
- [x] Step 3: public pages (home, search, vehicle details) — mock data
- [x] Step 4: booking flow (quote → create_booking → Stripe deposit → webhook
      confirms). Cancellation applies refund policy via cancel_booking().
- [x] Step 4a: agency onboarding (application form, doc uploads, admin approval)
- [x] Step 5: agency dashboard /agence (fleet CRUD, photo upload, publish toggle)
- [x] Step 6: admin panel /admin (approve/suspend agencies)
- Public pages now merge live DB vehicles (src/lib/vehicles/live.ts) with mock demo fleet.
- Migrations to run in order: 00001 … 00006.
- Vehicles require 5 photos (front, rear, left, right, interior) before going
  live — enforced by trigger enforce_min_photos() AND in the UI.
- All client-side image uploads pass through src/lib/images/compress.ts
  (canvas resize + WebP/JPEG re-encode). Never upload raw phone photos.
- Agency onboarding captures legal representative KYC: name, birth date/city,
  phone, email, gov ID front+back (private bucket agency-docs).
- Auth: email/password + Google OAuth (configure provider in Supabase dash).
- Env needed in Vercel: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
  STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY.
- Webhook endpoint: POST /api/webhooks/stripe (checkout.session.completed).
  It is the ONLY place bookings become `confirmed`.
