# Work Request — Timezone & DateOfWork Handling

## Problem

SharePoint stores DateTime columns internally as UTC. The work request `DateOfWork` field goes through multiple paths (PWA, Power Automate, Certificate REST API, sync) that each need to handle timezone conversion correctly. Without proper conversion, times display 6 hours early (Central vs UTC).

## Source of Truth

**Central Time (`America/Chicago`)** is the source of truth for all date/time values. The H2 database stores date and time as separate Central Time strings:
- `date_of_work_to_be_performed`: `"2026-02-15"` (Central date)
- `time_of_work_to_be_performed`: `"14:30"` (Central time, 24h format)

## DateOfWork Through All 9 Paths

### Path 1: Form Display
- Date picker returns `yyyy-MM-dd`, time picker returns `HH:mm`
- Both represent Central Time (user is at the power plant)
- No conversion needed

### Path 2: PWA → Server HTTP Request
- `PwaWorkRequestDto` sends `dateOfWork: "2026-02-15"`, `timeOfWork: "14:30"` (Central)
- `PwaWorkRequestService.convertToEntity()` stores directly — no conversion needed
- H2 stores Central Time

### Path 3: PWA → Power Automate (Direct)
- `WorkRequest.convertToPaModel()` in `browser/ng-ui/.../work-request.model.ts`
- Constructs `new Date('2026-02-15T14:30:00')` (browser-local, assumed Central)
- Calls `.toISOString()` → `"2026-02-15T20:30:00.000Z"` (UTC)
- PA receives UTC, stores correctly in SharePoint
- **Assumption**: Browser is in Central Time (valid for power plant PWA)

### Path 4: H2 DB ← PWA Submission
- `PwaWorkRequestService` saves `dateOfWork` and `timeOfWork` from DTO directly
- Already Central Time strings — stored as-is

### Path 5: H2 DB ← SharePoint Sync
- `WorkRequestSyncService` calls `sharepointAccessService.getAllWorkRequests()`
- SharePoint returns `DateOfWork` as UTC ISO: `"2026-02-15T20:30:00Z"`
- **PA V2 path** (`PowerAutomateV2Access.mapToWorkRequestDto()`):
  - `fromUtcDateTime()` converts UTC → Central, splits into date + time
- **Certificate path** (`SharePointCertificateAccess.getAllWorkRequests()`):
  - `fromSharePointDateTime()` converts UTC → Central, splits into date + time
- `WorkRequestMapper.updateEntityFromSharePoint()` writes Central values to entity

### Path 6: Server → SharePoint via Power Automate V2
- `PowerAutomateV2Access.workRequestToMap()` calls `toUtcIso(date, time)`
- Takes Central date+time, converts to UTC: `"2026-02-15T20:30:00Z"`
- PA receives UTC, stores correctly in SharePoint

### Path 7: Server → SharePoint via Certificate REST API
- `SharePointCertificateAccess.createWorkRequest()` calls `toCentralIso(date, time)`
- Takes Central date+time, formats with offset: `"2026-02-15T14:30:00-06:00"`
- SharePoint REST API parses offset-aware datetime correctly

### Path 8: Server → Sync Server
- `FieldSyncService` syncs `dateOfWorkToBePerformed` and `timeOfWorkToBePerformed` as raw String field values
- Already Central Time strings — passed through without conversion

### Path 9: Server ← Sync Server
- Same as Path 8 in reverse — Central Time strings received and applied as-is

## Key Conversion Methods

### Writing TO SharePoint

| Method | Class | Strategy |
|--------|-------|----------|
| `toUtcIso(date, time)` | `PowerAutomateV2Access` | Central → UTC (`"2026-02-15T20:30:00Z"`) |
| `toCentralIso(date, time)` | `SharePointCertificateAccess` | Central → Offset (`"2026-02-15T14:30:00-06:00"`) |

Both produce the same result on SharePoint. PA requires UTC because it double-converts offset-aware datetimes. Certificate REST API handles offsets natively.

### Reading FROM SharePoint

| Method | Class | Strategy |
|--------|-------|----------|
| `fromUtcDateTime(raw)` | `PowerAutomateV2Access` | UTC → Central, split to `[date, time]` |
| `fromSharePointDateTime(raw)` | `SharePointCertificateAccess` | UTC → Central, split to `[date, time]` |

Both parse the UTC ISO datetime from SharePoint and convert back to Central Time for H2 storage.

## Bug History

### Bug: Time 6 hours early on SharePoint
- **Cause**: Naive ISO datetime (no timezone info) sent to SharePoint was treated as UTC
- **Fix**: PA V2 sends UTC explicitly (`Z` suffix); Certificate sends with Central offset (`-06:00`)

### Bug: H2 stored UTC time instead of Central
- **Cause**: `mapToWorkRequestDto()` split UTC datetime naively without converting timezone
- **Fix**: Added `fromUtcDateTime()` / `fromSharePointDateTime()` to convert UTC → Central before storing

### Bug: Certificate `getAllWorkRequests()` duplicate field read
- **Cause**: Both `dateOfWorkToBePerformed` and `timeOfWorkToBePerformed` read from `DateOfWork` SharePoint column
- **Fix**: Parse combined datetime, convert UTC → Central, split into separate date + time fields

### Bug: PA double-converts offset-aware datetime
- **Cause**: Power Automate receives `"2026-02-15T14:30:00-06:00"`, converts to UTC, then applies its own timezone setting
- **Fix**: Send UTC (`"2026-02-15T20:30:00Z"`) to PA so it has nothing to convert
