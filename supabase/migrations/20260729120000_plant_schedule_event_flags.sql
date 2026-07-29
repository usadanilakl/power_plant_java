-- ============================================================================
-- Schedule v2 — add the event-flags column to the plant schedule mirror.
--
-- The v2 materialiser folds overlapping ScheduleEvent rows (holidays, meetings,
-- outages, pay-period markers) into each ShiftDay's event_flags_json so consumer
-- surfaces can render day banners without a second query. This column carries
-- that array through to the PWA's off-LAN Supabase read path.
--
-- Shape: jsonb array of ScheduleEventFlag ({eventType, title, color, appliesToShift}).
-- Null for v1 (SharePoint-parsed) rows; the hub mirror only sends the key when set.
-- ============================================================================

alter table public.plant_schedule_day
  add column if not exists event_flags_json jsonb;

comment on column public.plant_schedule_day.event_flags_json is
  'Schedule v2: ScheduleEventFlag[] folded from overlapping ScheduleEvent rows by the hub materialiser. Null for v1 rows.';
