-- Optional profile photos. See SPEC.md §5f.
--
-- Purely so two strangers can find each other — at an airport arrivals hall,
-- a hotel lobby, a car park. Entirely voluntary, and deliberately kept in a
-- SEPARATE world from KYC:
--
--   avatar        public, chosen by the user, changeable any time, gallery
--                 upload allowed, never used as evidence or for matching
--   KYC selfie    private, camera-only, liveness-checked, admin-only, and the
--                 sole input to the counter face match
--
-- Keeping them apart matters: if the avatar could feed the match, anyone could
-- upload a picture of their friend and walk off with a car.

alter table public.profiles
  add column if not exists avatar_path text;

alter table public.agencies
  add column if not exists avatar_path text;

-- Public bucket on purpose: these are the pictures people chose to show, they
-- benefit from CDN caching, and nothing here is sensitive. Contrast with
-- customer-docs, which is private and admin-only.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatar own write" on storage.objects;
create policy "avatar own write" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatar own update" on storage.objects;
create policy "avatar own update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatar own delete" on storage.objects;
create policy "avatar own delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

/** Set or clear my own profile photo. Pass null to remove it. */
create or replace function public.set_avatar(p_path text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  -- A user may only point at their own folder, whatever the client sends.
  if p_path is not null and split_part(p_path, '/', 1) <> auth.uid()::text then
    raise exception 'invalid path';
  end if;
  update profiles set avatar_path = p_path where id = auth.uid();
end; $$;

/** Same for the agency's public photo (storefront, counter, team). */
create or replace function public.set_agency_avatar(p_path text)
returns void
language plpgsql security definer set search_path = public as $$
declare v_agency uuid;
begin
  select agency_id into v_agency from agency_members
   where profile_id = auth.uid() and member_role = 'owner' limit 1;
  if v_agency is null then raise exception 'not an agency owner'; end if;
  if p_path is not null and split_part(p_path, '/', 1) <> auth.uid()::text then
    raise exception 'invalid path';
  end if;
  update agencies set avatar_path = p_path where id = v_agency;
end; $$;

/** My own profile, for the account page. */
create or replace function public.my_profile()
returns table (full_name text, avatar_path text, kyc_status public.kyc_status)
language sql stable security definer set search_path = public as $$
  select p.full_name, p.avatar_path, p.kyc_status
  from profiles p where p.id = auth.uid();
$$;

-- Adding a column changes the return type, so drop before recreating.
drop function if exists public.pickup_brief(uuid);

-- The host's pickup screen gains the customer's chosen photo (if any) so they
-- can spot them in a queue. Still no document, no KYC selfie, no address.
create function public.pickup_brief(p_booking uuid)
returns table (
  booking_id uuid, customer_name text, customer_phone text,
  kyc_verified boolean, birth_date date, avatar_path text,
  start_date date, end_date date, status public.booking_status,
  make text, model text, year int
)
language sql stable security definer set search_path = public as $$
  select b.id, p.full_name, p.phone,
         (p.kyc_status = 'verified'), p.birth_date, p.avatar_path,
         b.start_date, b.end_date, b.status, v.make, v.model, v.year
  from bookings b
  join vehicles v on v.id = b.vehicle_id
  join profiles p on p.id = b.customer_id
  where b.id = p_booking and public.is_agency_member(v.agency_id);
$$;

drop function if exists public.my_bookings();

-- ...and the customer sees the agency's photo on their booking, for the same
-- reason: knowing what the counter looks like before you arrive.
create function public.my_bookings() returns table (
  id uuid, start_date date, end_date date, status public.booking_status,
  total_mad bigint, deposit_mad bigint, balance_due_mad bigint,
  make text, model text, year int, agency_name text, city text,
  agency_avatar_path text,
  booked_at timestamptz, refundable boolean
)
language sql stable security definer set search_path = public as $$
  select b.id, b.start_date, b.end_date, b.status, b.total_mad, b.deposit_mad,
         b.balance_due_mad, v.make, v.model, v.year, a.legal_name, a.city,
         a.avatar_path,
         b.booked_at,
         case
           when (b.start_date::timestamptz - b.booked_at) <= interval '48 hours' then false
           when now() <= b.booked_at + interval '24 hours' then true
           else false
         end
  from bookings b
  join vehicles v on v.id = b.vehicle_id
  join agencies a on a.id = v.agency_id
  where b.customer_id = auth.uid()
  order by b.start_date desc;
$$;
