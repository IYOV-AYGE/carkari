-- Booking flow: quote, cancel with refund policy, listing helpers.
-- Refund rules live in SPEC.md §2 and are enforced HERE (authoritative).

-- Price quote before booking: client sends vehicle + dates, server computes.
create or replace function public.quote_booking(
  p_vehicle uuid, p_start date, p_end date
) returns table (
  days int, total_mad bigint, deposit_mad bigint, balance_mad bigint,
  available boolean
)
language plpgsql stable security definer set search_path = public as $$
declare v_price bigint; v_rate numeric; v_days int; v_total bigint; v_dep bigint;
        v_ok boolean := true;
begin
  select v.daily_price_mad, a.commission_rate into v_price, v_rate
    from vehicles v join agencies a on a.id = v.agency_id
   where v.id = p_vehicle and v.status = 'live' and a.status = 'verified';
  if not found then
    return query select 0, 0::bigint, 0::bigint, 0::bigint, false; return;
  end if;

  v_days := greatest(p_end - p_start, 0);
  if v_days < 1 then
    return query select 0, 0::bigint, 0::bigint, 0::bigint, false; return;
  end if;

  if exists (select 1 from availability_blocks
              where vehicle_id = p_vehicle
                and daterange(start_date, end_date, '[]') && daterange(p_start, p_end, '[)'))
     or exists (select 1 from bookings
              where vehicle_id = p_vehicle
                and status in ('pending_payment','confirmed','active')
                and daterange(start_date, end_date, '[)') && daterange(p_start, p_end, '[)'))
  then v_ok := false; end if;

  v_total := v_price * v_days;
  v_dep := ceil(v_total * v_rate);
  return query select v_days, v_total, v_dep, v_total - v_dep, v_ok;
end; $$;

-- Cancel: applies the refund policy and returns whether a refund is due.
create or replace function public.cancel_booking(p_booking uuid)
returns table (cancelled boolean, refund_due boolean)
language plpgsql security definer set search_path = public as $$
declare b record; v_refund boolean;
begin
  select * into b from bookings where id = p_booking;
  if not found then raise exception 'booking not found'; end if;
  if b.customer_id <> auth.uid() and not public.is_admin() then
    raise exception 'not allowed';
  end if;
  if b.status not in ('pending_payment','confirmed') then
    raise exception 'booking cannot be cancelled';
  end if;

  -- SPEC.md §2: <=48h before pickup → never refundable;
  -- otherwise refundable within 24h of booking.
  if (b.start_date::timestamptz - b.booked_at) <= interval '48 hours' then
    v_refund := false;
  elsif now() <= b.booked_at + interval '24 hours' then
    v_refund := true;
  else
    v_refund := false;
  end if;

  update bookings set status = 'cancelled_customer' where id = p_booking;
  return query select true, v_refund;
end; $$;

-- Bookings with vehicle info for the customer's list.
create or replace function public.my_bookings() returns table (
  id uuid, start_date date, end_date date, status public.booking_status,
  total_mad bigint, deposit_mad bigint, balance_due_mad bigint,
  booked_at timestamptz, make text, model text, year int,
  agency_name text, city text, refundable boolean
)
language sql stable security definer set search_path = public as $$
  select b.id, b.start_date, b.end_date, b.status, b.total_mad, b.deposit_mad,
         b.balance_due_mad, b.booked_at, v.make, v.model, v.year,
         a.legal_name, a.city,
         case
           when (b.start_date::timestamptz - b.booked_at) <= interval '48 hours' then false
           when now() <= b.booked_at + interval '24 hours' then true
           else false
         end
  from bookings b
  join vehicles v on v.id = b.vehicle_id
  join agencies a on a.id = v.agency_id
  where b.customer_id = auth.uid()
  order by b.booked_at desc;
$$;

-- Bookings for the agency dashboard (own vehicles only).
create or replace function public.agency_bookings() returns table (
  id uuid, start_date date, end_date date, status public.booking_status,
  total_mad bigint, deposit_mad bigint, balance_due_mad bigint,
  make text, model text, customer_name text, customer_phone text
)
language sql stable security definer set search_path = public as $$
  select b.id, b.start_date, b.end_date, b.status, b.total_mad, b.deposit_mad,
         b.balance_due_mad, v.make, v.model, p.full_name, p.phone
  from bookings b
  join vehicles v on v.id = b.vehicle_id
  join profiles p on p.id = b.customer_id
  where public.is_agency_member(v.agency_id)
  order by b.start_date desc;
$$;
