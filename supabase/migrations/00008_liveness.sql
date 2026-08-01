-- Selfie liveness (presentation attack detection). See SPEC.md §5d.
--
-- Threat model, honestly stated:
--   Tier 1  printed photo / face on a phone screen  -> defeated here
--   Tier 2  replayed video of the real person       -> mostly defeated here
--   Tier 3  deepfake injected via a virtual camera  -> NOT defeated here.
--           No browser-side check can see past a virtual camera driver; that
--           needs a vendor SDK (Stripe Identity et al). We raise the cost and
--           keep evidence; we do not claim to stop a determined attacker.
--
-- How it works: the SERVER issues a random colour + pose sequence with a short
-- expiry. The browser flashes those colours at the face and records how the
-- skin reflects them, plus a frame per pose. A photo or a screen replay cannot
-- react to a sequence that did not exist when it was made.
--
-- Note the client computes the reflection measurements, so a skilled attacker
-- who rewrites our JS can forge them. That is why we also STORE the frames:
-- the automated score filters the lazy, the stored burst lets a human catch
-- the rest. Never treat liveness_passed alone as proof of identity.

create table if not exists public.liveness_challenges (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  colors     text[] not null,
  poses      text[] not null,
  issued_at  timestamptz not null default now(),
  used_at    timestamptz
);

create index if not exists liveness_user_idx
  on public.liveness_challenges (user_id, issued_at desc);

alter table public.liveness_challenges enable row level security;
-- No policies: rows are only ever touched by the security-definer functions
-- below, so a client can neither read another user's challenge nor forge one.

alter table public.profiles
  add column if not exists liveness_passed boolean,
  add column if not exists liveness_score numeric,
  add column if not exists liveness_frames text[],
  add column if not exists liveness_checked_at timestamptz,
  add column if not exists liveness_notes text;

/**
 * Issue a fresh challenge. Random every time, so a video recorded five minutes
 * ago cannot satisfy it. Any earlier unused challenge is discarded, which
 * stops an attacker from collecting several and picking the convenient one.
 */
create or replace function public.issue_liveness_challenge()
returns table (id uuid, colors text[], poses text[])
language plpgsql security definer set search_path = public as $$
declare
  v_colors text[];
  v_poses  text[];
  v_id     uuid;
  palette  text[] := array['R','G','B','W'];
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  delete from liveness_challenges
   where user_id = auth.uid() and used_at is null;

  -- 4 colours, never the same one twice in a row (a repeat is unverifiable:
  -- the reflection would not change between steps).
  v_colors := array[palette[1 + floor(random() * 4)::int]];
  while array_length(v_colors, 1) < 4 loop
    declare nxt text := palette[1 + floor(random() * 4)::int];
    begin
      if nxt <> v_colors[array_length(v_colors, 1)] then
        v_colors := v_colors || nxt;
      end if;
    end;
  end loop;

  -- Head poses, always starting centred so we get one clean face image.
  v_poses := array['center'] ||
             case when random() < 0.5 then array['left','right']
                  else array['right','left'] end;

  insert into liveness_challenges (user_id, colors, poses)
  values (auth.uid(), v_colors, v_poses)
  returning liveness_challenges.id into v_id;

  return query select v_id, v_colors, v_poses;
end; $$;

/**
 * Record the result of a challenge.
 *
 * p_observed  the dominant colour the browser measured on the face at each
 *             step, same length as the issued sequence
 * p_motion    0..1, how much the face moved between poses (a printed photo
 *             held by a shaking hand still moves rigidly, so this is weak on
 *             its own but useful combined with the colour response)
 * p_frames    storage paths of the captured frames, kept for human review
 */
create or replace function public.verify_liveness(
  p_challenge uuid,
  p_observed text[],
  p_motion numeric,
  p_frames text[]
) returns table (passed boolean, score numeric, reason text)
language plpgsql security definer set search_path = public as $$
declare
  c            liveness_challenges%rowtype;
  v_matches    int := 0;
  v_expected   int;
  v_colour_ok  numeric;
  v_score      numeric;
  v_passed     boolean;
  v_reason     text := 'ok';
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  select * into c from liveness_challenges
   where liveness_challenges.id = p_challenge and user_id = auth.uid();

  if c.id is null then
    return query select false, 0::numeric, 'unknown challenge'::text; return;
  end if;
  if c.used_at is not null then
    return query select false, 0::numeric, 'challenge already used'::text; return;
  end if;
  -- Two minutes is plenty for a 10-second capture and short enough that an
  -- attacker cannot render a bespoke deepfake in the window.
  if c.issued_at < now() - interval '2 minutes' then
    return query select false, 0::numeric, 'challenge expired'::text; return;
  end if;

  update liveness_challenges set used_at = now()
   where liveness_challenges.id = p_challenge;

  v_expected := coalesce(array_length(c.colors, 1), 0);
  if coalesce(array_length(p_observed, 1), 0) <> v_expected then
    v_reason := 'incomplete colour response';
  else
    for i in 1 .. v_expected loop
      if p_observed[i] = c.colors[i] then v_matches := v_matches + 1; end if;
    end loop;
  end if;

  v_colour_ok := case when v_expected = 0 then 0
                      else v_matches::numeric / v_expected end;
  -- Colour reflection carries most of the signal; motion is a supporting hint.
  v_score  := round(v_colour_ok * 0.75 + least(coalesce(p_motion, 0), 1) * 0.25, 3);
  v_passed := v_colour_ok >= 0.75 and coalesce(p_motion, 0) >= 0.15;

  if not v_passed and v_reason = 'ok' then
    v_reason := case
      when v_colour_ok < 0.75 then 'screen or print suspected (light did not reflect)'
      else 'no natural movement detected'
    end;
  end if;

  update profiles set
    liveness_passed = v_passed,
    liveness_score = v_score,
    liveness_frames = p_frames,
    liveness_checked_at = now(),
    liveness_notes = v_reason
  where id = auth.uid();

  return query select v_passed, v_score, v_reason;
end; $$;

-- Surface the result to the admin queue alongside everything else.
create or replace function public.admin_liveness(p_user uuid)
returns table (passed boolean, score numeric, frames text[], checked_at timestamptz, notes text)
language sql stable security definer set search_path = public as $$
  select p.liveness_passed, p.liveness_score, p.liveness_frames,
         p.liveness_checked_at, p.liveness_notes
  from profiles p
  where public.is_admin() and p.id = p_user;
$$;
