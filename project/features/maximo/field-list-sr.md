# Field List → Maximo bridge

## Purpose

Route PWA / desktop field-list submissions to Maximo without changing user-facing UI or
breaking the local H2/SharePoint flow. Ops uses Maximo as the work-management system of
record; before this bridge, field lists lived only in H2 + SharePoint and had to be
re-entered manually.

Each row dispatches to **SR** (Service Request — planner-triaged intake) or **WO** (Work
Order — committed work with a worktype) based on `listType`. Insulation-typed field
lists route to WO so an insulation contractor can programmatically close the WO from
their phone when the work is done. Other types route to SR.

## Deployment shape

**Hub-only bridge.** All Maximo write-side beans are gated on `sync.role=hub` — the
shared jar runs on the hub AND every desktop with the same API key, and rows carry
`maximoSyncPending` across CRDT sync. Without the hub-only gate, a desktop receiving a
pending row would independently call `bridge.submit()` and create a duplicate Maximo
record. Same convention as `FieldListValueSeeder`, `HubSyncConfig`, etc.

## Authentication + authorization

| Path | Role | Notes |
|---|---|---|
| `/api/pwa/field-list-item/**` | PLANT, ADMIN | PWA submit / retrieve. Formerly anonymous; now gated because writes route to Maximo. |
| `/ng/field-list-items/**` | PLANT, ADMIN | Desktop CRUD. Mirrors the PWA gate. Fixed 2026-08-16 (previously fell through to `.anyRequest().authenticated()`). |
| `/api/pwa/secured/insulation/**` | INSULATION, PLANT, ADMIN | Contractor close-only surface. Contractors CANNOT create field lists here; that lives at `/api/pwa/field-list-item/**` (PLANT+ADMIN only). |

**Ownership model** — shared pool. Any `ROLE_INSULATION` user may close any active
insulation WO. If per-contractor assignment becomes needed, add an assignment column on
`FieldListItem` + filter in `PwaInsulationService.listActive()` + verify in
`markComplete()`.

## Event-driven architecture

Bridge work runs in **AFTER_COMMIT event listeners**, not directly in the caller's
transaction. Rationale (codex round 1 finding): `bridge.submit()` called from a
`@Transactional` caller could not use `REQUIRES_NEW` to persist the Maximo record id
independently — the caller's row INSERT was still uncommitted in the suspended parent
tx and the new tx couldn't see it, leaving an orphan Maximo record.

Event handling: caller commits → row is durable in H2 → listener fires → bridge calls
Maximo in a fresh tx → persists Maximo id on the already-committed row. If the caller's
tx rolls back, the event is discarded — nothing is sent to Maximo.

**Events** (see `MaximoFieldListEvents.java`):

| Event | Fired when | Handler action |
|---|---|---|
| `Submitted(id)` | New row saved (direct create, SP-import CREATE, CRDT-sync-apply new-row) | Route to Maximo (SR or WO) |
| `Cancelled(id, reason)` | Row soft-deleted | Cancel Maximo record via `changeStatus` |
| `StatusChanged(id, newStatus, actor)` | Local status changes (direct, PWA-update, SP-import UPDATE, CRDT-sync-apply) | If `newStatus == wo-completion-status` → COMP the WO |
| `ContractorClosed(id, actor)` | SP-import detects `ContractorCompleted=true` rising edge | COMP the WO (Insulation only per allowlist) |
| `AttachmentAdded(fieldListItemId, attachmentId)` | PermitAttachment saved on a FieldListItem | Upload to Maximo doclinks |

**Idempotency + concurrency:**

- `bridge.submit()` takes a `PESSIMISTIC_WRITE` lock on the row before deciding to create
  (codex round 3 fix). Concurrent Submitted events for the same row serialize on the
  lock; the second sees the recordId populated and no-ops. Prevents duplicate SR/WO.
- `bridge.complete()` early-returns if the Maximo record is already at a terminal status
  (COMP/CLOSE/CAN). Same-row concurrent completions serialize on the same lock used by
  the status-poll reconcile.
- `bridge.complete()` with no `maximoHref` sets `maximoCompletePending=true` (codex
  round 3 fix) so the backfill loop retries after the parent WO exists. Covers the
  create-and-close ordering race.

## Data flow — five entry points

Every write path publishes the same events, so a row reaches Maximo the same way
regardless of how the write arrived.

### 1. PWA online submit

```
PWA client (JWT)
  │  POST /api/pwa/field-list-item/submit
  ▼
PwaFieldListItemService.submitFieldListItem
  ├─ (1) repo.saveAndFlush(entity)            ← H2 durable, CRDT emits
  ├─ (2) publishEvent(Submitted)              ← AFTER_COMMIT
  ├─ (3) attachment saves + publishEvent(AttachmentAdded)
  └─ (4) spAdapter.create → SharePoint (best-effort)
                              │
       commit → Submitted listener fires ─▶ bridge.submit ─▶ Maximo SR/WO create
                              │
                              └─▶ AttachmentAdded listener ─▶ Maximo doclink upload
```

### 2. PWA offline submit (PA fallback)

Hub unreachable at submit time. PWA falls through the local outbox → PA-Gateway →
SharePoint directly. When the hub comes back online, its SharePoint polling job imports
the row and everything downstream fires as in flow 5.

```
PWA client (offline)
  │  local IndexedDB queue → next online
  ▼
PowerAutomate Gateway (verify-jwt edge fn)
  │  ├─ Hub JWT (RS256, dual-issuer)
  │  └─ Supabase JWT (HS256, fallback issuer for offline registration)
  ▼
SharePoint create item (Field Lists list)
  │
  └─ later: hub SP-poll imports the row (flow 5)
```

### 3. Desktop / JG Portal submit

```
Angular JG Portal
  │  POST /ng/field-list-items
  ▼
NgFieldListItemService.save
  ├─ repo.save(entity)
  └─ publishEvent(Submitted) if new record       ← AFTER_COMMIT
                              │
       commit → Submitted listener fires ─▶ bridge.submit ─▶ Maximo SR/WO create
```

### 4. CRDT sync-apply on hub

Another desktop wrote the row (created / soft-deleted / status-changed) and it
propagates to the hub via `FieldChange` CRDT sync.

```
Peer desktop write → FieldChange stream → hub
  │
  ▼
FieldSyncService.applyChanges
  │  service.save(entity)                        ← was entityManager.merge (fixed round 2)
  ▼
FieldListItemSyncService.save
  ├─ repo.save(entity)
  └─ publishEvent(...)                           ← AFTER_COMMIT
      ├─ deleted + href present     → Cancelled
      ├─ !deleted + no recordId     → Submitted
      └─ !deleted + WO-routed + non-terminal Maximo status
                                    → StatusChanged (listener filters to wo-completion-status)
```

**Fix history:** the sync-apply path used to call `entityManager.merge(entity)` directly,
bypassing `FieldListItemSyncService.save()` — so events never fired for sync-arrived
writes. Fixed in `FieldSyncService.java:1424` — universal fix benefiting every entity's
sync-arrived creates.

### 5. SharePoint import (hub-only)

Runs every 60s per `getSyncIntervalMs()`. Detects both new-row creates and field updates
from PA (offline PWA submits, contractor-close writes, ops-side SP edits).

```
SharePointSyncOrchestrator (hub only)
  │  every 60s
  ▼
FieldListItemSharePointSyncable.processRemoteItem
  ├─ CREATE path:
  │   ├─ mapper.convertToEntity(remote); repo.save
  │   ├─ publishEvent(Submitted)                                       → bridge.submit
  │   └─ if (remote.contractorCompleted) publishEvent(ContractorClosed) → bridge.complete
  └─ UPDATE path:
      ├─ resolveConflicts (field-level LWW)
      ├─ applySelectiveFields (only fields where SP won LWW)
      ├─ if (fieldsToApply contains "status" && WO-routed && Maximo non-terminal)
      │       publishEvent(StatusChanged)                              → bridge.complete
      └─ rising-edge detection on ContractorCompleted (boolean, not the By string)
          publishEvent(ContractorClosed)                               → bridge.complete
```

**Rising-edge signal is the `ContractorCompleted` boolean** (codex round 3 fix). Earlier
version used `ContractorCompletedBy != null && !isBlank()` — silently dropped
`true`-with-blank-By events and left the WO open.

### 6. Contractor Mark-Complete (direct online path)

```
Insulation PWA (INSULATION JWT)
  │  POST /api/pwa/secured/insulation/{id}/complete
  ▼
PwaInsulationService.markComplete
  ├─ verify listType == "Insulation Removal"
  ├─ verify recordType == "WO"
  └─ maximoBridge.complete(entity, memo)         ← same bridge, direct call
```

## Delete path

```
NgFieldListItemService.softDelete(id)
  ├─ entity.setDeleted(true); repo.save(entity)
  └─ publishEvent(Cancelled)                     ← AFTER_COMMIT
              │
              ▼
   listener → repo.findByIdIncludingDeleted     ← @Where(deleted=false) doesn't apply
              → bridge.cancel(entity, reason)
                    ├─ recordType=WO → woAdapter.changeStatus(href, "CAN", reason)
                    └─ recordType=SR → srAdapter.changeStatus(href, "CANCELLED", reason)
              On failure: maximoCancelPending=true (backfill retries)
```

## Reverse sync (Maximo → H2)

`MaximoFieldListSyncJob` on the hub, two `@Scheduled` methods:

- **`backfillPending`** (every 5 min): retries `bridge.submit()` for
  `maximoSyncPending=true`, `bridge.cancel()` for soft-deleted with
  `maximoCancelPending=true`, `bridge.complete()` for `maximoCompletePending=true`.
  Batch-capped by `backfill-batch-size`.
- **`pollStatuses`** (every 60 s): OSLC queries SR AND WO with `statusdate` in the last
  `status-poll-lookback-min` minutes (two independent queries — OSLC has no OR across
  ticket types). For each returned row, looks up matching local row by `(recordType,
  recordId)` tuple; updates `maximoStatus` if changed. Reconcile uses
  `findAndLockByMaximoRecord` (`PESSIMISTIC_WRITE`) to serialize against
  `bridge.complete()` on the same row.

## Contractor completion allowlist

`onContractorClosed` in `MaximoFieldListEventListener` gates on
`maximo.field-list.contractor-completable-types` (default "Insulation Removal", case-
insensitive against `listType.name`). A crafted PA payload setting
`ContractorCompleted=true` on any OTHER type is rejected with a warn log — this prevents
a rogue offline write from COMPing an SR/WO for a non-contractor workflow (codex round 3
fix).

To add a new contractor workflow, add the FieldListType name to both:

```properties
maximo.field-list.route-to-wo-types=Insulation Removal,Painting
maximo.field-list.contractor-completable-types=Insulation Removal,Painting
```

## PowerAutomate flow setup

The offline PWA path posts to a PA V2 gateway (`verify-jwt` edge fn) that validates a
dual-issuer JWT (hub RS256 primary, Supabase HS256 fallback) and forwards to
SharePoint. Gotchas learned during PA gateway setup:

- **JWT secret env var must be `SB_JWT_SECRET`** — NOT `SUPABASE_JWT_SECRET` (edge-fn
  runtime reserves the `SUPABASE_` prefix and refuses to expose those vars).
- **HUB_JWT_PUBLIC_KEY must be on a single line** — no PEM line breaks. Base64-decode
  and re-encode without newlines before pasting.
- **`ContractorCompleted` column must be a Yes/No** — not a choice column. The syncable
  reads via `JsonNode.asBoolean(false)` and `Boolean b` cast; a string "Yes"/"No" via
  a choice column fails silently to `false` and the WO never COMPs.

SharePoint columns (Field Lists list) expected by the adapter:

| Column | Type | Set by | Read by |
|---|---|---|---|
| Title | Text | PWA / desktop / SP | full round-trip |
| ListType | Text | PWA / desktop / SP | full round-trip |
| Status | Text | PWA / desktop / SP | full round-trip |
| Location | Text | PWA / desktop / SP | full round-trip |
| SpecificLocation | Text | PWA / desktop / SP | full round-trip |
| Notes | Multi-line | PWA / desktop / SP | full round-trip |
| DateObserved | Datetime | PWA / desktop / SP | full round-trip |
| EquipmentTag | Text | PWA / desktop / SP | full round-trip |
| SubmitterName | Text | PWA / desktop / SP | full round-trip |
| SubmitterEmail | Text | PWA / desktop / SP | full round-trip |
| SubmitterPhone | Text | PWA / desktop / SP | full round-trip |
| PwaId | Text | PWA (localUuid) | dedup key on SP-import |
| MaximoLocation | Text | Desktop Maximo picker (deferred wiring for PWA) | round-trip |
| MaximoAssetnum | Text | Desktop Maximo picker | round-trip |
| ContractorCompleted | Yes/No | Insulation PWA (offline path) | rising-edge → ContractorClosed |
| ContractorCompletedBy | Text | Insulation PWA (offline path) | actor attribution in Maximo memo |
| ContractorCompletedAt | Text | Insulation PWA (offline path) | display only |

**Adapter never sends `ContractorCompleted*` from the hub** (see `toMap()`) — only the
PWA offline-close flow writes them. Hub reads them via SP-import and reacts by
publishing ContractorClosed.

## Full-item update strategy

`FieldListItemSharePointAdapter.changeStatus(...)` was REMOVED (marked
`changeStatus_removed`). It used to send a partial payload with only the Status column;
the PA Update-item action maps every column, so a partial payload set every omitted
column to null on SharePoint (Title/Location/etc. silently wiped). All callers now
build a full `FieldListItemDto` from the current entity and call `update(spId, dto)`
— the Update-item action is safe when every mapped column is present.

## Schema (H2 additions on `field_list_item`)

| Column | Type | Meaning |
|---|---|---|
| `maximoRecordId` | VARCHAR | SR ticketid or WO wonum. NULL until create succeeds. Dedup key with recordType. |
| `maximoRecordType` | VARCHAR | "SR" or "WO". Discriminates cancel/status-poll/complete dispatch. |
| `maximoHref` | VARCHAR | Maximo OSLC href. Needed for PATCH/action calls. |
| `maximoStatus` | VARCHAR | Last-seen Maximo status. SR: NEW/CLOSED/CANCELLED. WO: WAPPR/APPR/INPRG/COMP/CLOSE/CAN. |
| `maximoSyncPending` | BOOL | Create failed; backfill retries. |
| `maximoCancelPending` | BOOL | Cancel failed; backfill retries. |
| `maximoCompletePending` | BOOL | Complete failed (or href missing at close time); backfill retries. |
| `maximoLocation` | VARCHAR | From Maximo Location tree picker (optional). |
| `maximoAssetnum` | VARCHAR | From Maximo Asset picker (optional). |
| `contractorCompletedBy` | VARCHAR | PWA offline contractor-close attribution. |
| `contractorCompletedAt` | VARCHAR | PWA offline contractor-close timestamp. |

## Config keys (`application.properties`)

```properties
# Master switch — bridge + job beans absent when off
maximo.field-list.enabled=false
maximo.api-key=<must be non-empty>
sync.role=hub                                          # bridge is hub-only

# Routing
maximo.field-list.classstructureid=                    # optional SR-path classstructureid
maximo.field-list.route-to-wo-types=Insulation Removal # comma FieldListType names → WO
maximo.field-list.wo-worktype-mappings=Insulation Removal:INS   # comma type:worktype pairs

# Lifecycle
maximo.field-list.wo-completion-status=Closed          # local status name that COMPs the WO
maximo.field-list.contractor-completable-types=Insulation Removal  # allowlist for offline close

# Backfill (retries create/cancel/complete failures)
maximo.field-list.backfill-interval-ms=300000          # 5 min
maximo.field-list.backfill-initial-delay-ms=60000
maximo.field-list.backfill-batch-size=20               # per-tick cap

# Status poll (Maximo → H2 reverse sync)
maximo.field-list.status-poll-interval-ms=60000        # 60 s
maximo.field-list.status-poll-initial-delay-ms=120000  # 2 min
maximo.field-list.status-poll-page-size=200
maximo.field-list.status-poll-lookback-min=30          # recent-window filter
```

**Insulation example (as deployed):**
```properties
maximo.field-list.enabled=true
maximo.api-key=<hub API key>
sync.role=hub
maximo.field-list.route-to-wo-types=Insulation Removal
maximo.field-list.wo-worktype-mappings=Insulation Removal:INS
maximo.field-list.contractor-completable-types=Insulation Removal
```
`INS` is the tenant's Insulation worktype code — verified in the Maximo worktype domain
(CM/IN/INS/MOC/PM/PRO/REG/SAF/WAR).

## Feature-flag off = zero cost

Missing `maximo.api-key`, `maximo.field-list.enabled=false`, or non-hub `sync.role` →
`MaximoFieldListBridge` bean is absent. Callers inject `Optional<MaximoFieldListBridge>`
which is empty; the `@TransactionalEventListener` bean is absent so events fire into a
void. Behavior identical to pre-feature — safe to ship the jar to desktops with the
flag off.

## What's deferred (not blocking prod)

- **`reportedby` from JWT** — anonymous submits use the API-key user. When a JWT is
  present with a resolved `maximoPersonid`, wire that in.
- **Attachment upload to Maximo doclinks — SHIPPED**. `MaximoAttachmentSyncService.uploadOne`
  handles the doclink upload including iPhone HEIC → JPEG conversion (per
  `maximo_heic_converter_2026_08_10` memory).
- **PWA Maximo picker parity** — desktop JG Portal has `maximo-location-picker` and
  `maximo-asset-picker` reactive-form components (fixed 2026-08-15 — was plain text
  input). The PWA still uses free-text; wire the picker in the next iteration.
- **FieldListType → classstructureid table** for SR path — currently one global
  classstructureid for all SRs.
- **WO priority / lead / persongroup** — created bare (WAPPR); ops triages.

## Files

**Backend — added:**
- `sevice/maximo/MaximoFieldListBridge.java` — SR/WO dispatch, submit/cancel/complete/refreshStatus with pessimistic locking
- `sevice/maximo/MaximoFieldListEvents.java` — event records (Submitted / Cancelled / StatusChanged / ContractorClosed / AttachmentAdded)
- `sevice/maximo/MaximoFieldListEventListener.java` — AFTER_COMMIT listener bean; hub-only
- `sevice/maximo/MaximoFieldListSyncJob.java` — backfill + unified SR+WO status-poll
- `sevice/maximo/MaximoAttachmentSyncService.java` — doclink upload with HEIC → JPEG

**Backend — modified:**
- `config/SecurityConfigSpring.java` — role gates for `/api/pwa/field-list-item`, `/api/pwa/secured/insulation`, `/ng/field-list-items`
- `entities/field_list/FieldListItem.java` — 10 Maximo/contractor columns
- `repository/field_list/FieldListItemRepo.java` — bridge/backfill/drift queries + `findAndLockById`
- `dto/field_list/FieldListItemDto.java` — Maximo state fields + `contractorCompleted` boolean
- `sevice/sync/FieldSyncService.java:1424` — `service.save(entity)` (was `entityManager.merge`) so sync-apply fires events for every entity type
- `sevice/angular/field_list/NgFieldListItemService.java` — publishes Submitted / StatusChanged / Cancelled / AttachmentAdded
- `sevice/angular/field_list/FieldListItemSyncService.java` — publishes events for CRDT-sync-arrived saves
- `sevice/pwa/PwaFieldListItemService.java` — publishes Submitted on create, StatusChanged on update
- `sevice/pwa/PwaInsulationService.java` — direct contractor `markComplete`
- `sevice/pwa/PwaFieldListItemController.java` / `PwaInsulationController.java`
- `sevice/sharepoint/adapters/FieldListItemSharePointAdapter.java` — 5 new SP columns; `changeStatus` removed (partial-payload wipe hazard)
- `sevice/sharepoint/syncables/FieldListItemSharePointSyncable.java` — publishes Submitted / ContractorClosed / StatusChanged with rising-edge detection

**PWA (ng-ui):**
- `features/field-list/**` — plant submit form with offline queue
- `features/insulation/**` — contractor active list + Mark Complete (online + offline via PA)

**Desktop (frontend/):**
- `features/field-list/**` — plant CRUD
- `shared/reactive-form/smart-form/*` — `maximo-location-picker` + `maximo-asset-picker` form-field types
