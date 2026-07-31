-- CarKari — migration health check.
-- Paste the whole thing into Supabase → SQL editor → Run.
-- Every row should say OK. Anything saying MISSING tells you which migration
-- still has to be run (they must be run in order: 00001 … 00006).

with checks(migration, item, present) as (
  select '00001 core', 'table vehicles',
         to_regclass('public.vehicles') is not null
  union all select '00001 core', 'function create_booking',
         to_regprocedure('public.create_booking(uuid,date,date)') is not null
  union all select '00002 agencies', 'function apply_agency',
         exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'apply_agency')
  union all select '00002 agencies', 'bucket agency-docs',
         exists (select 1 from storage.buckets where id = 'agency-docs')
  union all select '00003 photos', 'bucket vehicle-photos',
         exists (select 1 from storage.buckets where id = 'vehicle-photos')
  union all select '00003 photos', 'function my_agency_id',
         exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'my_agency_id')
  union all select '00004 rep identity', 'agencies.rep_birth_date',
         exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='agencies'
                   and column_name='rep_birth_date')
  union all select '00004 rep identity', 'trigger enforce_min_photos',
         exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'enforce_min_photos')
  union all select '00005 booking flow', 'function quote_booking',
         exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'quote_booking')
  union all select '00005 booking flow', 'function cancel_booking',
         exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'cancel_booking')
  union all select '00006 customer KYC', 'bucket customer-docs',
         exists (select 1 from storage.buckets where id = 'customer-docs')
  union all select '00006 customer KYC', 'profiles.kyc_status',
         exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='profiles'
                   and column_name='kyc_status')
  union all select '00006 customer KYC', 'profiles.is_resident (new version)',
         exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='profiles'
                   and column_name='is_resident')
  union all select '00006 customer KYC', 'profiles.address_line (new version)',
         exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='profiles'
                   and column_name='address_line')
  union all select '00006 customer KYC', 'profiles.passport_number (new version)',
         exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='profiles'
                   and column_name='passport_number')
  union all select '00006 customer KYC', 'function submit_verification',
         exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'submit_verification')
  union all select '00006 customer KYC', 'function admin_kyc_queue',
         exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'admin_kyc_queue')
  -- These two MUST be absent. If present, the old KYC version is still there.
  union all select '00006 customer KYC', 'OLD phone_code column removed',
         not exists (select 1 from information_schema.columns
                     where table_schema='public' and table_name='profiles'
                       and column_name='phone_code')
  union all select '00006 customer KYC', 'OLD my_phone_code() removed',
         not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'public' and p.proname = 'my_phone_code')
)
select migration, item, case when present then 'OK' else 'MISSING' end as status
from checks
order by migration, item;

-- Bonus: is your admin account set up, and how many cars are live?
select
  (select count(*) from public.profiles where role = 'admin')      as admins,
  (select count(*) from public.agencies where status = 'verified') as verified_agencies,
  (select count(*) from public.vehicles where status = 'live')     as live_vehicles,
  (select count(*) from public.profiles where kyc_status = 'pending') as kyc_pending;
