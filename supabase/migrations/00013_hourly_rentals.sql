-- Quads (ATV) and jet skis, rented by the hour. See SPEC.md §2b.
--
-- Cars are priced and booked per DAY. Quads and jet skis are priced and booked
-- per HOUR — that is simply how the market sells them, and pricing a 1-hour
-- jet ski as a "day" would confuse every customer who ever books one.
--
-- The rental unit belongs to the VEHICLE, not the booking: a jet ski is never
-- rented by the day, a car never by the hour. That single fact keeps this
-- simple — the two booking paths never meet on the same vehicle, so they can
-- have separate overlap constraints without ever fighting each other.
--
-- Identity rules are unchanged and deliberately so: same KYC, same liveness,
-- same counter check, licence held 1+ year, 21+. A quad on a public road is a
-- vehicle like any other, and we would rather refuse a rental than discover
-- afterwards that the standard was lower for the fast toys.

alter table public.vehicles
  add column if not exists rental_unit text not null default 'day'
    check (rental_unit in ('day', 'hour')),
  add column if not exists hourly_price_mad bigint
    check (hourly_price_mad is null or hourly_price_mad > 0),
  add column if not exists min_hours int not null default 1
    check (min_hours between 1 and 24);

-- An hourly vehicle without an hourly price is unsellable, so refuse it.
alter table public.vehicles drop constraint if exists vehicles_price_for_unit;
alter table public.vehicles add constraint vehicles_price_for_unit check (
  rental_unit = 'day' or hourly_price_mad is not null
);

alter table public.bookings
  add column if not exists unit text not null default 'day'
    check (unit in ('day', 'hour')),
  add column if not exists start_at timestamptz,
  add column if not exists end_at timestamptz,
  add column if not exists hours int;

-- The original table check demanded end_date > start_date, which an hourly
-- booking (same calendar day) can never satisfy. Replace it with one that
-- knows about both shapes.
do $$
declare c text;
begin
  select conname into c from pg_constraint
   where conrelid = 'public.bookings'::regclass
     and contype = 'c'
     and pg_get_constraintdef(oid) ilike '%end_date > start_date%';
  if c is not null then
    execute format('alter table public.bookings drop constraint %I', c);
  end if;
end $$;

alter table public.bookings drop constraint if exists bookings_period_shape;
alter table public.bookings add constraint bookings_period_shape check (
  (unit = 'day'  and end_date > start_date)
  or
  (unit = 'hour' and end_date = start_date
                 and start_at is not null and end_at is not null
                 and end_at > start_at)
);

-- Second overlap guard, for hourly vehicles. The day constraint (`no_overlap`,
-- on daterange) still guards cars; an hourly row produces an empty daterange
-- so the two never interfere.
alter table public.bookings drop constraint if exists no_overlap_hourly;
alter table public.bookings add constraint no_overlap_hourly exclude using gist (
  vehicle_id with =,
  tstzrange(start_at, end_at, '[)') with &&
) where (unit = 'hour' and status in ('pending_payment','confirmed','active'));

/** Price an hourly rental. Mirrors quote_booking, in hours. */
create or replace function public.quote_booking_hours(
  p_vehicle uuid, p_start timestamptz, p_hours int
) returns table (
  hours int, total_mad bigint, deposit_mad bigint, balance_mad bigint,
  available boolean
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_price bigint; v_rate numeric; v_min int; v_unit text;
  v_total bigint; v_dep bigint; v_end timestamptz; v_ok boolean := true;
begin
  select v.hourly_price_mad, a.commission_rate, v.min_hours, v.rental_unit
    into v_price, v_rate, v_min, v_unit
    from vehicles v join agencies a on a.id = v.agency_id
   where v.id = p_vehicle and v.status = 'live' and a.status = 'verified';
  if not found or v_unit <> 'hour' or v_price is null then
    return query select 0, 0::bigint, 0::bigint, 0::bigint, false; return;
  end if;
  if p_hours is null or p_hours < greatest(v_min, 1) then
    return query select 0, 0::bigint, 0::bigint, 0::bigint, false; return;
  end if;

  v_end := p_start + make_interval(hours => p_hours);

  if exists (select 1 from availability_blocks
              where vehicle_id = p_vehicle
                and daterange(start_date, end_date, '[]')
                 && daterange(p_start::date, v_end::date, '[]'))
     or exists (select 1 from bookings
              where vehicle_id = p_vehicle
                and unit = 'hour'
                and status in ('pending_payment','confirmed','active')
                and tstzrange(start_at, end_at, '[)')
                 && tstzrange(p_start, v_end, '[)'))
  then v_ok := false; end if;

  v_total := v_price * p_hours;
  v_dep := ceil(v_total * v_rate);
  return query select p_hours, v_total, v_dep, v_total - v_dep, v_ok;
end; $$;

/** Book an hourly vehicle. Money is computed here, never sent by the client. */
create or replace function public.create_booking_hours(
  p_vehicle uuid, p_start timestamptz, p_hours int, p_policy_accepted boolean
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_price bigint; v_rate numeric; v_min int; v_unit text;
  v_total bigint; v_dep bigint; v_end timestamptz; v_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if not p_policy_accepted then raise exception 'policy not accepted'; end if;
  if p_start < now() then raise exception 'start time in past'; end if;

  select v.hourly_price_mad, a.commission_rate, v.min_hours, v.rental_unit
    into v_price, v_rate, v_min, v_unit
    from vehicles v join agencies a on a.id = v.agency_id
   where v.id = p_vehicle and v.status = 'live' and a.status = 'verified';
  if not found then raise exception 'vehicle not bookable'; end if;
  if v_unit <> 'hour' or v_price is null then
    raise exception 'this vehicle is not rented by the hour';
  end if;
  if p_hours is null or p_hours < greatest(v_min, 1) then
    raise exception 'minimum % hours', greatest(v_min, 1);
  end if;

  v_end := p_start + make_interval(hours => p_hours);

  if exists (select 1 from availability_blocks
              where vehicle_id = p_vehicle
                and daterange(start_date, end_date, '[]')
                 && daterange(p_start::date, v_end::date, '[]')) then
    raise exception 'vehicle unavailable at that time';
  end if;

  v_total := v_price * p_hours;
  v_dep := ceil(v_total * v_rate);

  -- start_date = end_date for hourly rows; the shape check expects that, and
  -- everything that reads bookings by date keeps working unchanged.
  insert into bookings (vehicle_id, customer_id, unit,
    start_date, end_date, start_at, end_at, hours,
    total_mad, deposit_mad, balance_due_mad, policy_accepted_at)
  values (p_vehicle, auth.uid(), 'hour',
    p_start::date, p_start::date, p_start, v_end, p_hours,
    v_total, v_dep, v_total - v_dep, now())
  returning id into v_id;
  return v_id;
end; $$;

-- Refund policy is measured from the moment the rental STARTS, which for an
-- hourly booking is start_at rather than midnight on start_date.
create or replace function public.refund_eligible(p_booking uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when (coalesce(b.start_at, b.start_date::timestamptz) - b.booked_at)
         <= interval '48 hours' then false
    when now() <= b.booked_at + interval '24 hours' then true
    else false
  end
  from bookings b where b.id = p_booking;
$$;

create or replace function public.cancel_booking(p_booking uuid)
returns table (cancelled boolean, refund_due boolean)
language plpgsql security definer set search_path = public as $$
declare b record; v_refund boolean; v_start timestamptz;
begin
  select * into b from bookings where id = p_booking;
  if not found then raise exception 'booking not found'; end if;
  if b.customer_id <> auth.uid() and not public.is_admin() then
    raise exception 'not allowed';
  end if;
  if b.status not in ('pending_payment','confirmed') then
    raise exception 'booking cannot be cancelled';
  end if;

  v_start := coalesce(b.start_at, b.start_date::timestamptz);
  if (v_start - b.booked_at) <= interval '48 hours' then
    v_refund := false;
  elsif now() <= b.booked_at + interval '24 hours' then
    v_refund := true;
  else
    v_refund := false;
  end if;

  update bookings set status = 'cancelled_customer' where id = p_booking;
  return query select true, v_refund;
end; $$;

-- Customer's list gains the unit, the times and the hour count.
drop function if exists public.my_bookings();

create function public.my_bookings() returns table (
  id uuid, start_date date, end_date date, status public.booking_status,
  total_mad bigint, deposit_mad bigint, balance_due_mad bigint,
  make text, model text, year int, agency_name text, city text,
  agency_avatar_path text, category text,
  unit text, start_at timestamptz, end_at timestamptz, hours int,
  booked_at timestamptz, refundable boolean
)
language sql stable security definer set search_path = public as $$
  select b.id, b.start_date, b.end_date, b.status, b.total_mad, b.deposit_mad,
         b.balance_due_mad, v.make, v.model, v.year, a.legal_name, a.city,
         a.avatar_path, v.category,
         b.unit, b.start_at, b.end_at, b.hours,
         b.booked_at,
         case
           when (coalesce(b.start_at, b.start_date::timestamptz) - b.booked_at)
                <= interval '48 hours' then false
           when now() <= b.booked_at + interval '24 hours' then true
           else false
         end
  from bookings b
  join vehicles v on v.id = b.vehicle_id
  join agencies a on a.id = v.agency_id
  where b.customer_id = auth.uid()
  order by b.booked_at desc;
$$;
