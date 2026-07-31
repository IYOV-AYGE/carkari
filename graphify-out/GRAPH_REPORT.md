# Graph Report - .  (2026-07-31)

## Corpus Check
- 127 files · ~133,479 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 525 nodes · 1030 edges · 37 communities (29 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.83)
- Token cost: 41,000 input · 7,600 output

## Community Hubs (Navigation)
- Marketing and Content Pages
- Admin Review Panel
- Homepage, Search and Layout
- NPM Dependencies
- Interactive Form Components
- TypeScript Configuration
- Core Database Schema
- Authentication Flow
- Payments and Deploy Setup
- Roles and RLS Model
- Customer KYC Rules
- Stripe Payment Provider
- Project Docs and Stack
- Public Site and SEO
- Onboarding and Document Storage
- Booking and Refund Policy
- Carculator and Partner Pages
- Fleet and Availability Schema
- Money Model
- KYC Migration Functions
- Booking Flow Migration
- Deferred Phase-2 Features
- i18n Geo Middleware
- Agency Onboarding Migration
- Next.js Image Config
- Vehicle Photos Migration
- ESLint Config
- PostCSS Config
- Refund Policy Helper
- Profiles Table
- Agencies Table (00002)
- Agencies Table (00004)

## God Nodes (most connected - your core abstractions)
1. `getLang` - 66 edges
2. `createClient()` - 42 edges
3. `getDict()` - 20 edges
4. `Navbar()` - 18 edges
5. `Footer()` - 16 edges
6. `compilerOptions` - 16 edges
7. `CarKari Progress Log` - 15 edges
8. `CarKari Project Specification (Source of Truth)` - 14 edges
9. `ContentPage()` - 13 edges
10. `Supabase Postgres Schema` - 13 edges

## Surprising Connections (you probably didn't know these)
- `README (create-next-app default)` --semantically_similar_to--> `CarKari Project Specification (Source of Truth)`  [AMBIGUOUS] [semantically similar]
  README.md → SPEC.md
- `Rule: This Next.js Differs From Training Data — Read node_modules/next/dist/docs/` --semantically_similar_to--> `Spec Wins Over Code Rule`  [INFERRED] [semantically similar]
  AGENTS.md → SPEC.md
- `Deploy on Vercel Guidance` --conceptually_related_to--> `Vercel Deployment (carkari.vercel.app, auto-deploy on push)`  [INFERRED]
  README.md → PROGRESS.md
- `Backlog: Vehicle Photo Gallery/Carousel` --references--> `vehicle_images table`  [EXTRACTED]
  PROGRESS.md → SPEC.md
- `Backlog: English Blog Articles for Tourist Searches` --conceptually_related_to--> `Visitor/Tourist Path: Passport + Optional International Driving Permit`  [INFERRED]
  PROGRESS.md → SPEC.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Deposit-Commission Booking Money Flow** — spec_create_booking, spec_deposit, spec_commission_rate, spec_balance_at_pickup, spec_payments, spec_stripe_webhook, spec_bookings [EXTRACTED 1.00]
- **Customer KYC Pipeline (capture -> store -> review -> purge)** — spec_customer_kyc, spec_camera_only_capture, spec_customer_docs_bucket, spec_admin_kyc_review, spec_purge_old_kyc_documents, spec_kyc_resident_path, spec_kyc_visitor_path [EXTRACTED 1.00]
- **Role-Based RLS Enforcement Model** — spec_rls, spec_profiles, spec_agency_members, spec_role_customer, spec_role_agency_owner, spec_role_agency_staff, spec_role_admin, spec_never_trust_client_role [EXTRACTED 1.00]

## Communities (37 total, 8 thin omitted)

### Community 0 - "Marketing and Content Pages"
Cohesion: 0.07
Nodes (46): AboutPage(), generateMetadata(), L, generateMetadata(), generateMetadata(), HelpPage(), L, generateMetadata() (+38 more)

### Community 1 - "Admin Review Panel"
Cohesion: 0.07
Nodes (42): getCustomerDocUrl(), getDocUrl(), setAgencyStatus(), setKyc(), AdminClientsPage(), metadata, Row, STATUS (+34 more)

### Community 2 - "Homepage, Search and Layout"
Cohesion: 0.11
Nodes (34): generateMetadata(), RootLayout(), CityPage(), fromSlug(), generateMetadata(), generateStaticParams(), L, slugify() (+26 more)

### Community 3 - "NPM Dependencies"
Cohesion: 0.05
Nodes (38): eslint, eslint-config-next, next, dependencies, next, react, react-dom, stripe (+30 more)

### Community 4 - "Interactive Form Components"
Cohesion: 0.11
Nodes (23): AddVehicleForm(), VehicleFormLabels, AgencyApplyForm(), ApplyLabels, FILE_FIELDS, BookingLabels, BookingWidget(), fmt() (+15 more)

### Community 5 - "TypeScript Configuration"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 6 - "Core Database Schema"
Cohesion: 0.18
Nodes (18): public, public.handle_new_user, on_auth_user_created, public.agencies, public.agency_members, public.availability_blocks, public.bookings, public.branches (+10 more)

### Community 7 - "Authentication Flow"
Cohesion: 0.19
Nodes (11): AuthState, signIn(), signUp(), AuthPage(), generateMetadata(), AuthForm(), initial, CredentialResponse (+3 more)

### Community 8 - "Payments and Deploy Setup"
Cohesion: 0.16
Nodes (15): Accounts: Email/Password + Google Button, Turo-Style Account Menu, Admin Panel /admin (approve / suspend / re-verify), NEXT_PUBLIC_GOOGLE_CLIENT_ID + Fallback Redirect Flow, Google Sign-In via Google Identity Services (in-page token), Stripe Keys Deliberately Configured Last, Pending: Supabase Auth Site URL + /auth/callback Redirect, Admin Panel /admin (approve/suspend agencies), Auth: Email/Password + Google OAuth (+7 more)

### Community 9 - "Roles and RLS Model"
Cohesion: 0.21
Nodes (15): Admin Account iyov@carkari.com, Admin Check via security-definer Function on profiles.role, agency_members join table, Airbnb Marketplace Model, CarKari Marketplace, Customer, Rule: Never Trust Client-Supplied Role, profiles table (+7 more)

### Community 10 - "Customer KYC Rules"
Cohesion: 0.21
Nodes (15): Customer KYC Live: /verification + /admin/clients, WhatsApp Support Button Placeholder 212600000000 (src/components/badges.tsx), admin_kyc_queue() DB function, Manual KYC Review in /admin/clients, Minimum Age 21 Enforcement, Customer Identity Verification (KYC), Contact Verification = Email Only (email_confirmed_at), profiles.is_resident Path Selector (+7 more)

### Community 11 - "Stripe Payment Provider"
Cohesion: 0.18
Nodes (7): ChargeRequest, ChargeResult, Money, PaymentProvider, RefundResult, paymentProvider, stripeProvider

### Community 12 - "Project Docs and Stack"
Cohesion: 0.16
Nodes (14): AGENTS.md Agent Rules, Rule: This Next.js Differs From Training Data — Read node_modules/next/dist/docs/, CLAUDE.md (imports AGENTS.md), Session Resume Instruction (read SPEC.md + PROGRESS.md), README (create-next-app default), Local Dev Server (npm/yarn/pnpm/bun run dev, localhost:3000), next/font with Geist Font Family, Deploy on Vercel Guidance (+6 more)

### Community 13 - "Public Site and SEO"
Cohesion: 0.19
Nodes (14): CarKari Progress Log, 6 City SEO Landing Pages + Sitemap + Robots, Cloudflare Proxy Must Stay OFF (grey cloud), Production Domain www.carkari.com (Cloudflare DNS -> Vercel), Backlog: English Blog Articles for Tourist Searches, Backlog: Replace Demo Fleet (src/lib/mock/vehicles.ts), Backlog: Vehicle Photo Gallery/Carousel, Public Site Shipped (FR+EN, home, search, vehicle pages, city SEO, blog, legal) (+6 more)

### Community 14 - "Onboarding and Document Storage"
Cohesion: 0.18
Nodes (14): Camera Capture Requires HTTPS + Camera Permission, Agency Onboarding /partenaires + /partenaires/inscription, Pending Migrations 00003-00006, Supabase Project vjcmzkraaeijsiwekhcr (us-east-1), Agencies Never See Documents, Only customer_verified Boolean, agency_bookings() DB function, Private Storage Bucket agency-docs (legal representative KYC), Agency Onboarding + Admin Approval (+6 more)

### Community 15 - "Booking and Refund Policy"
Cohesion: 0.26
Nodes (13): Bookings Shipped (quotes, availability, create_booking, /mes-reservations, Stripe checkout), Agency Strike System (3 strikes => suspended), Booking Flow (quote -> create_booking -> Stripe deposit -> webhook), bookings table, cancel_booking() DB function, Chargeback Defense, create_booking() DB function, Fraud Signals: kyc_ip / kyc_country (+5 more)

### Community 16 - "Carculator and Partner Pages"
Cohesion: 0.21
Nodes (10): CarculatorPage(), generateMetadata(), L, carc, generateMetadata(), L, PartnersPage(), CarcLabels (+2 more)

### Community 17 - "Fleet and Availability Schema"
Cohesion: 0.29
Nodes (12): Agency Dashboard /agence (fleet CRUD, 5-angle capture, bookings list), Backlog: Availability Calendar (agency date blocking), agencies table, Agency Dashboard /agence (fleet CRUD, publish toggle), availability_blocks table, branches table, enforce_min_photos() Trigger: 5 Required Vehicle Photos, Overlapping-Dates Exclusion Constraint (+4 more)

### Community 18 - "Money Model"
Cohesion: 0.20
Nodes (12): Remaining Balance Paid Directly to Agency at Pickup, Future CMI / Full-Online-Payment + Payouts Drop-In, Currency Column on Every Money Table, Integer Centimes Money Storage (_mad, MAD x 100), Money Model v1, No Payouts Needed in v1, PaymentProvider Interface (src/lib/payments/), payments table (+4 more)

### Community 19 - "KYC Migration Functions"
Cohesion: 0.21
Nodes (8): stale, public.agency_bookings(), public.purge_old_kyc_documents(), public.submit_verification(), auth.users, bookings, profiles, vehicles

### Community 20 - "Booking Flow Migration"
Cohesion: 0.33
Nodes (9): availability_blocks, public.agency_bookings(), public.cancel_booking(), public.my_bookings(), public.quote_booking(), agencies, bookings, profiles (+1 more)

### Community 21 - "Deferred Phase-2 Features"
Cohesion: 0.38
Nodes (7): Backlog: Arabic (RTL) Third Language, Backlog: Email Notifications (e.g. Resend), Backlog: Favorites + Reviews UI, Arabic (RTL) as Later Third Language, favorites table, Phase P2, reviews table (only after completed booking)

### Community 22 - "i18n Geo Middleware"
Cohesion: 0.60
Nodes (4): FR_COUNTRIES, config, envOrNull(), middleware()

### Community 23 - "Agency Onboarding Migration"
Cohesion: 0.40
Nodes (3): public.apply_agency(), agencies, agency_members

## Ambiguous Edges - Review These
- `CarKari Project Specification (Source of Truth)` → `README (create-next-app default)`  [AMBIGUOUS]
  README.md · relation: semantically_similar_to

## Knowledge Gaps
- **107 isolated node(s):** `eslintConfig`, `supabaseHost`, `nextConfig`, `name`, `version` (+102 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `CarKari Project Specification (Source of Truth)` and `README (create-next-app default)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **Why does `getLang` connect `Marketing and Content Pages` to `Carculator and Partner Pages`, `Admin Review Panel`, `Homepage, Search and Layout`, `Authentication Flow`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `createClient()` connect `Admin Review Panel` to `Homepage, Search and Layout`, `Authentication Flow`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `CarKari Project Specification (Source of Truth)` connect `Project Docs and Stack` to `Payments and Deploy Setup`, `Roles and RLS Model`, `Customer KYC Rules`, `Public Site and SEO`, `Booking and Refund Policy`, `Fleet and Availability Schema`, `Money Model`, `Deferred Phase-2 Features`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `supabaseHost`, `nextConfig` to the rest of the system?**
  _107 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Marketing and Content Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.06597222222222222 - nodes in this community are weakly interconnected._
- **Should `Admin Review Panel` be split into smaller, more focused modules?**
  _Cohesion score 0.06949152542372881 - nodes in this community are weakly interconnected._