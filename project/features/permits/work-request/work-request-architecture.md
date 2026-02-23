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
    - Energized work
    - Purging
    - Excavating
6. Attachments (optional):
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

### Services
- **NgWorkRequestService** — CRUD operations, status changes, SharePoint notifications on status change/archive. Implements `NgPermitService` interface for generic CRUD + search.
  - `revokeWorkRequest(id)` — validates not already revoked, sets status to "Revoked", pushes to SharePoint via adapter (fail-silent)
  - `updateAndPushToSharePoint(dto)` — saves locally + pushes full field update to SharePoint via `WorkRequestSharePointAdapter.update()`
- **PwaWorkRequestService** — handles PWA submissions
  - `revokeWorkRequest(sharepointId)` — finds by sharepointId, updates local DB status to "Revoked", pushes to SharePoint
  - `updateWorkRequest(dto)` — finds by localUuid, updates all fields locally, pushes full update to SharePoint
- **WorkRequestSyncService** — `@Scheduled` sync from SharePoint every 2 min. Fetches via `SharepointAccessService.getAllWorkRequests()`, merges by `sharepointId`, auto-creates new records.
- **SharepointAccessService** — facade with certificate-based REST API (primary) + Power Automate (fallback)

### SharePoint Adapter
- **WorkRequestSharePointAdapter** — entity-specific adapter wrapping `SharePointCertificateAccess` + `PowerAutomateV2Client`
  - `getAll()`, `create(dto)`, `addAttachment()` — existing operations
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

## Acceptance Criteria

### New Request
1. Restrict time selection - no past is allowed
2. Required fields:
    1. Person requesting
    2. Date of work to be performed
    3. Affected Equipment
    4. Scope of work
    5. Associated Permits:
        - Hot work, if so then:
            - Supervisor
            - Fire-Watch
        - Confined Space, if so:
            - Space(s) to be entered
        - Energized work
        - Purging
        - Excavating
3. On Form Submit - saved to local DB, synced to SharePoint if connected
4. User can resubmit previously submitted requests
