# CarKari — where we are (last updated 26 July 2026)

> To resume in ANY new session (Cowork, chat, Claude Code), say:
> "Read SPEC.md and PROGRESS.md in github.com/IYOV-AYGE/carkari and continue."

## Accounts and links

- Repo: https://github.com/IYOV-AYGE/carkari (branch `main`)
- Live preview: https://carkari.vercel.app (Vercel, auto-deploys on push)
- Domain: **https://www.carkari.com — LIVE** (Cloudflare DNS → Vercel,
  CNAME records, proxy OFF/grey cloud, SSL Full strict)
- Database/auth/storage: Supabase project `vjcmzkraaeijsiwekhcr` (us-east-1)
- Admin account on the site: iyov@carkari.com (role=admin in profiles)

## DONE (built, pushed, deployed)

Public site (FR + EN, auto-switch by visitor country, manual EN/FR toggle):
home (Turo-style rows), search with filters/sort, vehicle detail pages,
6 city SEO landing pages, sitemap + robots, blog with 3 articles, About,
Help/FAQ, Insurance, Trust, Weddings, Carculator, Contact, Terms, Privacy,
Careers, Press, styled 404. Original CarKari logo + silver/steel-blue theme.

Accounts: email/password + Google button (OAuth not yet configured),
Turo-style account menu in navbar.

Agencies: /partenaires landing, /partenaires/inscription application with
company info + legal representative KYC (name, birth date/city, phone, email)
+ documents (RC, insurance, gov ID front/back) — images auto-compressed.
/agence dashboard: fleet CRUD, 5-angle photo capture (camera or gallery,
auto-compressed), price editing, publish/unpause, incoming bookings list.

Admin: /admin — review applications with document links, approve / suspend /
re-verify.

Bookings: date picker with server-computed quotes, availability check,
create_booking, confirmation page, /mes-reservations with cancellation that
applies the refund policy, Stripe deposit checkout + webhook (code complete,
keys not yet set).

## TO DO — Isaac's setup steps

1. **Migrations** — run in Supabase SQL editor, in order. Done: 00001, 00002.
   Pending: `00003_vehicle_photos.sql`, `00004_representative_identity.sql`,
   `00005_booking_flow.sql`, `00006_customer_verification.sql`.
2. **Domain — DONE.** Live at https://www.carkari.com. Cloudflare proxy must
   stay OFF (grey cloud) unless you re-test everything; Vercel needs it off to
   renew certificates, and Vercel geo headers power the FR/EN auto-switch.
   Still to update in dashboards: Supabase Auth Site URL + redirect
   (https://www.carkari.com/auth/callback) and Google OAuth JS origin.
3. **Google sign-in** — uses Google Identity Services (in-page token), NOT the
   Supabase redirect, so the consent screen shows carkari.com instead of the
   supabase.co project URL. Requires:
   - Google Cloud OAuth client: Authorized JavaScript origins must include
     `https://www.carkari.com` and `https://carkari.com` (redirect URI still
     needed for the fallback flow).
   - Vercel env var `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = the client ID.
   - Supabase → Authentication → Providers → Google: enabled, same client ID +
     secret (used to verify the ID token).
   If NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing the code falls back to the old
   redirect flow automatically.
4. **Stripe (deliberately last)** — get `STRIPE_SECRET_KEY`,
   `STRIPE_WEBHOOK_SECRET` (endpoint `/api/webhooks/stripe`, event
   `checkout.session.completed`), plus `SUPABASE_SERVICE_ROLE_KEY`, into Vercel
   env vars, then redeploy.
5. **WhatsApp number** — placeholder 212600000000 in src/components/badges.tsx
   (floating support button).
6. **Customer KYC is live**: /verification for customers, /admin/clients for
   review. Verification required before pickup, not before booking.
   - Contact verification is **email only** (Supabase `email_confirmed_at`).
     No SMS/WhatsApp code.
   - Two paths: residents (CIN recto/verso) vs visitors/tourists (passport page
     + optional international driving permit). Everyone gives phone, full
     address and driving licence number.
   - All photos are **camera captures only** — no gallery uploads. This needs
     HTTPS (fine, we're on Vercel) and camera permission; on desktop laptops the
     webcam is used, on phones the rear camera for documents and front for the
     selfie.

## TO DO — Isaac's setup steps (observability)

7. **Migration 00007_audit_log.sql** — run it, then check /admin/journal.
8. **Error alerts (5 min, free)** — either or both, as Vercel env vars:
   - `SENTRY_DSN` — make a free Sentry project, copy the DSN.
   - `ALERT_WEBHOOK_URL` — a Slack or Discord incoming webhook; you get a
     message the moment anything 500s.
   With neither set, errors only reach the Vercel logs.
9. **Uptime monitoring (5 min, free)** — point BetterStack or UptimeRobot at
   https://www.carkari.com/api/health every 5 minutes. It checks the database,
   so it catches outages the homepage would hide.

10. **Migration 00008_liveness.sql** — run it, then redo /verification on a
    phone: the screen flashes colours and asks you to turn your head.

11. **Migrations 00009, 00010, 00011, 00012** — run in that order. Then: agency dashboard shows "Hand over the vehicle" on
    confirmed bookings, customers get "Return the vehicle" on active ones.
12. **Face matching runs in-house** — no AWS, no vendor, no keys to configure.
    The model loads from jsDelivr on the two screens that need it. Before
    launch, vendor it locally so an identity path does not depend on a CDN:
      npm i @vladmandic/face-api@1.7.15
      cp -r node_modules/@vladmandic/face-api/model public/models
    then set NEXT_PUBLIC_FACE_MODEL_URL=/models in Vercel.

13. **Migration 00013_hourly_rentals.sql** — adds quads and jet skis, rented
    by the hour. After running it, agencies can pick Quad / ATV or Jet ski when
    listing and the form asks for a price per hour plus a minimum duration.

## TO DO — build queue (next features)

- Photo gallery/carousel on vehicle pages (cars now have 5 photos each)
- Availability calendar: agencies block dates; show booked dates to customers
- Favorites + reviews (DB tables already exist, UI not built)
- Arabic (RTL) as third language in src/lib/i18n/dict.ts
- Email notifications (booking confirmations) — e.g. Resend
- English blog articles targeting tourist searches
- Replace demo fleet in src/lib/mock/vehicles.ts once real agencies list cars
