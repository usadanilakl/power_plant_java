## Description

Job is open any time work is performed on a piece of equipment - it can hold multiple daily permit packages. Daily permit package includes all the permits needed per task. Multiple tasks can be bundled under the same job. So job keeps track of daily packages for all tasks involved in the job.

Job entity provides a way to see history of all packages or current packages.
Daily package keeps track of current permits - their statuses and modification history.

Job can be opened manually or generated from Work Request.

Daily Permit Package can be created manually inside the existing job or generated from work request.

Work Request becomes part of daily package - if job is generated from work request - it automatically generates DailyPackage based on the same work request and this work request becomes part of it. For next day, if job wasn't completed, a new Work Request is submitted - it can be added to new Daily Package if it is created or it can be used to generate new daily package inside existing job.

Auto-linking: multiple WRs with the same (company, workArea, workCategory) are grouped into the same job automatically via scoring algorithm (company 40pts, workArea 30pts, location 15pts).

# Permit Relationships
SafeWork references: all related LOTO, CS, HW, Energized Work, Excavation, Venting

CS references LOTOs and HW

# Hazard Architecture
WorkArea stores constant hazards as JSON POJOs:
- `constantHazardsJson` -> SwHazards (24 boolean flags + descriptions)
- `constantHotWorkMeasuresJson` -> HotWorkMeasures (13 boolean flags)
- `constantConfinedSpaceHazardsJson` -> ConfinedSpaceHazards (9 boolean flags + other)
- `constantLotos` -> predefined LOTOs for the area (ManyToMany)

WorkCategoryProfile stores standard hazards with the same JSON POJOs:
- `standardHazardsJson`, `standardHotWorkMeasuresJson`, `standardConfinedSpaceHazardsJson`

Hazard auto-population:
- **SafeWork**: `generatePermitFromRequest()` merges WorkArea + WorkCategory hazards via OR-union (`mergeSwHazards` utility). Any true flag from either source = true on permit.
- **HotWork / ConfinedSpace**: same merge pattern for their respective hazard types.
- **JHA**: no structured hazard auto-population. Hazards stored as narrative text in job steps and text fields (ppe, loto, confinedSpace, hazCom).

## E2E Cross-App Flow

### 1. Contractor Submits Work Request (PWA - ng-ui)
- Contractor fills out WR form on PWA (`POST /api/pwa/work-request/submit`)
- **Work Area picker**: each area has predefined hazards (SwHazards, HotWorkMeasures, ConfinedSpaceHazards) and constant LOTOs. Areas with confined space hazards are flagged (`isConfinedSpace`)
- **Work Category dropdown**: each category has a WorkCategoryProfile with standard hazards
- **Requirement flags**: isHotWorkRequired, isLotoRequired, isConfinedSpaceEntryRequired
- Saved locally first, then synced to SharePoint:
    - Hub available: certificate access (primary) -> Power Automate V2 (fallback)
    - Hub offline: PWA submits directly to SharePoint via Power Automate V2; clients pull manually

### 2. Contractor Submits JHA (PWA)
- JHA attached to WR (`POST /api/pwa/jha/submit`), linked by sharepointId or localUuid
- Job steps with narrative hazard descriptions and safety measures
- Text fields: ppe, loto, confinedSpace, hazCom, handAndPowerTools, specialTools
- **Gap**: hazard chips from WorkArea/WorkCategory are displayed on ng-ui PWA frontend but NOT auto-populated into JHA entity. JHA hazards are free-text only.

### 3. Operator Reviews Work Request
- **Permits Monitor**: dashboard with WRs grouped by status (Active, Updated, Processed, Expired), SSE real-time updates with 60s periodic refresh
- **WR page**: dedicated work request management view
- Context menu provides actions: Process, Request More Details, Cancel, View Correspondence, Send Message

### 4. Operator Processes Work Request
- **Messaging**: Conversation/Message entities allow operator-contractor communication via `NgConversationController` and `PwaConversationController`
- **Job generation**: semi-automatic or manual. Auto-links WRs by (company, workArea, workCategory) scoring
- **Package creation**: DailyPermitPackage created with status "Building"
    - SafeWork created with auto-populated hazards from WorkArea + WorkCategory (OR-union merge)
    - Other permits as applicable (CS, HW, Energized Work, Excavation, Venting)
    - LOTOs assigned — suggestions from WorkArea's `constantLotos` via `getLotoSuggestionsForWorkArea()`
    - Package attached to Job
- **WR status -> "Processed"**, synced to SharePoint
- **Contractor tracking**:
    - `GET /api/pwa/work-request/status/{localUuid}` for status polling
    - `GET /api/pwa/secured/notifications` for pull-based notifications
    - `GET /api/pwa/secured/my-permits` for permit listing
    - Email notification on Active and Closed status changes

### 5. Package Activation & Sign-On
- Activation takes `activationSnapshotJson` (full package state for later diff)
- All included permits cascade status -> "Active" (LOTOs remain independent)
- Notify requestor of readiness (email)
- Update LOTO Informational Board / Usage Monitor
- Print field copies
- **Foreman sign-on**: `POST /ng/daily-permit-packages/{id}/foreman-sign-on`
- **Personnel sign-on**: `POST /ng/daily-permit-packages/{id}/sign-on`
- Personnel tracked in `personnelJson` (JSON array of PersonnelSignEntry)
- Contractor can sign on/off from PWA: `POST /api/pwa/secured/permits/{id}/sign-on|off`
- Update Active Permits Tracker

### 6. In-Progress Modifications
- Add/remove permits to Daily Package
- Pause work (status -> "Test")
- All modifications tracked in `modificationsJson` (PackageModification POJOs with timestamp, action, performedBy, old/new values)
- **Contractor notification**: email on Active/Closed only. Intermediate status changes (Test/paused) are visible via `GET /api/pwa/secured/notifications` but do not trigger email.

### 7. Sign-Off & Close-Out
- Personnel sign off with optional comments: `POST /ng/daily-permit-packages/{id}/sign-off`
- **Foreman close-out**: `POST /ng/daily-permit-packages/{id}/foreman-sign-off`
    - workCompleted (boolean)
    - comments
    - scopeChanged (boolean) + scopeDetails
    - continueDate / continueTime (if work continues)
    - Sets `foremanCloseOutCompleted = true`
- Package remains Active after foreman close-out — operator reviews answers

### 8. Operator Closes Package
- Close: status -> "Closed", all child permits cascade to Closed
- Auto-signs off any remaining personnel
- Email notification to submitter with closure summary (work completed, comments, continue date, scope changes)
- Updates parent job status (all packages closed + work completed -> job "Closed")
- **Reissue options**:
    - `POST /ng/daily-permit-packages/{id}/reissue` — copies permits to new package
    - `POST /ng/daily-permit-packages/{id}/generate-continuation` — creates new WR (with "Continuation" suffix or new scope), new package in "Building" status
- Notify requestor of status

## Package Status Lifecycle

```
Building -> Active -> Test (paused) -> Active (resumed) -> Closed
                                                       \-> Reissued (new Building package)
```

- **Building**: operator creates/edits permits freely
- **Active**: work in progress, sign-on/off, modifications tracked
- **Test**: paused temporarily, can resume to Active
- **Closed**: all permits closed, closure data captured, notifications sent

## Implementation Gaps

### Gap 1: JHA Hazard Auto-Population
JHA does not auto-populate structured hazards from WorkArea/WorkCategory like SafeWork does. Hazards are free-text only. The PWA endpoint (`/api/pwa/work-category-hazards/*`) exposes profile data, but neither the backend nor JHA entity consumes it.

### Gap 2: Real-Time Push Notifications to PWA
Contractor notifications are pull-only (`GET /api/pwa/secured/notifications`). No SSE/WebSocket channel to PWA. Desktop Angular gets SSE updates, but PWA must poll.

### Gap 3: Intermediate Status Notifications
Only Active and Closed status changes trigger email. Pausing (Test), modifications, and other status transitions are visible via polling but don't push notifications.

## Related Features

- [Work Areas](work-areas/overview.md) - physical plant locations with constant hazards, interactive map, and workload monitoring
- [Base Permit](base-permit.md) - common permit behavior (status, history, snapshots)
- [Work Request](work-request/work-request-architecture.md) - work request submission and processing
- [LOTO Permit](loto-permit/loto-permit-architecture.md) - lock out / tag out permits
