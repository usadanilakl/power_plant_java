-- ============================================================================
-- Reference-data failover snapshots.
--
-- The PWA needs certain read-only datasets offline (LOTO points, work areas,
-- locations). Historically these were shipped as static JSON in the PWA bundle
-- and served PUBLICLY on GitHub Pages — a data exposure, since the hub gates the
-- same data behind ROLE_PLANT. This table lets the hub mirror those datasets so
-- the PWA can fall back to Supabase (auth-gated) when the hub is unreachable,
-- instead of a public file.
--
-- The hub stays the PRIMARY provider; Supabase is failover; localStorage is the
-- last resort. See project/architecture/supabase/reference-data.md.
-- ============================================================================

create table if not exists public.reference_snapshot (
  key          text primary key,          -- 'loto_points' | 'work_areas' | 'locations'
  payload      jsonb not null,            -- the full dataset array (drop-in for the old static JSON)
  content_hash text,                       -- lets the hub skip re-uploading an unchanged snapshot
  updated_at   timestamptz not null default now()
);

alter table public.reference_snapshot enable row level security;

-- Reads are for APPROVED users only. The hub mirrors is_active into each user's
-- raw_user_meta_data, so it rides in the Supabase JWT; unapproved self-signups
-- (is_active absent/false) are denied. This is NOT public — the key difference
-- from the old GitHub Pages JSON. The hub writes with the service-role key,
-- which bypasses RLS.
create policy "approved users read reference snapshots"
  on public.reference_snapshot
  for select
  to authenticated
  using ( (auth.jwt() -> 'user_metadata' ->> 'is_active') = 'true' );

comment on table public.reference_snapshot is
  'Hub-mirrored read-only reference datasets (LOTO points, work areas, locations) for PWA failover. Written by the hub via the service-role key; RLS restricts reads to approved (is_active) users.';
