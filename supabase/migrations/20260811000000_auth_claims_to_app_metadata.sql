-- ============================================================================
-- Move every authorisation decision from user_metadata to app_metadata.
--
-- THE HOLE THIS CLOSES
-- GoTrue copies the `data` object of POST /auth/v1/signup verbatim into
-- raw_user_meta_data, which then rides in the user's JWT as `user_metadata`.
-- Signups are open on this project (verified 2026-08-11: GET /auth/v1/settings
-- returns "disable_signup": false), and the anon key is published in the PWA
-- bundle by design. So anyone on the internet could register with
--
--     {"email":"...","password":"...",
--      "data":{"roles":["ROLE_ADMIN"],"is_active":true}}
--
-- and every policy below would have believed them. Email confirmation does not
-- help: the attacker confirms their own mailbox.
--
-- raw_app_meta_data is writable ONLY with the service-role key. A browser
-- cannot set it, so the same policy expression is safe for tokens issued by
-- GoTrue AND for the hub-minted Supabase session tokens
-- (JwtService.generateSupabaseSessionToken, which now sets app_metadata too).
--
-- ORDER OF OPERATIONS — DO NOT APPLY THIS FIRST
--   1. Deploy the hub build that DUAL-WRITES user_metadata + app_metadata
--      (SupabaseAdminClient.createUser / updateUserMetadata).
--   2. Let SupabaseReconciliationService's 60s tick backfill every existing
--      user. Verify with the query at the bottom of this file — it must return
--      zero rows before you continue.
--   3. Apply THIS migration.
-- Applying it before the backfill locks every user out until step 2 completes.
--
-- Intentionally unchanged: the top-level `roles` claim branch, used by
-- hub-signed RS256 tokens. Those are not client-forgeable either.
-- ============================================================================

-- 1. Role check: read app_metadata instead of user_metadata.
create or replace function public.jwt_has_any_role(p_roles text[])
returns boolean
language sql
stable
as $$
  with all_claims as (
    -- Hub-signed JWT: roles at top level (not client-forgeable — RS256, hub key).
    select jsonb_array_elements_text(coalesce(auth.jwt() -> 'roles',                   '[]'::jsonb)) as r
    union
    -- Supabase-issued or hub-minted session JWT: roles in app_metadata
    -- (raw_app_meta_data — service-role write only).
    select jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb)) as r
  )
  select exists (
    select 1 from all_claims where upper(r) = any (select upper(x) from unnest(p_roles) x)
  );
$$;

comment on function public.jwt_has_any_role(text[]) is
  'True if the caller''s JWT lists any of the given roles in the top-level roles claim (hub-signed RS256) or app_metadata.roles (raw_app_meta_data, service-role write only). Case-insensitive. Deliberately does NOT read user_metadata: that is client-supplied at signup and was self-grantable. See project/architecture/security/remediation-plan-2026-07.md.';

-- 2. Reference snapshot: approval flag must come from app_metadata.
drop policy if exists "approved users read reference snapshots" on public.reference_snapshot;
create policy "approved users read reference snapshots"
  on public.reference_snapshot
  for select
  to authenticated
  using ( (auth.jwt() -> 'app_metadata' ->> 'is_active') = 'true' );

comment on table public.reference_snapshot is
  'Hub-mirrored read-only reference datasets (LOTO points, work areas, locations) for PWA failover. Written by the hub via the service-role key; RLS restricts reads to approved users, where "approved" is app_metadata.is_active (service-role only) — NOT the client-settable user_metadata.';

-- ============================================================================
-- PRE-FLIGHT (run before applying, expect ZERO rows):
--   select id, email
--   from auth.users
--   where coalesce(raw_user_meta_data->>'is_active','false') = 'true'
--     and coalesce(raw_app_meta_data->>'is_active','false') <> 'true';
--
-- POST-CHECK (self-granted accounts that are now inert — review and delete):
--   select id, email, created_at,
--          raw_user_meta_data->'roles'    as claimed_roles,
--          raw_app_meta_data->'roles'     as real_roles
--   from auth.users
--   where raw_user_meta_data ? 'roles'
--     and coalesce(raw_app_meta_data->'roles','[]'::jsonb) = '[]'::jsonb;
-- ============================================================================
