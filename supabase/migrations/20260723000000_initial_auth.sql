-- ============================================================================
-- Power Plant dual-authority auth — Supabase side, initial schema.
--
-- Supabase is the *secondary* auth authority. It owns the credential (email +
-- password hash) as an independent store, but it is NOT the source of truth for
-- hub-specific fields (roles, isActive, permissionLevel, PIN, LOTO roles, ...).
-- Those live in raw_user_meta_data purely as a MIRROR, pushed by the hub.
--
-- public.user_link cross-references a Supabase auth.users row to its hub User
-- row and carries the two timestamps the reconciliation logic compares.
-- See project/features/users/dual-auth.md.
-- ============================================================================

-- ── Cross-reference table ───────────────────────────────────────────────────
create table if not exists public.user_link (
  supabase_uuid       uuid primary key references auth.users (id) on delete cascade,
  hub_user_id         bigint,                                   -- set once the hub creates/links its row
  hub_email           text not null,                            -- lookup key while hub_user_id is null
  password_updated_at timestamptz not null default now(),       -- LWW key for password reconciliation
  metadata_updated_at timestamptz not null default now(),       -- LWW key for profile (name/email) sync
  created_at          timestamptz not null default now()
);

-- One link per email (case-insensitive) so hub reconciliation can look up by email.
create unique index if not exists user_link_email_ux
  on public.user_link (lower(hub_email));

comment on table public.user_link is
  'Links Supabase auth.users to the hub User row and holds the LWW reconciliation timestamps. Managed by the hub via the service-role key; auto-seeded for Supabase-direct signups by the trigger below.';

-- ── Auto-seed a user_link row for every new auth user ───────────────────────
-- Supabase-direct signups (PWA fallback while the hub is down) create an
-- auth.users row with NO backend involved, so nothing would populate user_link.
-- This trigger fills it in from the new auth user. hub_user_id stays null until
-- the hub reconciles / auto-provisions on the user's first hub-reachable login.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_link (supabase_uuid, hub_email, password_updated_at, metadata_updated_at)
  values (new.id, new.email, now(), now())
  on conflict (supabase_uuid) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ── Bump reconciliation timestamps when the credential/metadata changes ─────
-- password_updated_at advances whenever GoTrue rewrites encrypted_password
-- (Supabase-side password change). metadata_updated_at advances on email or
-- raw_user_meta_data changes. The hub reads these to decide LWW direction.
create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.encrypted_password is distinct from old.encrypted_password then
    update public.user_link
       set password_updated_at = now()
     where supabase_uuid = new.id;
  end if;

  if (new.email is distinct from old.email)
     or (new.raw_user_meta_data is distinct from old.raw_user_meta_data) then
    update public.user_link
       set metadata_updated_at = now(),
           hub_email = coalesce(new.email, hub_email)
     where supabase_uuid = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update on auth.users
  for each row execute function public.handle_auth_user_updated();

-- ── Row-Level Security ──────────────────────────────────────────────────────
-- Lock the table down: only the service_role (which bypasses RLS) touches
-- user_link directly. No anon/authenticated policies are defined, so a leaked
-- anon key cannot read the whole cross-reference table.
alter table public.user_link enable row level security;

-- The hub reads a single email's reconciliation timestamps (+uuid) through this
-- SECURITY DEFINER function instead of a table-wide SELECT grant. It is NOT
-- granted to anon: exposing supabase_uuid / existence to an unauthenticated
-- caller would allow account enumeration and leak the auth.users primary key.
-- The hub calls it with the service-role key (which bypasses RLS anyway).
create or replace function public.get_auth_sync_status(p_email text)
returns table (
  supabase_uuid       uuid,
  password_updated_at timestamptz,
  metadata_updated_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select l.supabase_uuid, l.password_updated_at, l.metadata_updated_at
    from public.user_link l
   where lower(l.hub_email) = lower(p_email)
   limit 1;
$$;

-- authenticated + service_role only — NOT anon (see comment above).
grant execute on function public.get_auth_sync_status(text) to authenticated, service_role;

comment on function public.get_auth_sync_status(text) is
  'Returns the reconciliation timestamps + uuid for one email. Restricted to authenticated/service_role (NOT anon) to prevent account enumeration; the hub calls it with the service-role key.';
