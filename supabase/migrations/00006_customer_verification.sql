-- Customer identity verification (KYC). See SPEC.md §5b.
--
-- Design notes:
--  * Verification is required BEFORE PICKUP, not before booking. Customers
--    book + pay the deposit freely, then verify. No verification → no car.
--  * Email is verified by Supabase Auth (auth.users.email_confirmed_at).
--    No phone verification for now — the number is collected as contact data.
--  * Documents are CAMERA CAPTURES ONLY (enforced client-side via getUserMedia);
--    no gallery uploads, which makes recycled/stolen document scans harder.
--  * Residents provide the national ID (CIN); visitors provide a passport and
--    optionally an International Driving Permit.
--  * Documents live in a PRIVATE bucket. Agencies only ever learn
--    "verified: yes/no" plus name + phone.

create type public.kyc_status as enum
  ('unverified','pending','verified','rejected');

alter table public.profiles
  add column if not exists kyc_status public.kyc_status not null default 'unverified',
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists birth_date date,
  add column if not exists nationality text,
  -- true = lives in Morocco (CIN), false = visitor (passport)
  add column if not exists is_resident boolean,
  -- full postal address, required for everyone
  add column if not exists address_line text,
  add column if not exists address_city text,
  add column if not exists address_postcode text,
  add column if not exists address_country text,
  add column if not exists id_number text,          -- CIN (residents)
  add column if not exists passport_number text,    -- visitors
  add column if not exists licence_number text,
  add column if not exists licence_country text,
  add column if not exists licence_issued_on date,
  add column if not exists licence_front_path text,
  add column if not exists licence_back_path text,
  add column if not exists id_front_path text,      -- CIN front / passport page
  add column if not exists id_back_path text,       -- CIN back (residents only)
  add column if not exists idp_path text,           -- optional intl driving permit
  add column if not exists selfie_path text,
  add column if not exists kyc_submitted_at timestamptz,
  add column if not exists kyc_reviewed_at timestamptz,
  add column if not exists kyc_reject_reason text,
  -- silent fraud signals, never displayed to users
  add column if not exists kyc_ip text,
  add column if not exists kyc_country text;

-- Private bucket for customer documents.
insert into storage.buckets (id, name, public)
values ('customer-docs', 'customer-docs', false)
on conflict (id) do nothing;

create policy "customer docs own upload" on storage.objects
  for insert with check (
    bucket_id = 'customer-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "customer docs own read" on storage.objects
  for select using (
    bucket_id = 'customer-docs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- Submit KYC. Client captures + uploads images first, then calls this.
create or replace function public.submit_verification(
  p_first_name text, p_last_name text, p_birth_date date, p_nationality text,
  p_is_resident boolean, p_phone text,
  p_address_line text, p_address_city text, p_address_postcode text,
  p_address_country text,
  p_id_number text, p_passport_number text,
  p_licence_number text, p_licence_country text, p_licence_issued_on date,
  p_licence_front text, p_licence_back text,
  p_id_front text, p_id_back text default null,
  p_idp text default null, p_selfie text default null,
  p_ip text default null, p_country text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if length(trim(coalesce(p_first_name,''))) < 2
     or length(trim(coalesce(p_last_name,''))) < 2 then
    raise exception 'invalid name';
  end if;
  -- Minimum age 21 (Moroccan agencies commonly require it).
  if p_birth_date is null or p_birth_date > current_date - interval '21 years' then
    raise exception 'must be at least 21';
  end if;
  -- Licence must be held at least 1 year.
  if p_licence_issued_on is null
     or p_licence_issued_on > current_date - interval '1 year' then
    raise exception 'licence must be held for at least 1 year';
  end if;
  if coalesce(trim(p_address_line),'') = ''
     or coalesce(trim(p_address_city),'') = ''
     or coalesce(trim(p_address_country),'') = '' then
    raise exception 'address required';
  end if;
  if coalesce(trim(p_licence_number),'') = '' then
    raise exception 'licence number required';
  end if;
  if coalesce(trim(p_phone),'') = '' then
    raise exception 'phone required';
  end if;
  -- Residents: CIN number + both sides. Visitors: passport number + page.
  if p_is_resident then
    if coalesce(trim(p_id_number),'') = '' then
      raise exception 'CIN number required';
    end if;
    if p_id_front is null or p_id_back is null then
      raise exception 'both sides of the CIN required';
    end if;
  else
    if coalesce(trim(p_passport_number),'') = '' then
      raise exception 'passport number required';
    end if;
    if p_id_front is null then raise exception 'passport photo required'; end if;
  end if;
  if p_licence_front is null or p_licence_back is null or p_selfie is null then
    raise exception 'licence photos and selfie required';
  end if;

  update profiles set
    first_name = trim(p_first_name),
    last_name = trim(p_last_name),
    full_name = trim(p_first_name) || ' ' || trim(p_last_name),
    birth_date = p_birth_date,
    nationality = p_nationality,
    is_resident = p_is_resident,
    phone = p_phone,
    address_line = trim(p_address_line),
    address_city = trim(p_address_city),
    address_postcode = p_address_postcode,
    address_country = trim(p_address_country),
    id_number = nullif(trim(coalesce(p_id_number,'')), ''),
    passport_number = nullif(trim(coalesce(p_passport_number,'')), ''),
    licence_number = trim(p_licence_number),
    licence_country = p_licence_country,
    licence_issued_on = p_licence_issued_on,
    licence_front_path = p_licence_front,
    licence_back_path = p_licence_back,
    id_front_path = p_id_front,
    id_back_path = p_id_back,
    idp_path = p_idp,
    selfie_path = p_selfie,
    kyc_status = 'pending',
    kyc_submitted_at = now(),
    kyc_reject_reason = null,
    kyc_ip = p_ip,
    kyc_country = p_country
  where id = auth.uid();
end; $$;

-- My own verification state (safe subset for the UI).
create or replace function public.my_verification() returns table (
  kyc_status public.kyc_status, reject_reason text, submitted_at timestamptz,
  email_confirmed boolean
)
language sql stable security definer set search_path = public as $$
  select p.kyc_status, p.kyc_reject_reason, p.kyc_submitted_at,
         (u.email_confirmed_at is not null)
  from profiles p join auth.users u on u.id = p.id
  where p.id = auth.uid();
$$;

-- Admin: queue of submissions with document paths.
create or replace function public.admin_kyc_queue() returns table (
  id uuid, full_name text, first_name text, last_name text, birth_date date,
  nationality text, is_resident boolean, phone text, email text,
  email_confirmed boolean,
  address_line text, address_city text, address_postcode text,
  address_country text,
  id_number text, passport_number text,
  licence_number text, licence_country text, licence_issued_on date,
  licence_front_path text, licence_back_path text,
  id_front_path text, id_back_path text, idp_path text, selfie_path text,
  kyc_status public.kyc_status, kyc_submitted_at timestamptz,
  kyc_ip text, kyc_country text
)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.first_name, p.last_name, p.birth_date,
         p.nationality, p.is_resident, p.phone, u.email,
         (u.email_confirmed_at is not null),
         p.address_line, p.address_city, p.address_postcode, p.address_country,
         p.id_number, p.passport_number,
         p.licence_number, p.licence_country, p.licence_issued_on,
         p.licence_front_path, p.licence_back_path,
         p.id_front_path, p.id_back_path, p.idp_path, p.selfie_path,
         p.kyc_status, p.kyc_submitted_at, p.kyc_ip, p.kyc_country
  from profiles p join auth.users u on u.id = p.id
  where public.is_admin() and p.kyc_status <> 'unverified'
  order by (p.kyc_status = 'pending') desc, p.kyc_submitted_at desc nulls last;
$$;

-- Admin decision. Reason is required when rejecting.
create or replace function public.admin_set_kyc(
  p_user uuid, p_status public.kyc_status, p_reason text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if p_status = 'rejected' and coalesce(trim(p_reason), '') = '' then
    raise exception 'reason required';
  end if;
  update profiles set
    kyc_status = p_status,
    kyc_reject_reason = case when p_status = 'rejected' then p_reason else null end,
    kyc_reviewed_at = now()
  where id = p_user;
end; $$;

-- Agencies see only the verification OUTCOME for their bookings — never docs.
create or replace function public.agency_bookings() returns table (
  id uuid, start_date date, end_date date, status public.booking_status,
  total_mad bigint, deposit_mad bigint, balance_due_mad bigint,
  make text, model text, customer_name text, customer_phone text,
  customer_verified boolean
)
language sql stable security definer set search_path = public as $$
  select b.id, b.start_date, b.end_date, b.status, b.total_mad, b.deposit_mad,
         b.balance_due_mad, v.make, v.model, p.full_name, p.phone,
         (p.kyc_status = 'verified')
  from bookings b
  join vehicles v on v.id = b.vehicle_id
  join profiles p on p.id = b.customer_id
  where public.is_agency_member(v.agency_id)
  order by b.start_date desc;
$$;

-- Retention: purge ID images 90 days after the customer's last rental ended.
create or replace function public.purge_old_kyc_documents() returns int
language plpgsql security definer set search_path = public as $$
declare n int := 0;
begin
  with stale as (
    select p.id from profiles p
    where p.kyc_status in ('verified','rejected')
      and p.licence_front_path is not null
      and coalesce((select max(b.end_date) from bookings b where b.customer_id = p.id),
                   p.kyc_reviewed_at::date) < current_date - interval '90 days'
  )
  update profiles set
    licence_front_path = null, licence_back_path = null,
    id_front_path = null, id_back_path = null,
    idp_path = null, selfie_path = null
  where id in (select id from stale);
  get diagnostics n = row_count;
  return n;
end; $$;
