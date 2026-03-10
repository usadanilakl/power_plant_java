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
    - more efficient management of instrumentation list - set up a flag on sharepoint that is set when new item is added (or just check number of items, update PWA local DB only if different between PWA and SP)
    - prevent creation of items with the same tag number - update instead.

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
