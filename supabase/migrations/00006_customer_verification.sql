-- Customer identity verification (KYC). See SPEC.md §8.
--
-- Design notes:
--  * Verification is required BEFORE PICKUP, not before booking — customers
--    book freely (deposit paid), then verify. No verification → no car.
--  * Documents live in a PRIVATE bucket. Agencies never see them; they only
--    ever learn "verified: yes/no" plus name + phone.
--  * Phone is verified by the customer sending a one-time code to CarKari on
--    WhatsApp (inbound = free) or by email. Admin/automation confirms.

create type public.kyc_status as enum
  ('unverified','pending','verified','rejected');

alter table public.profiles
  add column if not exists kyc_status public.kyc_status not null default 'unverified',
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists birth_date date,
  add column if not exists nationality text,
  add column if not exists id_number text,
  add column if not exists licence_number text,
  add column if not exists licence_country text,
  add column if not exists licence_issued_on date,
  add column if not exists licence_front_path text,
  add column if not exists licence_back_path text,
  add column if not exists id_front_path text,
  add column if not exists id_back_path text,
  add column if not exists selfie_path text,
  add column if not exists phone_verified boolean not null default false,
  add column if not exists phone_code text,
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

-- Stable per-user code the customer sends us on WhatsApp to prove the number.
create or replace function public.my_phone_code() returns text
language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select phone_code into v_code from profiles where id = auth.uid();
  if v_code is null then
    v_code := 'CK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    update profiles set phone_code = v_code where id = auth.uid();
  end if;
  return v_code;
end; $$;

-- Submit KYC. Client uploads files first, then calls this with the paths.
create or replace function public.submit_verification(
  p_first_name text, p_last_name text, p_birth_date date, p_nationality text,
  p_phone text, p_id_number text,
  p_licence_number text, p_licence_country text, p_licence_issued_on date,
  p_licence_front text, p_licence_back text,
  p_id_front text, p_id_back text, p_selfie text,
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

  update profiles set
    first_name = trim(p_first_name),
    last_name = trim(p_last_name),
    full_name = trim(p_first_name) || ' ' || trim(p_last_name),
    birth_date = p_birth_date,
    nationality = p_nationality,
    phone = coalesce(p_phone, phone),
    id_number = p_id_number,
    licence_number = p_licence_number,
    licence_country = p_licence_country,
    licence_issued_on = p_licence_issued_on,
    licence_front_path = p_licence_front,
    licence_back_path = p_licence_back,
    id_front_path = p_id_front,
    id_back_path = p_id_back,
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
  kyc_status public.kyc_status, phone_verified boolean,
  reject_reason text, submitted_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select kyc_status, phone_verified, kyc_reject_reason, kyc_submitted_at
  from profiles where id = auth.uid();
$$;

-- Admin: queue of submissions with document paths.
create or replace function public.admin_kyc_queue() returns table (
  id uuid, full_name text, first_name text, last_name text, birth_date date,
  nationality text, phone text, phone_verified boolean, phone_code text,
  id_number text, licence_number text, licence_country text,
  licence_issued_on date, licence_front_path text, licence_back_path text,
  id_front_path text, id_back_path text, selfie_path text,
  kyc_status public.kyc_status, kyc_submitted_at timestamptz,
  kyc_ip text, kyc_country text, email text
)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.first_name, p.last_name, p.birth_date,
         p.nationality, p.phone, p.phone_verified, p.phone_code,
         p.id_number, p.licence_number, p.licence_country,
         p.licence_issued_on, p.licence_front_path, p.licence_back_path,
         p.id_front_path, p.id_back_path, p.selfie_path,
         p.kyc_status, p.kyc_submitted_at, p.kyc_ip, p.kyc_country,
         u.email
  from profiles p join auth.users u on u.id = p.id
  where public.is_admin() and p.kyc_status <> 'unverified'
  order by (p.kyc_status = 'pending') desc, p.kyc_submitted_at desc nulls last;
$$;

-- Admin decision. Reason is required when rejecting.
create or replace function public.admin_set_kyc(
  p_user uuid, p_status public.kyc_status, p_reason text default null,
  p_phone_verified boolean default null
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
    kyc_reviewed_at = now(),
    phone_verified = coalesce(p_phone_verified, phone_verified)
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
         (p.kyc_status = 'verified' and p.phone_verified)
  from bookings b
  join vehicles v on v.id = b.vehicle_id
  join profiles p on p.id = b.customer_id
  where public.is_agency_member(v.agency_id)
  order by b.start_date desc;
$$;

-- Retention: purge ID images 90 days after the customer's last rental ended.
-- Run from a scheduled job (pg_cron) or manually; keeps the decision, drops
-- the sensitive images.
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
    id_front_path = null, id_back_path = null, selfie_path = null
  where id in (select id from stale);
  get diagnostics n = row_count;
  return n;
end; $$;
