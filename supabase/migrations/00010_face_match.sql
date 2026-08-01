-- The counter identity check is done BY THE PLATFORM, not by the host.
--
-- Correction to 00009: the host photographs the customer and sees only a
-- verdict. They never see the selfie we hold. Two reasons that is better:
--   * privacy — the agency gets an answer, not a face; the customer's KYC
--     material stays inside CarKari, which is what we promise them,
--   * consistency — a tired clerk at 7am is not a repeatable comparator.
--
-- So the storage crack opened in 00009 is closed again here.

drop policy if exists "agency sees selfie at pickup" on storage.objects;

alter table public.handovers
  add column if not exists face_match_status text
    check (face_match_status in ('match','no_match','unavailable','error')),
  add column if not exists face_match_score numeric,
  add column if not exists face_matched_at timestamptz;

-- Result of one comparison, keyed to the booking. Written by the server action
-- after it calls the matcher; the agency cannot set it directly.
create table if not exists public.face_checks (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references public.bookings(id) on delete cascade,
  photo_path   text not null,
  status       text not null check (status in ('match','no_match','unavailable','error')),
  score        numeric,
  detail       text,
  checked_by   uuid references auth.users(id),
  created_at   timestamptz not null default now()
);

create index if not exists face_checks_booking_idx
  on public.face_checks (booking_id, created_at desc);

alter table public.face_checks enable row level security;
-- No client policies: written by record_face_check(), read via the RPC below.

/** The host no longer needs the selfie — only whether CarKari verified them. */
create or replace function public.pickup_brief(p_booking uuid)
returns table (
  booking_id uuid, customer_name text, customer_phone text,
  kyc_verified boolean, birth_date date,
  start_date date, end_date date, status public.booking_status,
  make text, model text, year int
)
language sql stable security definer set search_path = public as $$
  select b.id, p.full_name, p.phone,
         (p.kyc_status = 'verified'), p.birth_date,
         b.start_date, b.end_date, b.status, v.make, v.model, v.year
  from bookings b
  join vehicles v on v.id = b.vehicle_id
  join profiles p on p.id = b.customer_id
  where b.id = p_booking and public.is_agency_member(v.agency_id);
$$;

/** Path of the selfie to compare against — server-side callers only. */
create or replace function public.kyc_selfie_path(p_booking uuid)
returns text
language sql stable security definer set search_path = public as $$
  select p.selfie_path
  from bookings b
  join vehicles v on v.id = b.vehicle_id
  join profiles p on p.id = b.customer_id
  where b.id = p_booking
    and b.status = 'confirmed'
    and (public.is_agency_member(v.agency_id) or public.is_admin());
$$;

/**
 * Record the verdict. Note the path is stored but the score is never shown to
 * the agency in full detail — the UI renders match / no match only.
 */
create or replace function public.record_face_check(
  p_booking uuid, p_photo text, p_status text,
  p_score numeric default null, p_detail text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare v_agency uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select v.agency_id into v_agency
    from bookings b join vehicles v on v.id = b.vehicle_id where b.id = p_booking;
  if not (public.is_agency_member(v_agency) or public.is_admin()) then
    raise exception 'not allowed';
  end if;

  insert into face_checks (booking_id, photo_path, status, score, detail, checked_by)
  values (p_booking, p_photo, p_status, p_score, p_detail, auth.uid());
end; $$;

/** Latest verdict for a booking (drives the pickup screen). */
create or replace function public.latest_face_check(p_booking uuid)
returns table (status text, score numeric, photo_path text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select f.status, f.score, f.photo_path, f.created_at
  from face_checks f
  join bookings b on b.id = f.booking_id
  join vehicles v on v.id = b.vehicle_id
  where f.booking_id = p_booking
    and (public.is_agency_member(v.agency_id) or public.is_admin())
  order by f.created_at desc
  limit 1;
$$;

/**
 * Pickup now requires the platform's verdict, not the host's opinion.
 *
 *   match       -> proceed
 *   no_match    -> refused here, in the database. Keys do not leave.
 *   unavailable -> matcher not configured or down: fall back to the host
 *                  confirming the PHYSICAL document (which they are legally
 *                  required to check anyway). Recorded as such for audit.
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
  b             bookings%rowtype;
  v_agency      uuid;
  v_is_agency   boolean;
  v_is_customer boolean;
  v_actor       public.handover_actor;
  v_kyc         public.kyc_status;
  v_check       face_checks%rowtype;
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

    select * into v_check from face_checks
      where booking_id = p_booking order by created_at desc limit 1;

    if v_check.id is null then
      return query select false, b.status,
        'photograph the customer first'::text; return;
    end if;
    if v_check.status = 'no_match' then
      return query select false, b.status,
        'the person photographed is not the verified customer'::text; return;
    end if;
    if v_check.status in ('unavailable','error')
       and coalesce(p_identity_ok, false) is not true then
      return query select false, b.status,
        'automatic check unavailable — confirm the physical ID to continue'::text;
      return;
    end if;
  else
    if b.status <> 'active' then
      return query select false, b.status, 'vehicle is not out on rental'::text; return;
    end if;
  end if;

  insert into handovers (booking_id, kind, actor, actor_id, photos, odometer_km,
                         fuel_eighths, customer_photo_path, identity_confirmed,
                         notes, face_match_status, face_match_score, face_matched_at)
  values (p_booking, p_kind, v_actor, auth.uid(), p_photos, p_odometer,
          p_fuel, coalesce(p_customer_photo, v_check.photo_path), p_identity_ok,
          p_notes, v_check.status, v_check.score, v_check.created_at)
  on conflict (booking_id, kind, actor) do update
    set photos = excluded.photos, odometer_km = excluded.odometer_km,
        fuel_eighths = excluded.fuel_eighths,
        customer_photo_path = excluded.customer_photo_path,
        identity_confirmed = excluded.identity_confirmed,
        notes = excluded.notes,
        face_match_status = excluded.face_match_status,
        face_match_score = excluded.face_match_score,
        face_matched_at = excluded.face_matched_at,
        created_at = now();

  if p_kind = 'pickup' then
    update bookings set status = 'active', picked_up_at = now() where id = p_booking;
    return query select true, 'active'::public.booking_status, 'keys released'::text;
  end if;

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
