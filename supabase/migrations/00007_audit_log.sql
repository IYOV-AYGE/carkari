-- Audit trail for privileged actions. See SPEC.md §5c.
--
-- Why this exists: staff can open a customer's passport, licence and selfie.
-- Without a record of who looked at what and when, we cannot answer the only
-- question that matters after a data incident — "whose documents were seen,
-- and by whom?" — and we cannot pass a security review.
--
-- The table is append-only by construction:
--   * no INSERT policy — rows arrive only through log_audit(), which is
--     security definer, so application code cannot forge an actor;
--   * UPDATE/DELETE are revoked from every client role, so an admin who goes
--     bad (or whose session is stolen) cannot erase their own tracks.

create table if not exists public.audit_log (
  id           bigint generated always as identity primary key,
  at           timestamptz not null default now(),
  actor_id     uuid references auth.users(id) on delete set null,
  actor_email  text,
  action       text not null,
  subject_id   uuid,
  detail       jsonb not null default '{}'::jsonb,
  ip           text
);

create index if not exists audit_log_at_idx      on public.audit_log (at desc);
create index if not exists audit_log_subject_idx on public.audit_log (subject_id, at desc);
create index if not exists audit_log_actor_idx   on public.audit_log (actor_id, at desc);

alter table public.audit_log enable row level security;

-- Admins may read the trail. Nobody may write, edit or erase it directly.
drop policy if exists "audit readable by admins" on public.audit_log;
create policy "audit readable by admins" on public.audit_log
  for select using (public.is_admin());

revoke insert, update, delete on public.audit_log from anon, authenticated;

/**
 * Record a privileged action. Admin-only: these events all describe staff
 * behaviour, so a non-admin caller is either a bug or an attack.
 */
create or replace function public.log_audit(
  p_action text,
  p_subject uuid default null,
  p_detail jsonb default '{}'::jsonb,
  p_ip text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  insert into audit_log (actor_id, actor_email, action, subject_id, detail, ip)
  values (
    auth.uid(),
    (select email from auth.users where id = auth.uid()),
    p_action,
    p_subject,
    coalesce(p_detail, '{}'::jsonb),
    p_ip
  );
end; $$;

/** Most recent audit events, newest first (admin console). */
create or replace function public.admin_audit_feed(p_limit int default 200)
returns table (
  at timestamptz, actor_email text, action text,
  subject_id uuid, subject_name text, detail jsonb, ip text
)
language sql stable security definer set search_path = public as $$
  select a.at, a.actor_email, a.action, a.subject_id, p.full_name, a.detail, a.ip
  from audit_log a
  left join profiles p on p.id = a.subject_id
  where public.is_admin()
  order by a.at desc
  limit least(coalesce(p_limit, 200), 1000);
$$;

/**
 * Every document a given customer has had opened, and by whom. This is the
 * query we would have to run to answer a subject access request or to scope
 * a breach, so it gets a function rather than being assembled by hand.
 */
create or replace function public.admin_kyc_access_history(p_user uuid)
returns table (at timestamptz, actor_email text, document text, ip text)
language sql stable security definer set search_path = public as $$
  select a.at, a.actor_email, a.detail->>'document', a.ip
  from audit_log a
  where public.is_admin()
    and a.action = 'kyc_doc_view'
    and a.subject_id = p_user
  order by a.at desc;
$$;
