-- Vehicle handover: pickup and return condition records. See SPEC.md §5e.
--
-- Two jobs:
--   1. Prove the person collecting the car is the person who was verified.
--      The host photographs the customer at the counter and confirms by eye
--      against the ID on file. No automated face matching in v1 — that keeps
--      us out of GDPR Article 9 biometric processing, and a human standing in
--      front of the customer is a better judge than a similarity score. The
--      photos are stored either way, so a match can be automated later without
--      touching this schema.
--   2. Fix the condition of the car in evidence, from BOTH sides, at both
--      moments. Customer-only return photos are self-serving (frame around the
--      dent); agency-only leaves the customer defenceless against an invented
--      claim. Two independent sets from the same five angles is what actually
--      settles an argument.
--
-- Damage claims close 2 HOURS after the agency records the return. A deadline
-- is the point: without one you get claims a week later that nobody can
-- adjudicate, and the customer has already flown home.

create type public.handover_kind as enum ('pickup', 'return');
create type public.handover_actor as enum ('agency', 'customer');

create table if not exists public.handovers (
  id             uuid primary key default gen_random_uuid(),
  booking_id     uuid not null references public.bookings(id) on delete cascade,
  kind           public.handover_kind not null,
  actor          public.handover_actor not null,
  actor_id       uuid not null references auth.users(id),
  photos         text[] not null,
  odometer_km    int,
  fuel_eighths   smallint check (fuel_eighths between 0 and 8),
  -- pickup + agency only: the live photo of the customer at the counter
  customer_photo_path text,
  identity_confirmed  boolean,
  notes          text,
  created_at     timestamptz not null default now(),
  -- one record per party per stage
  unique (booking_id, kind, actor)
);

create index if not exists handovers_booking_idx
  on public.handovers (booking_id, created_at);

alter table public.handovers enable row level security;

-- Both sides of a booking may read its handover records. Writes go through
-- record_handover() only, so photo counts and state transitions cannot be
-- bypassed by a crafted insert.
drop policy if exists "handovers readable by both parties" on public.handovers;
create policy "handovers readable by both parties" on public.handovers
  for select using (
    exists (
      select 1 from bookings b
      join vehicles v on v.id = b.vehicle_id
      where b.id = handovers.booking_id
        and (b.customer_id = auth.uid()
             or public.is_agency_member(v.agency_id)
             or public.is_admin())
    )
  );

alter table public.bookings
  add column if not exists picked_up_at timestamptz,
  add column if not exists returned_at timestamptz;

-- Private bucket: condition photos show number plates and sometimes people.
insert into storage.buckets (id, name, public)
values ('handover-photos', 'handover-photos', false)
on conflict (id) do nothing;

drop policy if exists "handover upload by participants" on storage.objects;
create policy "handover upload by participants" on storage.objects
  for insert with check (
    bucket_id = 'handover-photos' and auth.uid() is not null
  );

drop policy if exists "handover read by participants" on storage.objects;
create policy "handover read by participants" on storage.objects
  for select using (
    bucket_id = 'handover-photos'
    and (
      public.is_admin()
      -- path is <booking-id>/<...>, so the first segment names the booking
      or exists (
        select 1 from bookings b
        join vehicles v on v.id = b.vehicle_id
        where b.id::text = (storage.foldername(name))[1]
          and (b.customer_id = auth.uid() or public.is_agency_member(v.agency_id))
      )
    )
  );

/**
 * What the host needs on screen before releasing keys.
 *
 * Note what is NOT here: the passport or CIN scan. SPEC §5b says agencies
 * never see customer documents, and that still holds — the host is holding
 * the physical document at the counter anyway. All they need from us is the
 * verified FACE to compare, so we return the selfie path and nothing else
 * identifying. No document numbers, no address.
 */
create or replace function public.pickup_brief(p_booking uuid)
returns table (
  booking_id uuid, customer_name text, customer_phone text,
  kyc_verified boolean, selfie_path text, birth_date date,
  start_date date, end_date date, status public.booking_status,
  make text, model text, year int
)
language sql stable security definer set search_path = public as $$
  select b.id, p.full_name, p.phone,
         (p.kyc_status = 'verified'), p.selfie_path, p.birth_date,
         b.start_date, b.end_date, b.status, v.make, v.model, v.year
  from bookings b
  join vehicles v on v.id = b.vehicle_id
  join profiles p on p.id = b.customer_id
  where b.id = p_booking and public.is_agency_member(v.agency_id);
$$;

/**
 * The one crack we open in "agencies never see customer documents": the host
 * may load the customer's SELFIE, and only when all of these hold —
 *   * they work for the agency that owns the vehicle,
 *   * the booking is confirmed and not yet collected,
 *   * we are within a day of the pickup date.
 * Not the passport, not the licence, and not a minute outside that window.
 */
drop policy if exists "agency sees selfie at pickup" on storage.objects;
create policy "agency sees selfie at pickup" on storage.objects
  for select using (
    bucket_id = 'customer-docs'
    and exists (
      select 1
      from bookings b
      join vehicles v on v.id = b.vehicle_id
      join profiles p on p.id = b.customer_id
      where public.is_agency_member(v.agency_id)
        and b.status = 'confirmed'
        and p.selfie_path = storage.objects.name
        and b.start_date between current_date - 1 and current_date + 1
    )
  );

/**
 * Record one party's side of a handover.
 *
 * Enforces, in the database rather than the UI:
 *  - the caller is actually part of this booking, in the role they claim
 *  - five photos minimum
 *  - at pickup the agency must have seen a verified customer and ticked the
 *    identity confirmation; no keys leave the counter otherwise
 *  - status transitions: pickup -> active, both return sets -> completed
 */
create or replace function public.record_handover(
  p_booking uuid,
  p_kind public.handover_kind,
  p_photos text[],
  p_odometer int default null,
  p_fuel smallint default null,
  p_customer_photo text default null,
  p_identity_ok boolean default null,
  p_notes text default null
) returns table (ok boolean, booking_status public.booking_status, message text)
language plpgsql security definer set search_path = public as $$
declare
  b            bookings%rowtype;
  v_agency     uuid;
  v_is_agency  boolean;
  v_is_customer boolean;
  v_actor      public.handover_actor;
  v_kyc        public.kyc_status;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  select * into b from bookings where id = p_booking;
  if b.id is null then raise exception 'booking not found'; end if;

  select v.agency_id into v_agency from vehicles v where v.id = b.vehicle_id;
  v_is_agency   := public.is_agency_member(v_agency);
  v_is_customer := (b.customer_id = auth.uid());
  if not (v_is_agency or v_is_customer) then raise exception 'not allowed'; end if;
  v_actor := case when v_is_agency then 'agency' else 'customer' end;

  if coalesce(array_length(p_photos, 1), 0) < 5 then
    raise exception 'five photos required';
  end if;

  if p_kind = 'pickup' then
    if not v_is_agency then raise exception 'only the agency records pickup'; end if;
    if b.status <> 'confirmed' then
      return query select false, b.status, 'booking is not confirmed'::text; return;
    end if;
    select kyc_status into v_kyc from profiles where id = b.customer_id;
    if v_kyc <> 'verified' then
      return query select false, b.status,
        'customer identity not verified by CarKari'::text; return;
    end if;
    if coalesce(p_identity_ok, false) is not true then
      return query select false, b.status,
        'identity must be confirmed against the ID on file'::text; return;
    end if;
    if p_customer_photo is null then
      return query select false, b.status,
        'photo of the customer required'::text; return;
    end if;
  else
    if b.status <> 'active' then
      return query select false, b.status, 'vehicle is not out on rental'::text; return;
    end if;
  end if;

  insert into handovers (booking_id, kind, actor, actor_id, photos, odometer_km,
                         fuel_eighths, customer_photo_path, identity_confirmed, notes)
  values (p_booking, p_kind, v_actor, auth.uid(), p_photos, p_odometer,
          p_fuel, p_customer_photo, p_identity_ok, p_notes)
  on conflict (booking_id, kind, actor) do update
    set photos = excluded.photos, odometer_km = excluded.odometer_km,
        fuel_eighths = excluded.fuel_eighths,
        customer_photo_path = excluded.customer_photo_path,
        identity_confirmed = excluded.identity_confirmed,
        notes = excluded.notes, created_at = now();

  if p_kind = 'pickup' then
    update bookings set status = 'active', picked_up_at = now() where id = p_booking;
    return query select true, 'active'::public.booking_status, 'keys released'::text;
  end if;

  -- The rental only completes once BOTH sides have photographed the return.
  -- The agency's record starts the damage-claim clock.
  if v_actor = 'agency' then
    update bookings set returned_at = now() where id = p_booking;
  end if;

  if (select count(distinct actor) from handovers
      where booking_id = p_booking and kind = 'return') >= 2 then
    update bookings set status = 'completed' where id = p_booking;
    return query select true, 'completed'::public.booking_status,
      'return complete'::text;
  end if;

  return query select true, b.status,
    'recorded — waiting for the other party'::text;
end; $$;

-- ---------------------------------------------------------------------------
-- Damage claims
-- ---------------------------------------------------------------------------

create type public.claim_status as enum ('open', 'accepted', 'rejected', 'withdrawn');

create table if not exists public.damage_claims (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings(id) on delete cascade,
  raised_by   uuid not null references auth.users(id),
  description text not null,
  photos      text[] not null default '{}',
  amount_mad  bigint,
  status      public.claim_status not null default 'open',
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists damage_claims_booking_idx
  on public.damage_claims (booking_id, created_at desc);

alter table public.damage_claims enable row level security;

drop policy if exists "claims visible to both parties" on public.damage_claims;
create policy "claims visible to both parties" on public.damage_claims
  for select using (
    exists (
      select 1 from bookings b
      join vehicles v on v.id = b.vehicle_id
      where b.id = damage_claims.booking_id
        and (b.customer_id = auth.uid()
             or public.is_agency_member(v.agency_id)
             or public.is_admin())
    )
  );

/** Is the agency still inside the 2-hour window to raise damage? */
create or replace function public.claim_window(p_booking uuid)
returns table (open boolean, closes_at timestamptz)
language sql stable security definer set search_path = public as $$
  select (b.returned_at is not null
          and now() < b.returned_at + interval '2 hours'),
         b.returned_at + interval '2 hours'
  from bookings b where b.id = p_booking;
$$;

/**
 * File a damage claim. Agency only, and only within two hours of the return
 * being recorded — after that the rental is closed and cannot be reopened.
 */
create or replace function public.file_damage_claim(
  p_booking uuid, p_description text, p_photos text[], p_amount bigint default null
) returns table (ok boolean, message text)
language plpgsql security definer set search_path = public as $$
declare b bookings%rowtype; v_agency uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into b from bookings where id = p_booking;
  if b.id is null then raise exception 'booking not found'; end if;

  select v.agency_id into v_agency from vehicles v where v.id = b.vehicle_id;
  if not public.is_agency_member(v_agency) then raise exception 'not allowed'; end if;

  if b.returned_at is null then
    return query select false, 'the return has not been recorded yet'::text; return;
  end if;
  if now() > b.returned_at + interval '2 hours' then
    return query select false,
      'the 2-hour damage window closed at ' ||
      to_char(b.returned_at + interval '2 hours', 'HH24:MI')::text; return;
  end if;
  if coalesce(trim(p_description), '') = '' then
    return query select false, 'describe the damage'::text; return;
  end if;

  insert into damage_claims (booking_id, raised_by, description, photos, amount_mad)
  values (p_booking, auth.uid(), trim(p_description),
          coalesce(p_photos, '{}'), p_amount);

  return query select true, 'claim filed'::text;
end; $$;

/** Everything recorded for a booking, for either party's screen. */
create or replace function public.booking_handovers(p_booking uuid)
returns table (
  kind public.handover_kind, actor public.handover_actor,
  photos text[], odometer_km int, fuel_eighths smallint,
  identity_confirmed boolean, notes text, created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select h.kind, h.actor, h.photos, h.odometer_km, h.fuel_eighths,
         h.identity_confirmed, h.notes, h.created_at
  from handovers h
  join bookings b on b.id = h.booking_id
  join vehicles v on v.id = b.vehicle_id
  where h.booking_id = p_booking
    and (b.customer_id = auth.uid()
         or public.is_agency_member(v.agency_id)
         or public.is_admin())
  order by h.created_at;
$$;
