-- Public bucket for vehicle photos (listings must be publicly viewable).
-- Agencies upload into vehicle-photos/{agency_id}/... ; only members may write.

insert into storage.buckets (id, name, public)
values ('vehicle-photos', 'vehicle-photos', true)
on conflict (id) do nothing;

-- anyone can view listing photos
create policy "vehicle photos public read" on storage.objects
  for select using (bucket_id = 'vehicle-photos');

-- only members of that agency (or admin) may upload/replace/delete
create policy "vehicle photos member write" on storage.objects
  for insert with check (
    bucket_id = 'vehicle-photos'
    and (public.is_agency_member(((storage.foldername(name))[1])::uuid) or public.is_admin())
  );

create policy "vehicle photos member delete" on storage.objects
  for delete using (
    bucket_id = 'vehicle-photos'
    and (public.is_agency_member(((storage.foldername(name))[1])::uuid) or public.is_admin())
  );

-- helper: the caller's agency id (null if none) — used by the dashboard
create or replace function public.my_agency_id() returns uuid
language sql stable security definer set search_path = public as $$
  select agency_id from agency_members where profile_id = auth.uid() limit 1;
$$;
