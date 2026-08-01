-- Counter photo at pickup — CarKari verifies, nobody else. See SPEC.md §5e.
--
-- Correction to 00009. The division of labour is now absolute:
--
--   HOST      takes one photo of the customer through the platform.
--             Sees no ID, no passport, no selfie, no verdict to make.
--             Their job is to capture, not to judge.
--   CARKARI   holds every document, compares the counter photo against the
--             verified selfie, and is the only party that decides identity.
--   CUSTOMER  their documents never leave CarKari. The agency learns only
--             that we verified them.
--
-- No third-party matcher (no AWS, no Stripe Identity). We review in
-- /admin/comptoir. The interface is shaped so an automatic matcher can be
-- dropped in later — it would simply write the same verdict rows.
--
-- Timing note: the review does NOT block the counter. A queue at 7am cannot
-- wait for a human in an office, and the customer was already KYC-verified
-- online before booking. The photo is captured, keys are released, and CarKari
-- reviews right after. A `no_match` verdict flags the rental for follow-up
-- rather than pretending we can undo a handover that already happened.

drop policy if exists "agency sees selfie at pickup" on storage.objects;

alter table public.handovers
  add column if not exists counter_photo_status text
    check (counter_photo_status in ('pending_review','match','no_match')),
  add column if not exists counter_photo_reviewed_at timestamptz;

/**
 * One counter photo and its eventual verdict.
 *
 *   pending_review  captured, waiting for CarKari
 *   match           CarKari confirms it is the verified customer
 *   no_match        it is not — the rental is flagged
 */
create table if not exists public.counter_photos (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references public.bookings(id) on delete cascade,
  photo_path   text not null,
  status       text not null default 'pending_review'
                 check (status in ('pending_review','match','no_match')),
  taken_by     uuid not null references auth.users(id),
  reviewed_by  uuid references auth.users(id),
  review_note  text,
  created_at   timestamptz not null default now(),
  reviewed_at  timestamptz
);

create index if not exists counter_photos_pending_idx
  on public.counter_photos (status, created_at desc);
create index if not exists counter_photos_booking_idx
  on public.counter_photos (booking_id, created_at desc);

alter table public.counter_photos enable row level security;
-- No client policies at all. The agency writes through capture_counter_photo()
-- and reads a status through latest_counter_photo(); only admins see the image.

/** Host: record the photo taken at the counter. Returns nothing to judge. */
create or replace function public.capture_counter_photo(
  p_booking uuid, p_photo text
) returns void
language plpgsql security definer set search_path = public as $$
declare v_agency uuid; v_status public.booking_status;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select v.agency_id, b.status into v_agency, v_status
    from bookings b join vehicles v on v.id = b.vehicle_id where b.id = p_booking;
  if v_agency is null then raise exception 'booking not found'; end if;
  if not public.is_agency_member(v_agency) then raise exception 'not allowed'; end if;
  if v_status <> 'confirmed' then raise exception 'booking is not confirmed'; end if;

  insert into counter_photos (booking_id, photo_path, taken_by)
  values (p_booking, p_photo, auth.uid());
end; $$;

/** Host: has a photo been captured for this booking? Status only, no image. */
create or replace function public.latest_counter_photo(p_booking uuid)
returns table (status text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select c.status, c.created_at
  from counter_photos c
  join bookings b on b.id = c.booking_id
  join vehicles v on v.id = b.vehicle_id
  where c.booking_id = p_booking
    and (public.is_agency_member(v.agency_id) or public.is_admin())
  order by c.created_at desc
  limit 1;
$$;

/**
 * CarKari's review queue: the counter photo next to the verified selfie.
 * Admins only — this is the one place both images appear together.
 */
create or replace function public.admin_counter_queue()
returns table (
  id uuid, booking_id uuid, photo_path text, selfie_path text,
  customer_name text, agency_name text, status text, created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select c.id, c.booking_id, c.photo_path, p.selfie_path,
         p.full_name, a.legal_name, c.status, c.created_at
  from counter_photos c
  join bookings b on b.id = c.booking_id
  join vehicles v on v.id = b.vehicle_id
  join agencies a on a.id = v.agency_id
  join profiles p on p.id = b.customer_id
  where public.is_admin()
  order by (c.status = 'pending_review') desc, c.created_at desc
  limit 200;
$$;

/** CarKari's verdict. Mirrored onto the handover record for the audit trail. */
create or replace function public.admin_set_counter_verdict(
  p_check uuid, p_status text, p_note text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare v_booking uuid;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if p_status not in ('match','no_match') then raise exception 'invalid verdict'; end if;

  update counter_photos
     set status = p_status, reviewed_by = auth.uid(),
         review_note = p_note, reviewed_at = now()
   where id = p_check
   returning booking_id into v_booking;

  update handovers
     set counter_photo_status = p_status, counter_photo_reviewed_at = now()
   where booking_id = v_booking and kind = 'pickup';
end; $$;

/**
 * Pickup rules.
 *
 * The host must have captured a photo — that is enforced. They are NOT asked
 * to confirm identity, because identity is not theirs to confirm. If CarKari
 * has already reviewed and rejected an earlier photo for this booking, the
 * handover is refused outright.
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
  v_photo       counter_photos%rowtype;
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

    -- CarKari verified this customer online. That gate is ours, not the host's.
    select kyc_status into v_kyc from profiles where id = b.customer_id;
    if v_kyc <> 'verified' then
      return query select false, b.status,
        'customer identity not verified by CarKari'::text; return;
    end if;

    select * into v_photo from counter_photos
      where booking_id = p_booking order by created_at desc limit 1;

    if v_photo.id is null then
      return query select false, b.status,
        'photograph the customer first'::text; return;
    end if;
    if v_photo.status = 'no_match' then
      return query select false, b.status,
        'CarKari could not confirm this person — do not release the vehicle'::text;
      return;
    end if;
  else
    if b.status <> 'active' then
      return query select false, b.status, 'vehicle is not out on rental'::text; return;
    end if;
  end if;

  insert into handovers (booking_id, kind, actor, actor_id, photos, odometer_km,
                         fuel_eighths, customer_photo_path, notes,
                         counter_photo_status)
  values (p_booking, p_kind, v_actor, auth.uid(), p_photos, p_odometer,
          p_fuel, coalesce(p_customer_photo, v_photo.photo_path), p_notes,
          v_photo.status)
  on conflict (booking_id, kind, actor) do update
    set photos = excluded.photos, odometer_km = excluded.odometer_km,
        fuel_eighths = excluded.fuel_eighths,
        customer_photo_path = excluded.customer_photo_path,
        notes = excluded.notes,
        counter_photo_status = excluded.counter_photo_status,
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
