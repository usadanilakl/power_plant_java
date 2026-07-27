# Plant Chat

Shared plant-wide communication feature backed by **Supabase Postgres** with realtime subscriptions. Runs alongside — not replacing — the existing entity-scoped [Internal Messaging](messaging/internal-messaging.md) system that hangs off WorkRequest / JHA / etc. Plant Chat is a separate concept: a small set of open channels that any plant user can post into.

Status: **Design only** as of 2026-07-24. Depends on the dual-authority auth work (see [dual-auth](../dual-auth.md)) being merged first — Supabase project scaffold, RS256 JWT signing, and `PwaJwtAuthFilter` accepting Supabase-signed tokens are prerequisites.

## Why Supabase, not SharePoint

Original plan proposed a `PlantChatSharePointAdapter` mirroring every other entity's SP adapter. Rejected in favour of Supabase for these reasons:

- **Realtime is native.** Supabase Realtime pushes new rows to subscribers in ~100 ms. SharePoint is polling only — 15–60 s lag.
- **Rate limits.** SharePoint list writes cap around 600/min and views degrade past the 5,000-item threshold. Plant Chat at plant scale can flirt with both. Postgres does not.
- **PA flow footprint disappears.** No PA flow to author, protect, or rotate for chat writes.
- **Failure modes couple with auth.** Supabase is already an accepted dependency for auth fallback. Splitting chat onto SharePoint adds a second independent failure mode to defend.
- **Site clutter.** SharePoint admin has flagged growing list count. This adds zero more SP lists.

Data lives in Supabase Postgres with RLS. Hub subscribes to Supabase Realtime and mirrors every message into its own H2 for local audit, offline reads on desktops, and long-term retention beyond Supabase free-tier limits.

## Model

Three tables in Supabase (`public` schema, all RLS-enabled). Hub mirrors the same shape as JPA entities extending `BaseIdEntity` (auto sync via `FieldChangeEntityListener` for the H2 mirror side).

### `public.plant_conversation`

Represents one channel. Small number of these (~5–20 per plant) — created by admin.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `name` | text NOT NULL | e.g. "Operations", "Maintenance", "Unit 1 issues" |
| `description` | text | |
| `entity_type` | text | Optional: anchor to a WorkRequest / JHA / etc. NULL = free-floating channel |
| `entity_id` | bigint | With entity_type — points at a specific record |
| `is_editable` | boolean NOT NULL default false | Admin-set: can members delete / rename? Reserved; enforcement at UI. |
| `created_by` | uuid NOT NULL | auth.users.id — the admin who created it |
| `created_at` | timestamptz NOT NULL default now() |
| `archived_at` | timestamptz | Soft delete — hidden from lists, messages preserved |

**Hub-side mirror:** `PlantConversation extends BaseIdEntity` with a `supabaseId` (uuid) column for cross-store lookup.

### `public.plant_chat_message`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` — this is the `externalUuid` used for cross-store dedup |
| `conversation_id` | uuid NOT NULL REFERENCES plant_conversation ON DELETE CASCADE | |
| `sender_id` | uuid NOT NULL | auth.users.id |
| `sender_display_name` | text NOT NULL | Denormalised so historical messages survive user rename |
| `content` | text NOT NULL | Plain text; markdown parsed client-side |
| `is_important` | boolean NOT NULL default false | Sender-set at send time only |
| `requires_ack` | boolean NOT NULL default false | Sender-set at send time only; implies is_important |
| `sent_at` | timestamptz NOT NULL default now() |
| `edited_at` | timestamptz | NULL if never edited; editable within 5 min of send |
| `deleted_at` | timestamptz | Soft delete — shows as "(deleted)" placeholder |

Index on `(conversation_id, sent_at DESC)` for the primary lookup pattern.

**Hub-side mirror:** `PlantChatMessage extends BaseIdEntity`, `externalUuid` (unique) = the Supabase id. CRDT dedup on that column.

### `public.plant_chat_ack`

Read-state and important-message acknowledgement in one table.

| Column | Type | Notes |
|---|---|---|
| `message_id` | uuid NOT NULL REFERENCES plant_chat_message ON DELETE CASCADE | |
| `user_id` | uuid NOT NULL | auth.users.id |
| `acked_at` | timestamptz NOT NULL default now() |
| PK | (message_id, user_id) | Composite |

For an important message, the sender's view shows a filling "read by / acked by" list. For a regular message the ack row simply serves as the per-user last-read marker: a client's unread count is `count(messages) - count(acks for this user in this conversation)`.

## Access model

RLS policies (all `for select`, `for insert`, `for update` scoped by `auth.uid()`):

- **plant_conversation.select** — any authenticated user whose JWT `roles` claim intersects `{ROLE_ADMIN, ROLE_PLANT, ROLE_NAES, ROLE_JPOWER, ROLE_EMPLOYEE}`. Contractors excluded.
- **plant_conversation.insert / update / delete** — `ROLE_ADMIN` only.
- **plant_chat_message.select** — same as conversation.select; user must also see the parent conversation.
- **plant_chat_message.insert** — same select group, sender_id must equal auth.uid().
- **plant_chat_message.update** — sender_id equals auth.uid() AND sent_at within 5 min AND deleted_at IS NULL. This gates edits.
- **plant_chat_ack.insert / delete** — user_id equals auth.uid().

RLS relies on the `roles` claim being present in the JWT payload. Both hub and Supabase issue JWTs carrying that claim (dual-auth work handles this). Supabase-native JWT users get the claim populated from `raw_user_meta_data.roles`, which the reconciliation job keeps in sync from the hub `User.role` field.

## End-to-end flow

Legend: `P` = PWA, `D` = plant desktop (Electron + local Spring), `H` = hub, `S` = Supabase.

### Send (happy path — hub up)

```
P/D  →  POST /api/pwa/secured/plant-chat/{conv}/send    →  H  →  writes to S (INSERT)
                                                                  →  Supabase Realtime broadcasts
                                                                  →  hub SSE broadcasts (H mirror already saved)
```

Both the Supabase realtime channel and hub's SSE fire on a successful hub write. Subscribers on either channel see the message.

### Send (hub unreachable)

```
P/D  →  POST fails on hub  →  fallback: direct Supabase client INSERT
                                          →  Supabase Realtime broadcasts
                                          →  hub picks it up next time hub-drain runs
                                             (writes to H2 with externalUuid dedup)
```

No `mailto`, no PA, no Cloudflare Worker in the picture. Auth in this path uses the Supabase-signed JWT that the user already holds (dual-auth).

### Receive

- **Desktop with hub reachable:** existing hub SSE channel. Local Spring gets the message, saves to local H2, pushes IPC event → renderer toast.
- **Desktop with hub unreachable:** local Spring's Supabase Realtime subscription (kept open in parallel with SSE). Same code path from the subscription callback onward.
- **PWA:** subscribes to Supabase Realtime directly. Same shape.

### Hub-drain (recovery)

When hub comes back online after being unreachable:

1. Query Supabase for messages with `sent_at > lastDrainedAt`.
2. For each, upsert into H2 `PlantChatMessage` keyed on `externalUuid`.
3. CRDT sync propagates to any desktops that were also offline.
4. Advance `lastDrainedAt` checkpoint.

Runs on a `@Scheduled` every 30 s while hub is up. Idempotent — duplicates rejected by `externalUuid` unique constraint.

## Important flag + acknowledgement UX

- **Sender** ticks "Important" (highlight only) and/or "Requires acknowledgement" (implies important) at compose time.
- **Recipients** on Electron see a modal popup that requires an explicit "Acknowledge" click to dismiss. Sound. Red border. Cannot be ignored or auto-dismissed.
- **Recipients** on PWA see a persistent banner at top of chat until acked. No sound, no modal — matches "PWA notifications are less important" constraint.
- **Sender** view shows a live-updating "Acked by 3 of 7" line under the message. Realtime updates via the ack table subscription.
- Non-important messages fire regular toast on Electron (auto-dismiss 8s) and no notification on PWA.

## UI placement

### Electron

New tab in the existing `personnel.component.ts` alongside Schedule / Contacts / Contractors:

```
Personnel  [Schedule] [Contacts] [Contractors] [Conversations]
```

Left panel = conversation list. Right panel = messages with compose bar. Realtime subscription via local Spring's IPC broadcast (which in turn subscribes to Supabase or SSE).

Popup overlay for incoming messages is a separate top-of-window component, not confined to the personnel page.

### PWA

New top-level "Personnel" section (PWA does not have one today) housing `Schedule` and `Conversations`. Contractors don't see this section (RLS + route guard both block).

## Hub-side implementation summary

New:

- `PlantConversation`, `PlantChatMessage`, `PlantChatAck` JPA entities under `entities/messaging/plant/`.
- Repos.
- `PlantChatService` — send / list / ack / edit.
- `NgPlantChatController` for desktop UI at `/ng/plant-chat/*`.
- `PwaPlantChatController` for PWA at `/api/pwa/secured/plant-chat/*` (JWT-gated).
- `PlantChatSupabaseClient` — hub's write path to Supabase (uses service role key from dual-auth secrets).
- `PlantChatSupabaseDrainer` — `@Scheduled` reconciler that pulls recent Supabase rows into H2.
- `PlantChatRealtimeSubscriber` — keeps a Supabase Realtime WebSocket open on desktops. Bridges to local Spring via SSE.
- Extend `EntityTableRegistry` with the three new entity names for CRDT sync.

Reused:

- `PwaJwtAuthFilter` (already accepts hub- and Supabase-signed JWTs after dual-auth work).
- Existing SSE machinery for hub → desktop push.
- CRDT sync for desktop-to-desktop mirroring.

## Configuration additions

`application-secrets.example.properties`:

```
# Plant Chat via Supabase
plant-chat.supabase.enabled=true
plant-chat.supabase.realtime.reconnect-backoff-ms=2000,4000,8000,16000,30000
plant-chat.drain.interval-ms=30000
```

Supabase URL / service role key / anon key already provisioned by dual-auth work — reused here.

## Migration path

None — this is greenfield. Existing `Conversation`/`Message` entity-scoped chat stays as-is.

## Deferred / non-goals

- Threading (message replies as nested). Reactions.
- File attachments. Cover with a follow-up if requested.
- Push notifications on PWA (out of scope; matches "PWA notif not important" constraint).
- Search across message content. Basic filter by conversation only for v1; full-text search added later via Postgres `tsvector` if needed.
- Archive / retention rules for old messages. Supabase free tier is generous but not infinite — 90-day archive cron added in a follow-up.

## Open items to resolve during implementation

1. Confirm Supabase RLS `roles` claim access syntax — depends on how the dual-auth agent structured the metadata sync (may need to check `auth.jwt() -> 'user_metadata' -> 'roles'` vs top-level claim).
2. Confirm Supabase Realtime WebSocket authentication mechanism from server-side Java — the JS client is well-documented, but the Java path may need OkHttp WebSocket + manual JWT handshake.
3. Decide: hub-drain writes messages under a "system" user in H2, or preserves original sender_id? Preserving is better for audit; requires resolving Supabase UUID back to hub User.id via the `user_link` table set up in dual-auth.
