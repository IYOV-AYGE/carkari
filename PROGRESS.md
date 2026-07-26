# CarKari — where we are (last updated 26 July 2026)

> To resume in ANY new session (Cowork, chat, Claude Code), say:
> "Read SPEC.md and PROGRESS.md in github.com/IYOV-AYGE/carkari and continue."

## Accounts and links

- Repo: https://github.com/IYOV-AYGE/carkari (branch `main`)
- Live preview: https://carkari.vercel.app (Vercel, auto-deploys on push)
- Domain: carkari.com — DNS at Cloudflare, not yet pointed at Vercel
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
   `00005_booking_flow.sql`.
2. **Domain (current task)** — Vercel → Settings → Domains → add carkari.com.
   Cloudflare DNS: A `@` → 76.76.21.21 and CNAME `www` → cname.vercel-dns.com,
   both **DNS only (grey cloud)**; SSL/TLS mode **Full (strict)**.
   After it resolves, tell Claude to update: Supabase Auth URLs, Google OAuth
   origins, sitemap/robots base URL (currently the vercel.app address).
3. **Google OAuth** — client created in Google Cloud (redirect URI
   `https://vjcmzkraaeijsiwekhcr.supabase.co/auth/v1/callback`, JS origin
   `https://carkari.vercel.app`). Still to do: paste client ID + secret into
   Supabase → Authentication → Providers → Google.
4. **Stripe (deliberately last)** — get `STRIPE_SECRET_KEY`,
   `STRIPE_WEBHOOK_SECRET` (endpoint `/api/webhooks/stripe`, event
   `checkout.session.completed`), plus `SUPABASE_SERVICE_ROLE_KEY`, into Vercel
   env vars, then redeploy.
5. **WhatsApp number** — placeholder 212600000000 in src/components/badges.tsx.

## TO DO — build queue (next features)

- Photo gallery/carousel on vehicle pages (cars now have 5 photos each)
- Availability calendar: agencies block dates; show booked dates to customers
- Favorites + reviews (DB tables already exist, UI not built)
- Arabic (RTL) as third language in src/lib/i18n/dict.ts
- Email notifications (booking confirmations) — e.g. Resend
- English blog articles targeting tourist searches
- Replace demo fleet in src/lib/mock/vehicles.ts once real agencies list cars
