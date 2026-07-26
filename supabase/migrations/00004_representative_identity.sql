-- Legal representative identity for agency onboarding (KYC).
-- Sensitive: these columns are only readable by the applicant and admins (RLS
-- on agencies already enforces that). ID images live in the private bucket.

alter table public.agencies
  add column if not exists rep_first_name text,
  add column if not exists rep_last_name text,
  add column if not exists rep_birth_date date,
  add column if not exists rep_birth_city text,
  add column if not exists rep_phone text,
  add column if not exists rep_email text,
  add column if not exists rep_id_front_path text,
  add column if not exists rep_id_back_path text;

-- Replaces the 00002 version: now captures the representative too.
create or replace function public.apply_agency(
  p_legal_name text, p_city text, p_phone text, p_rc_number text,
  p_rc_doc text, p_insurance_doc text,
  p_rep_first_name text, p_rep_last_name text, p_rep_birth_date date,
  p_rep_birth_city text, p_rep_phone text, p_rep_email text,
  p_rep_id_front text, p_rep_id_back text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_slug text;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if exists (select 1 from agencies where applied_by = auth.uid()) then
    raise exception 'application already exists';
  end if;
  if length(trim(p_legal_name)) < 3 then raise exception 'invalid name'; end if;
  if length(trim(p_rep_first_name)) < 2 or length(trim(p_rep_last_name)) < 2 then
    raise exception 'invalid representative name';
  end if;
  if p_rep_birth_date is null or p_rep_birth_date > current_date - interval '18 years' then
    raise exception 'representative must be at least 18';
  end if;

  v_slug := lower(regexp_replace(trim(p_legal_name), '[^a-zA-Z0-9]+', '-', 'g'))
            || '-' || substr(gen_random_uuid()::text, 1, 4);

  insert into agencies (
    legal_name, slug, city, status, contact_email, phone, rc_number,
    rc_doc_path, insurance_doc_path, applied_by,
    rep_first_name, rep_last_name, rep_birth_date, rep_birth_city,
    rep_phone, rep_email, rep_id_front_path, rep_id_back_path)
  values (
    trim(p_legal_name), v_slug, p_city, 'pending',
    coalesce(p_rep_email, (select email from auth.users where id = auth.uid())),
    p_phone, p_rc_number, p_rc_doc, p_insurance_doc, auth.uid(),
    trim(p_rep_first_name), trim(p_rep_last_name), p_rep_birth_date,
    p_rep_birth_city, p_rep_phone, p_rep_email, p_rep_id_front, p_rep_id_back)
  returning id into v_id;

  insert into agency_members (agency_id, profile_id, member_role)
  values (v_id, auth.uid(), 'owner');

  return v_id;
end; $$;

-- Vehicles must carry at least 5 photos before going live.
create or replace function public.enforce_min_photos() returns trigger
language plpgsql set search_path = public as $$
declare n int;
begin
  if new.status = 'live' and (old.status is distinct from 'live') then
    select count(*) into n from vehicle_images where vehicle_id = new.id;
    if n < 5 then
      raise exception 'at least 5 photos required before publishing';
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists vehicles_min_photos on public.vehicles;
create trigger vehicles_min_photos
  before update on public.vehicles
  for each row execute function public.enforce_min_photos();
