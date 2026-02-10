## Description

Work request is submitted by people who will be performing work. It includes the following information:

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
6. Attachments (optional):
    - pdf/jpg
    - video
7. JHA for the work to be performed (separate permit form)

WorkRequest extends BasePermit so it includes all fields from there.

## Backend Architecture

### Entity
- `WorkRequest` extends `BasePermit` → `BaseAuditEntity` → `BaseIdEntity`
- `permitStatus` is `@ManyToOne` to `Value` entity (created via `NgValueService.createValue("Permit Status", name)`)
- `sharepointId` links to SharePoint list item

### Services
- **NgWorkRequestService** — CRUD operations, status changes, SharePoint notifications on status change/archive. Implements `NgPermitService` interface for generic CRUD + search.
- **WorkRequestSyncService** — `@Scheduled` sync from SharePoint every 2 min. Fetches via `SharepointAccessService.getAllWorkRequests()`, merges by `sharepointId`, auto-creates new records.
- **SharepointAccessService** — facade with certificate-based REST API (primary) + Power Automate (fallback)

### Mapper
- **WorkRequestMapper** — `convertToNgDto()`, `convertNgDtoToEntity()`, `fromSharePointDto()`, `convertToDto()` (legacy)

### DTOs
- **NgWorkRequestDto** — API-facing DTO for Angular (includes `status` field)
- **WorkRequestDto** — SharePoint deserialization DTO (internal to sync)

### Controller
- **WorkRequestRestController** (`/work-requests-api/*`) — new REST API following LotoPoint pattern
- **WorkRequestController** (`/ng/work-requests/*`) — legacy, still functional
- **PowerAutomateController** (`/power-automate/*`) — legacy SharePoint endpoints

## Frontend Architecture

### Route
`/permit-builder/work-requests` → `RfWorkRequestPageComponent`

### Services (per LotoPoint pattern)
- `RfWorkRequestApiService` — HTTP calls to `/work-requests-api`
- `RfWorkRequestStateService` — reactive state (BehaviorSubject, signals, SSE sync)
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
