## Description

Work request is submitted by people who will be performing work. It includes the following information:

1. Person requesting (auto set to name provided during first visit)
2. Date of work to be performed
3. Affected Equipment
4. Scope of work
5. Associated Permits:
    - Hot work, if so then:
        - Supervisor
        - Fire-Watch
    - Confined Space, if so:
        - Space(s) to be entered
    - Energized work — **not modelled** (no field on the entity)
    - Purging — **not modelled**
    - Excavating — **not modelled**
6. Declared hazards — the same checkbox sets the permits carry:
    - Safety hazards (`SwHazards`) — always shown
    - Hot work precautions (`HotWorkMeasures`) — only when Hot Work = Yes
    - Confined space hazards (`ConfinedSpaceHazards`) — only when Confined Space = Yes
7. Hot work detail (`HotWorkProfile`) — only when Hot Work = Yes:
    - Type: welding / grinding / torch cutting / plasma cutting / arc gouging /
      brazing-soldering / open flame-heating / other (+ free text). At least one required.
    - **Hexavalent chromium assessment — only when Welding is ticked, and then mandatory:**
      hot work method (High 9 / Medium 3 / Low 1) x base metal chrome content
      (High 9 / Medium 3 / Low 1)
8. Attachments (optional):
    - pdf/jpg
    - video
7. JHA for the work to be performed (separate permit form)
8. Time submitted (Now)

WorkRequest extends BasePermit so it includes all fields from there.

{
  "dateOfWork": "2026-02-11",
  "timeOfWork": "15:20",
  "workRequestedBy": "DK",
  "company": "DK",
  "locationOfWork": "Location",
  "affectedEquipment": "Eq",
  "workScope": "Scope",
  "isLOTORequired": "Yes",
  "isHotWorkRequired": "No",
  "isConfinedSpaceEntryRequired": "No",
  "foremanName": "",
  "fireWatchName": "",
  "spaceToBeEntered": "",
  "status": "Active",
  "submitterName": "DK",
  "submitterEmail": "dk@company.com",
  "submitterPhone": "555-1234",
  "submitterCompany": "DK",
  "timeSubmitted": "2026-02-11T03:40:54Z"
}

## Backend Architecture

### Entity
- `WorkRequest` extends `BasePermit` → `BaseAuditEntity` → `BaseIdEntity`
- `permitStatus` is `@ManyToOne` to `Value` entity (created via `NgValueService.createValue("Permit Status", name)`)
- `sharepointId` links to SharePoint list item
- `declaredHazardsJson` / `declaredHotWorkMeasuresJson` / `declaredConfinedSpaceHazardsJson` — the
  requester's own hazard declaration, stored as JSON TEXT exactly like `WorkArea.constant*Json`,
  using the same `SwHazards` / `HotWorkMeasures` / `ConfinedSpaceHazards` POJOs the permits use.
  Accessors never throw on malformed JSON — a bad row reads as "nothing declared" rather than
  failing the whole page.
  Pushed to SharePoint as a single `DeclaredHazards` JSON envelope (see
  `entities/permits/pojo/DeclaredHazards`), together with the hot-work profile, and to desktop
  clients over the normal CRDT field sync. New declaration sections go **into that envelope**, not
  into new SharePoint columns: both ends carry `@JsonIgnoreProperties(ignoreUnknown = true)`, so a
  section added on one side is ignored rather than fatal on the other, and no list column or Power
  Automate designer change is needed. `hotWorkProfile` was added exactly that way.

  The SharePoint copy is not redundancy — it is the **only** channel the declaration has when the
  hub is unreachable and the PWA falls back to Power Automate. All three blocks therefore move as
  one last-writer-wins unit, which is safe only while the requester is the sole editor (the desktop
  work request form does not render these blocks; operators edit hazards on the generated permits).
  A blank envelope from SharePoint is always a no-op, never a wipe — otherwise the first sync pass
  after the column is provisioned would clear every declaration in the database.
- `suggestedJobLogId` — plain `Long`, not an association. The job the grouping-key match suggests.
  Advisory only; nothing is attached until an operator confirms it in the Process dialog.
- `hotWorkProfileJson` — type of hot work plus the Cr(VI) assessment (`HotWorkProfile`). Same JSON
  TEXT storage as the hazard blocks, and it rides the same `DeclaredHazards` SharePoint envelope.

### Hexavalent chromium assessment

Two levels, so the long half is only asked of the jobs that need it: the *type* of hot work is
collected whenever hot work is required, and the Cr(VI) worksheet only when **welding** is one of
the types — welding is what liberates hexavalent chromium from chrome-bearing base metal.

The worksheet prints a weight beside each option and the assessment is their product, so
`HotWorkProfile.getExposureScore()` returns `fumeWeight x chromeWeight` — 1 at the low end, 81 at
the high end. An unanswered axis weighs **0**, so an incomplete assessment scores 0 and reads as
"not assessed" rather than borrowing a plausible-looking low value. The operator's work request
dialog shows an explicit "worksheet not completed" warning in that case instead of printing a 0.

The code does that multiplication and stops there. It deliberately does **not** band the score into
required controls or PPE — that is a safety judgement owned by whoever owns the worksheet. If
banding is wanted, get the thresholds from them and add them explicitly.

*Not modelled:* the printed form has a fourth, unlabelled checkbox under Hot Work Method. Only the
three weighted tiers are offered, because a tier with no weight cannot participate in the score.

The PWA gates this with the shared form's `showWhen`, which gained an optional `matches` predicate
for the purpose — plain equality cannot express "welding is among the ticked types" against a
checkbox-group's object value.

### Status vocabulary
Defined in `enums/WorkRequestStatuses`. `OPEN` = `Active`, `Updated`, `Pending More Info` — the
states meaning "submitted, not yet turned into permits, not withdrawn". Expiry and SharePoint
auto-close both sweep `OPEN`, not just `Active`; adding a new in-flight status means adding it
there, not to the individual sweeps.

### Services
- **NgWorkRequestService** — CRUD operations, status changes, SharePoint notifications on status change/archive. Implements `NgPermitService` interface for generic CRUD + search.
  - `revokeWorkRequest(id)` — validates not already revoked, sets status to "Revoked", pushes to SharePoint via adapter (fail-silent)
  - `updateAndPushToSharePoint(dto)` — saves locally + pushes full field update to SharePoint via `WorkRequestSharePointAdapter.update()`
- **PwaWorkRequestService** — handles PWA submissions
  - `revokeWorkRequest(sharepointId)` — finds by sharepointId, updates local DB status to "Revoked", pushes to SharePoint
  - `updateWorkRequest(dto)` — finds by localUuid, updates all fields locally, pushes full update to SharePoint
- **WorkRequestSharePointSyncable** — the live SharePoint sync. Registered with
  `SharePointSyncOrchestrator`, polls every 30s using an **incremental** fetch
  (`$filter=Modified gt …`). Because an incremental fetch never sees the complete remote set, the
  orchestrator deliberately skips auto-close; overdue requests are closed by
  `WorkRequestExpiryService` instead. Also records a job suggestion on newly-created requests, so a
  request arriving through SharePoint reaches the operator queue looking exactly like one submitted
  through the hub.
  *(The old `WorkRequestSyncService` / `JhaSyncService` full-list pollers were removed — they had
  been dead for some time and still contained the full-set auto-close the orchestrator disabled.)*
- **SharepointAccessService** — facade with certificate-based REST API (primary) + Power Automate (fallback)

### SharePoint Adapter
- **WorkRequestSharePointAdapter** — entity-specific adapter wrapping `SharePointCertificateAccess` + `PowerAutomateV2Client`
  - `getAll()`, `create(dto)`, `addAttachment()` — existing operations
  - `findByLocalUuid(localUuid)` — one-row `$filter=PwaId eq '…'` lookup on the certificate path
    (the Power Automate fallback still has to scan). Used by the submit-time duplicate probe, which
    previously pulled the entire list on every single submission.
  - `update(sharepointId, dto)` — pushes full field update to SharePoint (cert MERGE or PA update action)
  - `changeStatus(sharepointId, status)` — updates Status column only
  - `revoke(sharepointId)` — convenience → `changeStatus(sharepointId, "Revoked")`
  - Each method uses `SharepointAccessService.executeWithFallback()` for cert/PA failover

### Mapper
- **WorkRequestMapper** — `convertToNgDto()`, `convertNgDtoToEntity()`, `fromSharePointDto()`, `convertToDto()` (legacy)

### DTOs
- **NgWorkRequestDto** — API-facing DTO for Angular (includes `status` field)
- **WorkRequestDto** — SharePoint deserialization DTO (internal to sync)

### Controllers
- **WorkRequestRestController** (`/work-requests-api/*`) — REST API following LotoPoint pattern
  - `PUT /work-requests-api` — saves locally AND pushes full update to SharePoint
  - `POST /work-requests-api/revoke/{id}` — revoke endpoint for desktop frontend
- **PwaWorkRequestController** (`/api/pwa/work-request/*`) — PWA endpoints
  - `POST /submit` — submission
  - `POST /revoke` — revoke (accepts `{sharepointId, localUuid}`)
  - `PUT /update` — full field update from PWA
- **WorkRequestController** (`/ng/work-requests/*`) — legacy, still functional
- **PowerAutomateController** (`/power-automate/*`) — legacy SharePoint endpoints

## Frontend Architecture

### Route
`/permit-builder/work-requests` → `RfWorkRequestPageComponent`

### Services (per LotoPoint pattern)
- `RfWorkRequestApiService` — HTTP calls to `/work-requests-api`
  - `revokeWorkRequest(id)` → `POST /work-requests-api/revoke/{id}`
- `RfWorkRequestStateService` — reactive state (BehaviorSubject, signals, SSE sync)
  - `revokeWorkRequest(id)` — calls API, shows success/error message
- `WorkRequestContextMenuService` — context menu actions including "Revoke" with confirm dialog
- `RfWorkRequestMapperService` — table column + form field definitions

### Components
- `RfWorkRequestPageComponent` — toolbar + table + form popup
- `RfWorkRequestTableComponent` — refactored table with isolated service providers
- `RfWorkRequestFormComponent` — reactive form via `RfReactiveFormComponent`

### Table Service Providers
Each table instance provides its own isolated instances of: `TableSelectionService`, `TableStateService`, `TableDragService`, `TableSearchService`, `TableSortService`, `TableResizeService`, `TableSyncService`, `TableClickService`, `TableControlsService`, `TableDataService`

## Configuration

```properties
# application.properties
sharepoint.sync.interval=120000   # sync interval in ms (default 2 min)
sharepoint.sync.enabled=true      # enable/disable scheduled sync
```

## Work area: map preferred, words accepted

The map is the preferred answer — it is what gives an operator the area's constant hazards, its
LOTO standards and the right job grouping. It is **not** mandatory:

- `workAreaMap` is required only while "I'm not sure which area this is" is unticked.
- Ticking it hides the map, clears any area already picked, and requires a written
  `locationDescription` instead. The request arrives with `workArea = null`.
- The operator sees an **Area not set** badge on the work request detail dialog and sets the area
  from the desktop work request form.
- When the map itself cannot load — offline cold start with no cached snapshot, since the bundled
  `work-areas.json` / `work-area-shapes.json` ship empty — the picker says so and points at the
  same escape hatch. It used to render an empty frame behind a hard `required`, which made the
  whole form unsubmittable with no explanation.

## Acceptance Criteria

### New Request
1. Restrict time selection - no past is allowed
   (`futureOrPresentDateValidator` on the date, `futureTimeIfTodayValidator` on the time — the
   latter only bites when the chosen date is today)
2. Required fields:
    1. Person requesting
    2. Date of work to be performed
    3. Work area **or** a written location description
    4. Main work scope (work category)
    5. Affected Equipment
    6. Scope of work
    7. Associated Permits:
        - Hot work, if so then:
            - Supervisor
            - Fire-Watch
        - Confined Space, if so:
            - Space(s) to be entered
3. Hazard checkboxes are optional — an untouched block submits as all-false, which is recorded as
   a real answer rather than "no opinion"
4. On Form Submit - saved to local DB, synced to SharePoint if connected
5. User can resubmit previously submitted requests
6. Edit and Revoke work as soon as the hub has the request, **with or without a SharePoint id** —
   both endpoints resolve `localUuid` first
