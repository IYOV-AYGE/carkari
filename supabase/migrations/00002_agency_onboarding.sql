-- Agency onboarding: application fields, apply RPC, private document storage.
-- Run in Supabase SQL editor after 00001. See SPEC.md §3.

-- extra application fields
alter table public.agencies
  add column if not exists contact_email text,
  add column if not exists phone text,
  add column if not exists rc_number text,
  add column if not exists rc_doc_path text,
  add column if not exists insurance_doc_path text,
  add column if not exists applied_by uuid references public.profiles(id);

-- one application per user
create unique index if not exists agencies_applied_by_key on public.agencies (applied_by);

-- RPC: creates the agency (status pending) + owner membership, in one transaction.
create or replace function public.apply_agency(
  p_legal_name text, p_city text, p_phone text, p_rc_number text,
  p_rc_doc text, p_insurance_doc text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_slug text;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if exists (select 1 from agencies where applied_by = auth.uid()) then
    raise exception 'application already exists';
  end if;
  if length(trim(p_legal_name)) < 3 then raise exception 'invalid name'; end if;

  v_slug := lower(regexp_replace(trim(p_legal_name), '[^a-zA-Z0-9]+', '-', 'g'))
            || '-' || substr(gen_random_uuid()::text, 1, 4);

  insert into agencies (legal_name, slug, city, status, contact_email, phone,
                        rc_number, rc_doc_path, insurance_doc_path, applied_by)
  values (trim(p_legal_name), v_slug, p_city, 'pending',
          (select email from auth.users where id = auth.uid()),
          p_phone, p_rc_number, p_rc_doc, p_insurance_doc, auth.uid())
  returning id into v_id;

  insert into agency_members (agency_id, profile_id, member_role)
  values (v_id, auth.uid(), 'owner');

  return v_id;
end; $$;

-- my application status (avoids RLS complexity client-side)
create or replace function public.my_agency() returns table (
  id uuid, legal_name text, city text, status public.agency_status, member_role public.member_role
)
language sql stable security definer set search_path = public as $$
  select a.id, a.legal_name, a.city, a.status, m.member_role
  from agencies a join agency_members m on m.agency_id = a.id
  where m.profile_id = auth.uid();
$$;

-- private bucket for agency documents
insert into storage.buckets (id, name, public)
values ('agency-docs', 'agency-docs', false)
on conflict (id) do nothing;

-- users upload only into their own folder: agency-docs/{uid}/...
create policy "own folder upload" on storage.objects
  for insert with check (
    bucket_id = 'agency-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "own folder read" on storage.objects
  for select using (
    bucket_id = 'agency-docs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
