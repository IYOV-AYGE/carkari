-- CarKari core schema. See SPEC.md §4 for the model, §2 for money rules.
-- All money = integer centimes (MAD x 100).

create extension if not exists btree_gist;

-- ========== enums ==========
create type public.app_role as enum ('customer','admin');
create type public.agency_status as enum ('pending','verified','suspended');
create type public.member_role as enum ('owner','staff');
create type public.vehicle_status as enum ('draft','live','paused');
create type public.booking_status as enum (
  'pending_payment','confirmed','active','completed',
  'cancelled_customer','cancelled_agency','no_show');
create type public.payment_status as enum ('pending','succeeded','refunded','failed');

-- ========== tables ==========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  slug text not null unique,
  status public.agency_status not null default 'pending',
  city text not null,
  commission_rate numeric(4,3) not null default 0.175
    check (commission_rate between 0 and 0.5),
  strikes int not null default 0,
  created_at timestamptz not null default now()
);

create table public.agency_members (
  agency_id uuid not null references public.agencies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  member_role public.member_role not null default 'staff',
  primary key (agency_id, profile_id)
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  city text not null,
  address text not null,
  lat double precision,
  lng double precision
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  make text not null,
  model text not null,
  year int check (year between 1990 and 2100),
  category text not null,
  transmission text not null default 'manual',
  fuel text not null default 'diesel',
  seats int not null default 5,
  daily_price_mad bigint not null check (daily_price_mad > 0),
  currency text not null default 'MAD',
  status public.vehicle_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table public.vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  path text not null,
  sort int not null default 0
);

create table public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  check (end_date >= start_date)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id),
  customer_id uuid not null references public.profiles(id),
  start_date date not null,
  end_date date not null,
  total_mad bigint not null,
  deposit_mad bigint not null,
  balance_due_mad bigint not null,
  currency text not null default 'MAD',
  status public.booking_status not null default 'pending_payment',
  policy_accepted_at timestamptz,
  booked_at timestamptz not null default now(),
  check (end_date > start_date),
  -- no double-booking: overlapping date ranges blocked for active statuses
  constraint no_overlap exclude using gist (
    vehicle_id with =,
    daterange(start_date, end_date, '[)') with &&
  ) where (status in ('pending_payment','confirmed','active'))
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id),
  provider text not null default 'stripe',
  provider_ref text,
  amount_mad bigint not null,
  currency text not null default 'MAD',
  status public.payment_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table public.favorites (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  primary key (profile_id, vehicle_id)
);

create index on public.vehicles (agency_id);
create index on public.vehicles (status, category);
create index on public.bookings (customer_id);
create index on public.bookings (vehicle_id, start_date);

-- ========== helper functions (security definer, used by RLS) ==========
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_agency_member(p_agency uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from agency_members
                 where agency_id = p_agency and profile_id = auth.uid());
$$;

-- auto-create profile on signup
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========== booking creation: ALL money math server-side ==========
-- Client calls this RPC with vehicle + dates only. See SPEC.md §2.
create or replace function public.create_booking(
  p_vehicle uuid, p_start date, p_end date, p_policy_accepted boolean
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_days int; v_price bigint; v_rate numeric; v_total bigint;
  v_deposit bigint; v_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if not p_policy_accepted then raise exception 'policy not accepted'; end if;
  if p_start < current_date then raise exception 'start date in past'; end if;

  select v.daily_price_mad, a.commission_rate
    into v_price, v_rate
    from vehicles v join agencies a on a.id = v.agency_id
   where v.id = p_vehicle and v.status = 'live' and a.status = 'verified';
  if not found then raise exception 'vehicle not bookable'; end if;

  -- availability blocks check (double-booking handled by exclusion constraint)
  if exists (select 1 from availability_blocks
              where vehicle_id = p_vehicle
                and daterange(start_date, end_date, '[]')
                 && daterange(p_start, p_end, '[)')) then
    raise exception 'vehicle unavailable for these dates';
  end if;

  v_days := p_end - p_start;
  if v_days < 1 then raise exception 'minimum 1 day'; end if;
  v_total := v_price * v_days;
  v_deposit := ceil(v_total * v_rate);

  insert into bookings (vehicle_id, customer_id, start_date, end_date,
    total_mad, deposit_mad, balance_due_mad, policy_accepted_at)
  values (p_vehicle, auth.uid(), p_start, p_end,
    v_total, v_deposit, v_total - v_deposit, now())
  returning id into v_id;
  return v_id;
end; $$;

-- refund eligibility per SPEC.md §2 refund policy
create or replace function public.refund_eligible(p_booking uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when (b.start_date::timestamptz - b.booked_at) <= interval '48 hours' then false
    when now() <= b.booked_at + interval '24 hours' then true
    else false
  end
  from bookings b where b.id = p_booking;
$$;

-- ========== row-level security ==========
alter table public.profiles enable row level security;
alter table public.agencies enable row level security;
alter table public.agency_members enable row level security;
alter table public.branches enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_images enable row level security;
alter table public.availability_blocks enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;

-- profiles: self + admin
create policy "own profile read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "own profile update" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = 'customer');

-- agencies: public sees verified; members + admin see own
create policy "public verified agencies" on public.agencies
  for select using (status = 'verified' or public.is_agency_member(id) or public.is_admin());
create policy "admin manages agencies" on public.agencies
  for all using (public.is_admin());
create policy "owner updates own agency" on public.agencies
  for update using (public.is_agency_member(id))
  with check (public.is_agency_member(id));

-- agency_members: members + admin
create policy "members read own" on public.agency_members
  for select using (profile_id = auth.uid() or public.is_agency_member(agency_id) or public.is_admin());
create policy "admin manages members" on public.agency_members
  for all using (public.is_admin());

-- branches: public read for verified agencies; members manage
create policy "public branches" on public.branches
  for select using (
    exists (select 1 from agencies a where a.id = agency_id and a.status = 'verified')
    or public.is_agency_member(agency_id) or public.is_admin());
create policy "members manage branches" on public.branches
  for all using (public.is_agency_member(agency_id) or public.is_admin());

-- vehicles: public sees live+verified; members manage own
create policy "public live vehicles" on public.vehicles
  for select using (
    (status = 'live' and exists
      (select 1 from agencies a where a.id = agency_id and a.status = 'verified'))
    or public.is_agency_member(agency_id) or public.is_admin());
create policy "members manage vehicles" on public.vehicles
  for all using (public.is_agency_member(agency_id) or public.is_admin());

-- vehicle_images: follow vehicle visibility
create policy "images follow vehicle" on public.vehicle_images
  for select using (exists (select 1 from vehicles v where v.id = vehicle_id));
create policy "members manage images" on public.vehicle_images
  for all using (exists (select 1 from vehicles v where v.id = vehicle_id
    and (public.is_agency_member(v.agency_id) or public.is_admin())));

-- availability: same as vehicle management; public read for calendars
create policy "public availability" on public.availability_blocks
  for select using (true);
create policy "members manage availability" on public.availability_blocks
  for all using (exists (select 1 from vehicles v where v.id = vehicle_id
    and (public.is_agency_member(v.agency_id) or public.is_admin())));

-- bookings: customer own; agency sees bookings on its vehicles; admin all.
-- INSERT only via create_booking() RPC (security definer) — no direct insert policy.
create policy "customer own bookings" on public.bookings
  for select using (customer_id = auth.uid()
    or exists (select 1 from vehicles v where v.id = vehicle_id
               and public.is_agency_member(v.agency_id))
    or public.is_admin());
create policy "admin manages bookings" on public.bookings
  for update using (public.is_admin());

-- payments: read-only for the customer + admin; writes via service role only
create policy "customer own payments" on public.payments
  for select using (
    exists (select 1 from bookings b where b.id = booking_id and b.customer_id = auth.uid())
    or public.is_admin());

-- reviews: public read; author insert only after completed booking
create policy "public reviews" on public.reviews for select using (true);
create policy "review own completed booking" on public.reviews
  for insert with check (exists (select 1 from bookings b
    where b.id = booking_id and b.customer_id = auth.uid() and b.status = 'completed'));

-- favorites: own only
create policy "own favorites" on public.favorites
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
