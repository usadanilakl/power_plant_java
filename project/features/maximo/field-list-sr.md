# Field List → Maximo bridge (v1)

## Purpose

Route PWA field-list submissions to Maximo, without changing the PWA UI or breaking the
current H2/SP flow. Ops uses Maximo as its work-management system of record; before this
bridge, Field Lists were only in H2 + SharePoint and had to be manually re-entered into
Maximo.

Each row is dispatched to **SR** (Service Request — default, planner-triaged intake) or
**WO** (Work Order — committed work with a specific worktype) based on the row's
`listType`. Insulation-typed field lists route to WO so ops can programmatically close
them when the contractor finishes; other types route to SR so planners triage before ops
commits work.

## Data flow

```
PWA submits Field List
        │
        ▼
POST /api/pwa/field-list-item/submit
        │
        ▼
PwaFieldListItemService.submitFieldListItem()
        │
        ├─── (1) repo.saveAndFlush(entity)        ← H2, always. Triggers CRDT sync.
        │
        ├─── (2) attachments repo save
        │
        ├─── (3) maximoBridge.submit(entity)      ← IF feature-flag ON. Best-effort.
        │           │
        │           ├─ listType in route-to-wo-types ─▶ woAdapter.create(...) with worktype
        │           │                                    → recordType=WO, recordId=wonum
        │           └─ else                              ─▶ srAdapter.create(...)
        │                                                    → recordType=SR, recordId=ticketid
        │
        │           On success: set maximoRecordId + maximoHref + maximoStatus + maximoRecordType
        │           On failure: set maximoSyncPending=true  (backfill retries)
        │
        └─── (4) spAdapter.create(dto)            ← Existing SP push. Best-effort.
                    │
                    └─ success → set sharepointId, upload attachments
```

**Delete:**
```
NgFieldListItemService.softDelete(id)
        │
        ├─── entity.setDeleted(true); repo.save(entity)
        │
        └─── IF entity.maximoHref != null AND bridge present:
              maximoBridge.cancel(entity, "Retracted in PWA/hub")
                    │
                    ├─ recordType=WO → woAdapter.changeStatus(href, "CAN", reason)
                    └─ recordType=SR → srAdapter.changeStatus(href, "CANCELLED", reason)
                    On failure: maximoCancelPending=true  (backfill retries)
```

**Status change → auto-complete (WO only):**
```
NgFieldListItemService.changeStatus(id, statusName)
        │
        ├─── entity.setStatus(...); repo.save(entity)
        ├─── SP push
        │
        └─── IF statusName == wo-completion-status (default "Closed") AND bridge present:
              maximoBridge.complete(entity, memo)
                    │
                    ├─ recordType!=WO → no-op (SRs are planner-driven)
                    ├─ already at COMP/CLOSE/CAN → no-op (idempotent)
                    └─ else → woAdapter.changeStatus(href, "COMP", memo)
```

## Reverse sync (Maximo → H2)

`MaximoFieldListSyncJob` runs on the hub with two `@Scheduled` methods:

- **`backfillPending`** (every 5 min): retries `bridge.submit(...)` for rows with
  `maximoSyncPending=true`, and `bridge.cancel(...)` for soft-deleted rows with
  `maximoCancelPending=true`. Batch-capped by `maximo.field-list.backfill-batch-size`.
  Same flags cover both SR and WO paths.

- **`pollStatuses`** (every 60 s): queries Maximo for **both SR and WO** records with
  `statusdate` in the last `maximo.field-list.status-poll-lookback-min` minutes
  (default 30). Two independent OSLC queries per tick (OSLC has no `OR` across ticket
  types). For each returned row, looks up the matching local row by `(recordType,
  recordId)` tuple; updates `maximoStatus` if changed. Ignores records not created by
  this hub (no matching local row).

## Feature flag

Bridge + job beans are gated on **both**:

```properties
maximo.api-key=<must be set>
maximo.field-list.enabled=true
```

Missing either → beans are absent → both `PwaFieldListItemService` and
`NgFieldListItemService` inject `Optional<MaximoFieldListBridge>` empty → the Maximo
call is a no-op → behavior is identical to before the feature. Safe to deploy the jar
with the flag off, no runtime cost.

## Key design decisions

| Decision | Why |
|---|---|
| H2 save always, regardless of Maximo | H2 is the source of truth for CRDT sync + local audit. Maximo is a downstream copy. |
| Best-effort, never throws | A Maximo outage must not block a PWA submit. Backfill picks up failures. |
| Dedup via `maximoRecordId` on H2 | Tenant probe confirmed `spi:externalrecid`/`spi:externalsystem` are NOT in the SR schema on this tenant. Local record id is the only reliable dedup key. |
| Per-type routing (SR vs WO) instead of SR-only | Direct WO create gives us the wonum immediately — we can COMP it programmatically when the local status flips to Closed. With SR-only, a manual planner-escalation in Maximo creates a WO whose number we never learn, breaking the close-when-done capability. |
| Cancel via `wsmethod:changeStatus` (both SR + WO) | WO adapter's `changeStatus` is proven live (parts checkout, PM completion). SR adapter uses the same pattern with MERGE-PATCH fallback. |
| Status poll uses `statusdateFrom` OSLC filter | OSLC has no `OR` and no batch-by-id endpoint. A recent-window scan is the pragmatic choice; volume is bounded (~1000 total SRs on this tenant, similar WO cadence). |
| No `classstructureid` mapping table in v1 | Left as `maximo.field-list.classstructureid` (blank default) for SR path. WO path uses `worktype` via `wo-worktype-mappings` — real value comes from Maximo admin. |
| No `reportedby` for anonymous submits | The PWA field-list endpoint is JWT-optional today. When a JWT is present with a resolved `maximoPersonid`, wiring that in is a v2. |
| `maximoStatus` distinct from local `status` (Value ref) | The two lifecycles are separate — PWA users manage their own `status`, Maximo drives `maximoStatus`. `wo-completion-status` is the bridge point that says "when the LOCAL status hits this name, close the Maximo WO". |
| WO location + assetnum left null on create | FieldList's `location`/`equipment` don't reliably map to Maximo location codes without a lookup table. Ops assigns on triage. |

## Schema (H2 additions on `field_list_item`)

| Column | Type | Meaning |
|---|---|---|
| `maximoRecordId` | VARCHAR | For SR: ticketid (e.g. "5670"). For WO: wonum (e.g. "J26-41830"). NULL until create succeeds. Dedup key when paired with recordType. |
| `maximoRecordType` | VARCHAR | "SR" or "WO". Discriminates cancel + status-poll + complete dispatch. |
| `maximoHref` | VARCHAR | Maximo OSLC href (e.g. `_U1IvMTAwMg--`). Needed for PATCH/action calls. Works for both SR and WO. |
| `maximoStatus` | VARCHAR | Last-seen Maximo status. SR: NEW/CLOSED/CANCELLED. WO: WAPPR/APPR/INPRG/COMP/CLOSE/CAN. |
| `maximoSyncPending` | BOOL | True when the initial create attempt failed and backfill should retry. |
| `maximoCancelPending` | BOOL | True when local delete happened but cancel failed and needs retry. |

## Config keys (all in `application.properties`)

```properties
maximo.field-list.enabled=false                       # master switch
maximo.field-list.classstructureid=                   # optional SR-path classstructureid
maximo.field-list.route-to-wo-types=                  # comma FieldListType names → WO route
maximo.field-list.wo-worktype-mappings=               # comma FieldListType:worktype pairs
maximo.field-list.wo-completion-status=Closed         # local status name that COMPs the WO
maximo.field-list.backfill-interval-ms=300000         # 5 min
maximo.field-list.backfill-initial-delay-ms=60000     # 1 min
maximo.field-list.backfill-batch-size=20              # per-tick cap (applies to create + cancel)
maximo.field-list.status-poll-interval-ms=60000       # 60 s
maximo.field-list.status-poll-initial-delay-ms=120000 # 2 min
maximo.field-list.status-poll-page-size=200           # per-query cap (applied to SR AND WO independently)
maximo.field-list.status-poll-lookback-min=30         # recent-window filter (shared across SR + WO)
```

**Insulation example:**
```properties
maximo.field-list.enabled=true
maximo.field-list.route-to-wo-types=Insulation Removal
maximo.field-list.wo-worktype-mappings=Insulation Removal:INS
```
(`INS` is the tenant's Insulation worktype code — verified 2026-08-15 in Maximo's worktype domain: CM/IN/INS/MOC/PM/PRO/REG/SAF/WAR.)

## What's NOT in v1 (deferred)

- **`reportedby` from JWT** (attribution). Anonymous submits use the API-key user.
- **Attachment upload to record** (uses `MaximoDoclinksAdapter.upload` — different path
  than SP's `PermitAttachmentRepo`). Attachments land in H2 + SP only; Maximo record has
  no doclinks. Reasonable follow-up.
- **Asset/location mapping** — field list has `specificLocation` string + optional
  equipment ref; neither reliably maps to Maximo asset/location PKs without a lookup
  table.
- **FieldListType → classstructureid table** for SR path — currently one global
  `classstructureid` for all SRs.
- **WO priority / lead / persongroup** — created bare (WAPPR); ops triages.

## Files

**Added:**
- `sevice/maximo/MaximoFieldListBridge.java` — SR-vs-WO dispatch, submit/cancel/complete/refreshStatus
- `sevice/maximo/MaximoFieldListSyncJob.java` — backfill + unified SR+WO status-poll `@Scheduled`

**Modified:**
- `entities/field_list/FieldListItem.java` — 6 columns (`maximoRecordId`, `maximoRecordType`, `maximoHref`, `maximoStatus`, `maximoSyncPending`, `maximoCancelPending`)
- `repository/field_list/FieldListItemRepo.java` — 3 query methods, keyed on `(recordType, recordId)`
- `sevice/maximo/MaximoServiceRequestAdapter.java` — `changeStatus`, `cancel`
- `sevice/maximo/MaximoWorkOrderAdapter.java` — added 5-arg `create(desc, longDesc, location, worktype, siteid)` overload
- `sevice/pwa/PwaFieldListItemService.java` — `bridge.submit` after H2 save
- `sevice/angular/field_list/NgFieldListItemService.java` — `bridge.cancel` on soft delete, `bridge.complete` on status → `wo-completion-status`
- `resources/application.properties` — 11 feature-flag keys
