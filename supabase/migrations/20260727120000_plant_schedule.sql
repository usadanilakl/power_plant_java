-- ============================================================================
-- Plant Schedule mirror — Supabase-side copy of the hub's ShiftDay table so the
-- PWA can still read schedule when the hub is unreachable (matching the plant
-- chat pattern: hub down does not blind the PWA).
--
-- Write path: HUB ONLY. The hub receives the parsed SharePoint schedule via
-- {@code POST /ng/schedule/sync} from Electron, persists to H2 ShiftDay, then
-- mirrors each day into this table via SupabaseAdminClient (service-role key
-- bypasses RLS). Electron and PWA never write here directly.
--
-- Read path: PWA reads via `.select()`; RLS scopes to plant-affiliated groups
-- (Admin / Plant / NAES / JPower). Contractors stay blocked.
-- ============================================================================

create table if not exists public.plant_schedule_day (
  shift_date            date primary key,
  shift_year            int not null,
  day_shift_json        jsonb,          -- ShiftEntry[] — matches hub ShiftDay JSON columns exactly
  night_shift_json      jsonb,
  unscheduled_json      jsonb,
  pto_json              jsonb,
  training_json         jsonb,
  on_call_manager_name  text,
  on_call_manager_user_id bigint,       -- hub User.id — informational; PWA does not resolve it
  source                text,           -- e.g. "sharepoint-excel-2026" (from ShiftDay.source)
  last_synced_at        timestamptz not null default now()
);

create index if not exists plant_schedule_day_year_ix
  on public.plant_schedule_day (shift_year);

comment on table public.plant_schedule_day is
  'Read-only mirror of hub ShiftDay populated by hub-side sync. PWA reads this as fallback when the hub is unreachable.';

alter table public.plant_schedule_day enable row level security;

-- Plant-group read; contractors excluded. No insert/update/delete policies → service-role only.
drop policy if exists plant_schedule_select on public.plant_schedule_day;
create policy plant_schedule_select on public.plant_schedule_day
  for select
  using (public.jwt_is_plant_group());

-- Realtime not needed — schedule changes are infrequent and the PWA already
-- fetches on tab open. Skip publication add.
