## Functionality
User opens instrumentation log page:
    - request is sent to server to get updated list
    - saves list locally in indexed db - clears old items, saves new
User selects item from left menu (searchable):
    - instrument tag number and description are populated in the form
    - date and time are auto populated
    - name autopopulated from the user data gathered at first interaction with PWA
    - user sets status, comment, attachments
    - submits to server -> server saves locally -> saves on SP. If server unavailabe PWA uses PA to save log on SP.
If item cannot be found user can submit a new instrument from PWA:
    - open new instrumenation form
    - fill out
    - submit

From JG Portal (power_plant_java) user can:
    - view instrumentation log
    - view instrumentation list
    - add new instrumentaion items (single or bulk)

Potential improvements:
    - ~~more efficient management of instrumentation list~~ — DONE 2026-08-14: `/state` returns a
      `count:lastModified` version, `/changes?since=` returns only what moved, and the client
      reconciles on row count. See "Register sync" below.
    - ~~prevent creation of items with the same tag number - update instead~~ — DONE: the hub
      rejects a duplicate tag with `requiresMerge` and the client offers a field-by-field merge.

## Register sync (2026-08-14)

    SharePoint <-> hub H2  ->  /state (version)  ->  /changes?since= (delta)  ->  IndexedDB  ->  screens

- The hub owns the register: its SharePoint syncable polls every 30s and CRDT sync levels the
  desktops, so the PWA never reads SharePoint directly.
- `/state` returns `count:lastModified`. Unchanged version = no transfer at all.
- Changed version = fetch **only the delta** since the last hub-issued `lastModified`. Every log
  submission moves its instrument's summary and therefore the register version, so without this one
  person logging anything forced every device to re-download ~3200 rows on its next open.
- The delta cannot express deletions (soft-deleted rows just stop appearing), so the client compares
  its row count against the hub's `itemCount` and falls back to a full pull on any mismatch.
- Power Automate answers are **never** used as a delta cursor — SharePoint's `Modified` is a
  different clock. The PA path stays full-pull, throttled to once per 15 minutes per device.
- Offline: logs *and* new instruments queue in an IndexedDB outbox and replay on reconnect
  (instruments first). A queued instrument is written into the local register as `pendingSync` so it
  is searchable and loggable immediately. An app-wide pill shows the unsent count until it drains.

## Access control

Gated on **`ROLE_INSTRUMENTATION` or `ROLE_ADMIN`** — granted per user, deliberately not implied by
`ROLE_PLANT`. Enforced in three places that must agree:

| Layer | Rule |
|---|---|
| Hub, PWA API | `/api/pwa/secured/instruments/**`, `/api/pwa/secured/instrument-log/**` |
| Hub, desktop API | `/ng/instruments/**`, `/ng/instrument-logs/**` (DELETE is ADMIN-only) |
| PWA client | `instrumentationGuard` + `AuthService.isInstrumentation()`; the Home tile and menu entry are hidden without it |
| Power Automate gateway | per-target condition on the `instrument` case — see the alignment doc §5 |

The gateway matters because the Power Automate fallback bypasses the hub entirely; if it checks a
different role than the hub, the fallback admits or refuses the wrong people.

## Deletion

`DELETE /ng/instruments/{id}` and `DELETE /ng/instrument-logs/{id}`, ADMIN-only.

- **SharePoint first, then the local soft delete.** Reversing that order hides the row behind
  `@Where(deleted = false)`, so the next SharePoint pull no longer matches it by tag and re-creates
  it. An already-absent SharePoint item (404) counts as success so a half-completed delete stays
  retryable.
- Locally it is the standard soft delete (`deleted = true` via JPA), so the removal propagates to
  every desktop over CRDT sync. In SharePoint it is a real delete, which lands in the site Recycle
  Bin — restorable for 93 days.
- **Logs are never cascaded.** Deleting an instrument leaves its logs intact: they record what
  somebody observed at a point in time, and retiring the instrument doesn't unmake the observation.
  Logs are keyed by tag string, not by FK, so they simply become historical. The one consequence is
  that reusing a retired tag re-associates the old history with it — which is usually correct, since
  the tag identifies the physical point.
- Log deletion exists for genuine mistakes and test data, not as routine practice.

## Outbound catch-up

Both instrument syncables are pull-only. `InstrumentOutboundSharePointSync` (hub-only, every 60s)
pushes any instrument or log still holding `sharepointId IS NULL`, so a SharePoint outage during
submission self-heals instead of stranding the row in H2 forever.

Power Automate must be kept in step with the hub — the outstanding differences are listed in
[instrumentation-power-automate-alignment.md](instrumentation-power-automate-alignment.md).

## Proposed Relationship Model (Recommended)

Yes. Each `Instrumentation Log` item in SharePoint should store a reference to the parent `Instrumentation` item.

- Relationship: `Instrumentation (1) -> (N) Instrumentation Log`
- Reference field on log row: `instrumentId` (SharePoint lookup/ID to instrumentation master row)
- Keep existing `Tag Number` on log as denormalized read value for quick display/debug.

## PWA Section

- PWA still submits log payload with `instrumentTagNumber` and metadata.
- PWA does not need to know SharePoint numeric `instrumentId` at form time.
- For retries/fallbacks, keep sending stable `localUuid`.
- Optional future optimization:
  - when selected instrument already has known `sharepointId`, include `instrumentSharepointId` in payload.

## Java Section

- On server log submit:
  1. Resolve/create instrumentation master by `tagNumber`.
  2. Capture master `sharepointId`.
  3. Create log item with both:
     - `instrumentId` reference (preferred source of truth)
     - `Tag Number` text copy (for resilience/reporting)
  4. If log created first (PA fallback path), run post-step upsert to backfill `instrumentId`.
- On sync from SharePoint to H2:
  - match local log by `sharepointId`,
  - if missing, fallback match by `localUuid`,
  - persist linkage to local instrument entity using `instrumentId` / tag-based fallback.

## SharePoint Section

- `Instrumentation` list remains master.
- `Instrumentation Log` list must include:
  - `InstrumentId` (Lookup -> Instrumentation list ID) or equivalent numeric ref column.
  - Existing fields: `Tag Number`, `Description`, `Status`, `Date`, `Time`, `Name`, `Comment`, `PwaId`.
- Flow behavior for new log:
  1. Find instrumentation item by `Tag_x0020_Number`.
  2. If missing, create instrumentation item first.
  3. Create log row with `InstrumentId` set to the instrumentation row ID.
  4. Update instrumentation status fields from log submission.
