-- In-house face matching, without ever handing a face to anyone. §5e.
--
-- At verification we compute a FACE DESCRIPTOR from the customer's liveness
-- selfie: 128 floating-point numbers describing the geometry of that face.
-- At the counter the host's browser receives the DESCRIPTOR — never the photo —
-- computes one from the fresh capture, and compares them on the device. Green
-- or red appears immediately, so the host knows whether to hand over the keys.
--
-- Why a descriptor is safe to send where a photo is not: it is a lossy,
-- one-way summary. You cannot reconstruct a usable portrait from 128 floats,
-- and it is worthless to an agency for any purpose except this comparison.
-- The photograph itself stays inside CarKari, as promised.
--
-- The browser verdict decides whether KEYS MOVE, because that decision has to
-- happen in three seconds at a counter. CarKari's own review decides whether
-- the RENTAL IS FLAGGED, because a browser check can be tampered with by a
-- modified client. Two verdicts, two different jobs.

alter table public.profiles
  -- float8[] rather than vector: no pgvector dependency, and we only ever
  -- compare one pair at a time, so no index is needed.
  add column if not exists face_descriptor float8[],
  add column if not exists face_descriptor_at timestamptz;

alter table public.counter_photos
  add column if not exists device_verdict text
    check (device_verdict in ('match','no_match','unavailable')),
  add column if not exists device_distance numeric;

/** Store my own descriptor, computed in the browser during verification. */
create or replace function public.set_face_descriptor(p_descriptor float8[])
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_descriptor is not null and array_length(p_descriptor, 1) <> 128 then
    raise exception 'invalid descriptor';
  end if;
  update profiles
     set face_descriptor = p_descriptor, face_descriptor_at = now()
   where id = auth.uid();
end; $$;

/**
 * The descriptor the host's device needs, released only when all of these
 * hold: the caller works for the agency that owns the vehicle, the booking is
 * confirmed, the customer is KYC-verified, and we are within a day of pickup.
 * Returns numbers. Never a path, never an image.
 */
create or replace function public.booking_face_descriptor(p_booking uuid)
returns float8[]
language sql stable security definer set search_path = public as $$
  select p.face_descriptor
  from bookings b
  join vehicles v on v.id = b.vehicle_id
  join profiles p on p.id = b.customer_id
  where b.id = p_booking
    and b.status = 'confirmed'
    and p.kyc_status = 'verified'
    and b.start_date between current_date - 1 and current_date + 1
    and public.is_agency_member(v.agency_id);
$$;

/** Host: record the counter photo together with what the device concluded. */
create or replace function public.capture_counter_photo(
  p_booking uuid,
  p_photo text,
  p_device_verdict text default null,
  p_distance numeric default null
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

  insert into counter_photos (booking_id, photo_path, taken_by,
                              device_verdict, device_distance)
  values (p_booking, p_photo, auth.uid(), p_device_verdict, p_distance);
end; $$;

/**
 * Pickup gate.
 *
 * A device verdict of `no_match` stops the handover in the database — not just
 * in the interface — so a tampered client cannot talk its way past it either.
 * `unavailable` (no descriptor on file, or the model failed to find a face)
 * falls back to the host confirming the PHYSICAL document, which they are
 * legally required to check regardless.
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
    if v_photo.status = 'no_match' or v_photo.device_verdict = 'no_match' then
      return query select false, b.status,
        'this is not the verified customer — do not release the vehicle'::text;
      return;
    end if;
    if coalesce(v_photo.device_verdict, 'unavailable') = 'unavailable'
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
                         notes, counter_photo_status)
  values (p_booking, p_kind, v_actor, auth.uid(), p_photos, p_odometer,
          p_fuel, coalesce(p_customer_photo, v_photo.photo_path), p_identity_ok,
          p_notes, v_photo.status)
  on conflict (booking_id, kind, actor) do update
    set photos = excluded.photos, odometer_km = excluded.odometer_km,
        fuel_eighths = excluded.fuel_eighths,
        customer_photo_path = excluded.customer_photo_path,
        identity_confirmed = excluded.identity_confirmed,
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

-- CarKari's review queue also shows what the device concluded, so a device
-- that says "match" while the photos plainly differ becomes visible.
create or replace function public.admin_counter_queue()
returns table (
  id uuid, booking_id uuid, photo_path text, selfie_path text,
  customer_name text, agency_name text, status text,
  device_verdict text, device_distance numeric, created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select c.id, c.booking_id, c.photo_path, p.selfie_path,
         p.full_name, a.legal_name, c.status,
         c.device_verdict, c.device_distance, c.created_at
  from counter_photos c
  join bookings b on b.id = c.booking_id
  join vehicles v on v.id = b.vehicle_id
  join agencies a on a.id = v.agency_id
  join profiles p on p.id = b.customer_id
  where public.is_admin()
  order by (c.status = 'pending_review') desc, c.created_at desc
  limit 200;
$$;
