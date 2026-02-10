## Data Flow

```
SharePoint (external source of truth for new requests)
    ↓ scheduled sync every 2 min (WorkRequestSyncService)
H2 Local DB (WorkRequest entity)
    ↓
NgWorkRequestService (CRUD + status changes)
    ↓
WorkRequestRestController (/work-requests-api/*)
    ↓
Angular: RfWorkRequestApiService → RfWorkRequestStateService
    ↓
Angular: RfWorkRequestTableComponent + RfWorkRequestFormComponent
```

## Functionality

1. **Scheduled SharePoint Sync** — `WorkRequestSyncService` runs every 2 min (configurable via `sharepoint.sync.interval`). Fetches all work requests from SharePoint, merges by `sharepointId`:
   - New → creates local entity with status "Active"
   - Existing → updates if SharePoint status changed
   - Can be disabled via `sharepoint.sync.enabled=false`
2. **Manual Sync** — `POST /work-requests-api/sync` triggers immediate sync, returns change count
3. **View Requests** — paginated table with search, sort, column filters via refactored [TableComponent](../../../../frontend/src/app/shared/table/refactored)
4. **Status Changes** — `GET /work-requests-api/change-status/{id}/{status}` updates local DB + notifies SharePoint
5. **Complete/Archive** — sets status to "Closed" and archives in SharePoint via `SharepointAccessService.archiveWorkRequest()`
6. **CRUD** — create/update via form, soft-delete supported

## REST API

Base: `/work-requests-api`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | All work requests (paginated) |
| GET | `/{id}` | Get by ID |
| GET | `/empty` | Empty DTO for new form |
| POST | `/` | Create new |
| PUT | `/` | Update existing |
| DELETE | `/{id}` | Soft delete |
| GET | `/by-status/{status}` | Filter by permit status |
| POST | `/search?page=&pageSize=` | Complex search with SearchCriteria |
| POST | `/unique-values/{column}/filtered` | Unique column values for table filters |
| POST | `/sync` | Manual SharePoint sync trigger |
| GET | `/change-status/{id}/{status}` | Change status + notify SharePoint |

## Angular Components

- **RfWorkRequestPageComponent** — page layout with toolbar (+ New, Sync SharePoint), table, and form popup
- **RfWorkRequestTableComponent** — refactored table with providers for all table services (drag, selection, search, sort, resize, sync, click, controls, state, data)
- **RfWorkRequestFormComponent** — reactive form in popup projection
- **RfWorkRequestApiService** — HTTP client for `/work-requests-api`
- **RfWorkRequestStateService** — BehaviorSubject state, signals, SSE sync updates, pagination
- **RfWorkRequestMapperService** — column/form field definitions, location options

## Column Mapping Notes

WorkRequest uses `permitStatus` (`@ManyToOne Value`) for status, but the Angular DTO exposes it as `status` (a flat string). This creates a split between entity property paths and DTO field names:

| Column | `id` (DTO key) | `accessorKey` (entity path) | `formFieldKey` | Notes |
|--------|----------------|----------------------------|----------------|-------|
| Status | `status` | `permitStatus.name` | `status` | Sort/filter use `accessorKey` for backend queries |
| Other fields | matches entity field | matches entity field | — | Simple fields map 1:1 |

**Sort handler** uses `event.column.accessorKey || event.column.id` (not just `id`) so the backend receives the correct entity property path for Spring Data Sort.

**Column filters** already use `column.accessorKey` via the shared `table.component.html` template.

**Unique values** (`loadUniqueItems`) always ensures `filters: {}` is present in the SearchCriteria body, even when reusing sort-only criteria — prevents NPE in `FlexibleQueryInterface.getFilteredUniqueValuesOfColumn()`.

## Sync Server Deduplication

Multiple clients independently pull the same WorkRequests from SharePoint, each creating a local entity with a different device-prefixed ID but the same `sharepointId`. After sync-server sync, duplicates accumulate.

**`WorkRequestMergeService`** runs after each incoming sync batch (same hook as `CategoryValueMergeService`):

1. Detects duplicates: `GROUP BY sharepoint_id HAVING COUNT(*) > 1` (non-null only)
2. Keeps lowest ID as canonical (deterministic across all clients)
3. Transfers `daily_permit_package_id` FK from duplicate to canonical (native SQL — unidirectional `@OneToMany` has no mapped field on WorkRequest)
4. Soft-deletes duplicate via JPA → `FieldChangeEntityListener` fires → deletion syncs to peers

Called from `FieldSyncService.applyIncomingChanges()` afterCommit callback, right after Category/Value merge.

## Legacy Endpoints (still functional)

- `/power-automate/*` — PowerAutomateController (old SharePoint integration)
- `/ng/work-requests/*` — old WorkRequestController (uses WorkRequestDto)
