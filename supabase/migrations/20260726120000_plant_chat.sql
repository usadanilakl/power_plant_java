-- ============================================================================
-- Power Plant chat — Supabase-authoritative schema for the Plant Chat feature.
--
-- Design: Option C from project/features/users/communication/plant-chat.md
--   • PWA + Electron talk to Supabase directly for reads + writes.
--   • Hub is NOT in the write path. Hub subscribes to Realtime for AUDIT only.
--   • CRDT sync is deliberately NOT registered for these tables on the hub side.
--   • Access matrix: ADMIN / PLANT / NAES / JPOWER / EMPLOYEE. Contractors excluded.
--
-- Role source: dual-auth mirrors User.role (CSV) into auth.users.raw_user_meta_data.roles
-- (JSON array). Hub-signed JWTs also carry a top-level `roles` claim. Helper
-- function below reads BOTH so RLS works regardless of which issuer signed the JWT.
-- ============================================================================

-- ── Role-check helper — reads roles from either JWT shape ───────────────────
create or replace function public.jwt_has_any_role(p_roles text[])
returns boolean
language sql
stable
as $$
  with all_claims as (
    -- Hub-signed JWT: roles at top-level. Supabase-signed JWT: roles nested in user_metadata.
    select jsonb_array_elements_text(coalesce(auth.jwt() -> 'roles',                    '[]'::jsonb)) as r
    union
    select jsonb_array_elements_text(coalesce(auth.jwt() -> 'user_metadata' -> 'roles', '[]'::jsonb)) as r
  )
  select exists (
    select 1 from all_claims where upper(r) = any (select upper(x) from unnest(p_roles) x)
  );
$$;

comment on function public.jwt_has_any_role(text[]) is
  'True if the caller''s JWT lists any of the given role names in either the top-level roles claim (hub-signed JWT) or raw_user_meta_data.roles (Supabase-signed JWT). Case-insensitive. See project/features/users/communication/plant-chat.md.';

-- Convenience wrappers — the exact groups the access matrix uses.
create or replace function public.jwt_is_plant_group() returns boolean language sql stable as $$
  select public.jwt_has_any_role(array['ROLE_ADMIN','ROLE_PLANT','ROLE_NAES','ROLE_JPOWER']);
$$;
create or replace function public.jwt_is_chat_eligible() returns boolean language sql stable as $$
  select public.jwt_has_any_role(array['ROLE_ADMIN','ROLE_PLANT','ROLE_NAES','ROLE_JPOWER','ROLE_EMPLOYEE']);
$$;
create or replace function public.jwt_is_admin() returns boolean language sql stable as $$
  select public.jwt_has_any_role(array['ROLE_ADMIN']);
$$;

-- ── Updated_at trigger helper ───────────────────────────────────────────────
create or replace function public.tg_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── plant_conversation ─────────────────────────────────────────────────────
-- One row per channel. Small population (~5-20 per plant), admin-created.
create table if not exists public.plant_conversation (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  entity_type   text,                 -- optional anchor to a hub entity (WorkRequest, JHA, ...)
  entity_id     bigint,               -- with entity_type
  is_editable   boolean not null default false,  -- admin flag; enforcement at UI
  created_by    uuid not null references auth.users (id) on delete restrict,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  archived_at   timestamptz           -- soft delete
);

create index if not exists plant_conversation_active_ix
  on public.plant_conversation (name)
  where archived_at is null;

create index if not exists plant_conversation_entity_ix
  on public.plant_conversation (entity_type, entity_id)
  where entity_type is not null;

drop trigger if exists plant_conversation_touch on public.plant_conversation;
create trigger plant_conversation_touch
  before update on public.plant_conversation
  for each row execute function public.tg_touch_updated_at();

comment on table public.plant_conversation is
  'Plant-wide chat channel. Admin-created and admin-editable; members read/post based on group role.';

-- ── plant_chat_message ─────────────────────────────────────────────────────
create table if not exists public.plant_chat_message (
  id                    uuid primary key default gen_random_uuid(),
  conversation_id       uuid not null references public.plant_conversation (id) on delete cascade,
  sender_id             uuid not null references auth.users (id) on delete restrict,
  sender_display_name   text not null,   -- denormalised so historical messages survive rename
  content               text not null,
  is_important          boolean not null default false,
  requires_ack          boolean not null default false,   -- implies is_important on the UI side
  sent_at               timestamptz not null default now(),
  edited_at             timestamptz,     -- null until first edit; edit window enforced by RLS (5 min)
  deleted_at            timestamptz      -- soft delete; UI shows "(deleted)" placeholder
);

-- Primary lookup pattern: latest N messages in a conversation.
create index if not exists plant_chat_message_conv_time_ix
  on public.plant_chat_message (conversation_id, sent_at desc);

-- For hub-side audit drain to walk "everything since X".
create index if not exists plant_chat_message_sent_at_ix
  on public.plant_chat_message (sent_at);

-- Important-flag consistency: requires_ack implies is_important.
alter table public.plant_chat_message
  drop constraint if exists plant_chat_message_ack_implies_important;
alter table public.plant_chat_message
  add constraint plant_chat_message_ack_implies_important
  check (requires_ack = false or is_important = true);

comment on table public.plant_chat_message is
  'Individual chat message inside a plant_conversation. sender_display_name is denormalised on write; edited_at tracks the 5-minute edit window enforced by RLS.';

-- ── plant_chat_ack ─────────────────────────────────────────────────────────
-- Doubles as read-marker (any ack = read) and important-message acknowledgement.
create table if not exists public.plant_chat_ack (
  message_id  uuid not null references public.plant_chat_message (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  acked_at    timestamptz not null default now(),
  primary key (message_id, user_id)
);

-- Fast "how many acks does this important message have?" and
-- "what is user X's unread count?" queries.
create index if not exists plant_chat_ack_user_ix
  on public.plant_chat_ack (user_id, acked_at desc);

comment on table public.plant_chat_ack is
  'One row per (message, user) pair. For regular messages this is a read receipt; for is_important messages it is the explicit acknowledgement recorded in the sender view.';

-- ============================================================================
-- Row-Level Security
--
-- Access matrix (from pwa-step-5-wiring.md + plant-chat.md):
--   • Conversations : SELECT — plant-group (ADMIN/PLANT/NAES/JPOWER); INSERT/UPDATE/DELETE — ADMIN only.
--   • Messages      : SELECT — chat-eligible (adds EMPLOYEE); INSERT — chat-eligible AND sender = auth.uid();
--                     UPDATE — sender_id = auth.uid() AND within 5 minutes of sent_at AND not deleted.
--   • Acks          : SELECT — chat-eligible; INSERT/DELETE — user_id = auth.uid().
--
-- Contractors and unaffiliated users are silently blocked (empty result sets).
-- ============================================================================

alter table public.plant_conversation enable row level security;
alter table public.plant_chat_message  enable row level security;
alter table public.plant_chat_ack      enable row level security;

-- ── plant_conversation policies ────────────────────────────────────────────
drop policy if exists plant_conv_select on public.plant_conversation;
create policy plant_conv_select on public.plant_conversation
  for select
  using (public.jwt_is_plant_group());

drop policy if exists plant_conv_admin_insert on public.plant_conversation;
create policy plant_conv_admin_insert on public.plant_conversation
  for insert
  with check (public.jwt_is_admin() and created_by = auth.uid());

drop policy if exists plant_conv_admin_update on public.plant_conversation;
create policy plant_conv_admin_update on public.plant_conversation
  for update
  using (public.jwt_is_admin())
  with check (public.jwt_is_admin());

drop policy if exists plant_conv_admin_delete on public.plant_conversation;
create policy plant_conv_admin_delete on public.plant_conversation
  for delete
  using (public.jwt_is_admin());

-- ── plant_chat_message policies ────────────────────────────────────────────
drop policy if exists plant_msg_select on public.plant_chat_message;
create policy plant_msg_select on public.plant_chat_message
  for select
  using (
    public.jwt_is_chat_eligible()
    and exists (
      select 1 from public.plant_conversation c
       where c.id = conversation_id
         and c.archived_at is null
    )
  );

drop policy if exists plant_msg_insert on public.plant_chat_message;
create policy plant_msg_insert on public.plant_chat_message
  for insert
  with check (
    public.jwt_is_chat_eligible()
    and sender_id = auth.uid()
    and exists (
      select 1 from public.plant_conversation c
       where c.id = conversation_id
         and c.archived_at is null
    )
  );

-- Edit within 5 minutes of send AND only your own AND not-yet-deleted.
drop policy if exists plant_msg_update on public.plant_chat_message;
create policy plant_msg_update on public.plant_chat_message
  for update
  using (
    sender_id = auth.uid()
    and deleted_at is null
    and sent_at > (now() - interval '5 minutes')
  )
  with check (
    sender_id = auth.uid()
    and sent_at > (now() - interval '5 minutes')
  );

-- Delete = soft-delete via UPDATE deleted_at; hard DELETE is admin-only.
drop policy if exists plant_msg_admin_delete on public.plant_chat_message;
create policy plant_msg_admin_delete on public.plant_chat_message
  for delete
  using (public.jwt_is_admin());

-- ── plant_chat_ack policies ────────────────────────────────────────────────
drop policy if exists plant_ack_select on public.plant_chat_ack;
create policy plant_ack_select on public.plant_chat_ack
  for select
  using (public.jwt_is_chat_eligible());

drop policy if exists plant_ack_insert on public.plant_chat_ack;
create policy plant_ack_insert on public.plant_chat_ack
  for insert
  with check (
    public.jwt_is_chat_eligible()
    and user_id = auth.uid()
  );

drop policy if exists plant_ack_delete on public.plant_chat_ack;
create policy plant_ack_delete on public.plant_chat_ack
  for delete
  using (user_id = auth.uid());

-- ============================================================================
-- Realtime — publish the three tables so clients (PWA + Electron + hub audit)
-- receive INSERT/UPDATE/DELETE events over the Supabase Realtime WebSocket.
-- Filtering by conversation_id happens client-side via channel subscriptions.
-- ============================================================================

alter publication supabase_realtime add table public.plant_conversation;
alter publication supabase_realtime add table public.plant_chat_message;
alter publication supabase_realtime add table public.plant_chat_ack;
