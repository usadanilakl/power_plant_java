## JHA (Job Hazard Analysis)

### Data Structure

```json
{
  "jobName": "Replace Circuit Panel",
  "applicability": "Electrical Maintenance",
  "analysisBy": "D. West",
  "reviewedBy": "R. Cole",
  "approvedBy": "M. Brooks",
  "date": "2026-02-11",
  "ppe": "Hard hat, gloves, safety glasses",
  "loto": "Yes",
  "confinedSpace": "No",
  "hazCom": "Yes",
  "handAndPowerTools": "Insulated screwdrivers, torque wrench",
  "specialTools": "Multimeter, thermal camera",
  "jobSteps": [
    { "sequence": 1, "description": "Lockout panel", "hazard": "Electrical shock", "safetyMeasures": "Apply LOTO properly" }
  ],
  "workRequestSharepointId": "42",
  "submitterName": "DK",
  "submitterEmail": "dk@company.com",
  "submitterPhone": "555-1234",
  "submitterCompany": "DK Power",
  "timeSubmitted": "2026-02-11T03:40:54Z"
}
```

---

### User Flow

From PWA the user accesses the JHA form via one of two paths:
- **Work Requests page** → select a work request → action "Fill Out JHA"
- **JHA page** → select a work request from the left panel

#### Submission Modes

The user chooses between two modes via a toggle in the action bar:

1. **Fill Out Form** (default) — full JHA form with job steps, PPE, hazards, etc. Form is captured as a PNG image via `html2canvas` and attached before submission.
2. **Attach File** — upload pre-filled JHA documents (PDF, Word, images). Basic data is auto-populated from the user's profile:
   - `jobName` → "JHA - File Attached"
   - `date` → today's date
   - `analysisBy` → user's name
   - `applicability` → user's company
   - User signature is attached automatically
   - No form image capture (skips `captureJhaAsImage()`)

Both modes use the same orchestrator submission path.

#### Revoke

From the **Submitted JHAs** tab in the left menu, clicking a JHA row opens an action popup with:
- **Use as Template** — pre-populates the form with data from the selected JHA
- **Revoke** — revokes the JHA via the submission orchestrator (server-first → PA V2 fallback), updates status to "Revoked" in local IndexedDB and SharePoint

---

### Submission Flow

1. **Form image capture** (form mode only) — `html2canvas` renders the JHA as a paper-like PNG (off-screen HTML table). Image is added as an attachment before submission. Skipped in file mode.
2. **Submission orchestration** (`SubmissionOrchestratorService`):
   - Try **server** (`POST /api/pwa/jha/submit`) → server uses certificate access to SharePoint, falls back to PA V2
   - Fall back to **Power Automate V2** directly from PWA
   - Fall back to **email** (mailto link with JHA body text)
3. **On success**: JHA saved to IndexedDB with `sharepointId` from response, draft cleared

### Revoke Flow

1. **Revoke orchestration** (`SubmissionOrchestratorService.revokeJha()`):
   - Try **server** (`POST /api/pwa/jha/revoke`) → server updates local DB status to "Revoked" + pushes to SharePoint (cert → PA fallback)
   - Fall back to **Power Automate V2** directly from PWA (update action with status "Revoked")
2. **On success**: JHA status updated to "revoked" in IndexedDB

---

### Implementation — Java Backend

#### Entity & Repository
- `Jha` extends `BasePermitEntity` (sync tracking, device-prefixed IDs, audit trail, soft deletes)
- `@Audited` + `@Where(clause = "deleted=false")`
- `jobSteps` stored as JSON `TEXT` column; convenience methods `getJobStepsList()`/`setJobStepsList()`
- `@ManyToOne` → `WorkRequest` (linked by `work_request_id` FK)
- `workRequestSharepointId` field for linking before FK is resolved
- `JhaRepo` extends `PermitRepo<Jha>` with dedup queries (`findAllBySharepointId`, `findFirstBySharepointIdOrderByIdAsc`)

#### DTOs
- `JhaDto` — flat DTO for PWA/SharePoint, includes submitter fields + `jobSteps` as `List<JobStep>`
- `NgJhaDto` — Angular admin DTO extending `BaseDto`, adds `workRequestId`, `status`

#### Mapper
- `JhaMapper` — manual mapping (not ModelMapper) between entity ↔ DTOs
  - `convertToDto` / `convertToEntity` — PWA DTO conversion
  - `convertToNgDto` / `convertNgDtoToEntity` — Angular admin conversion
  - `fromSharePointDto` — creates new entity from SharePoint data (used by sync)
  - `updateEntityFromSharePoint` — updates existing entity, preserves submitter fields if already set locally

#### Services
- `NgJhaService` implements `NgPermitService<Jha, JhaDto, JhaRepo, JhaMapper>` — CRUD + status management for Angular admin
  - `setStatus(id, status)` — updates local status + pushes to SharePoint via `JhaSharePointAdapter.changeStatus()`
  - `revokeJha(id)` — validates not already revoked, sets status to "Revoked", pushes to SharePoint via adapter (fail-silent)
- `PwaJhaService` — handles PWA submission: saves entity, calls `JhaSharePointAdapter.create()`, processes attachments
  - `revokeJha(sharepointId)` — finds by sharepointId, updates local DB status to "Revoked", pushes to SharePoint

#### Controllers
- `JhaRestController` (`/jha-api/`) — paginated list, CRUD, status change, search, by-work-request
  - `POST /jha-api/revoke/{id}` — revoke endpoint for desktop frontend
- `PwaJhaController` (`/api/pwa/jha/`) — PWA endpoints
  - `POST /api/pwa/jha/submit` — submission
  - `POST /api/pwa/jha/revoke` — revoke (accepts `{sharepointId, localUuid}`)
- `JhaController` (`/ng/jhas/`) — Angular admin endpoints

#### SharePoint Integration
- `JhaSharePointAdapter` — entity-specific adapter wrapping generic `SharePointCertificateAccess` + `PowerAutomateV2Client`
  - `getAll()`, `create(JhaDto)`, `update(sharepointId, JhaDto)`, `addAttachment(sharepointId, PaAttachmentDto)`
  - `changeStatus(sharepointId, status)` — updates Status column via cert (MERGE) or PA (update action)
  - `revoke(sharepointId)` — convenience method, delegates to `changeStatus(sharepointId, "Revoked")`
  - Each method uses `SharepointAccessService.executeWithFallback(certPath, paPath, name)` for cert/PA fallback
  - SharePoint list name: `"JHA"`
  - Column mapping: PwaId, JobName, Applicability, AnalysisBy, ReviewedBy, ApprovedBy, Date, PPE, LOTO, ConfinedSpace, HazCom, HandAndPowerTools, SpecialTools, JobSteps (JSON text), WorkRequestSharepointId, SubmitterName/Email/Phone/Company, TimeSubmitted, Status

#### Sync & Dedup
- `JhaSyncService` — `@Scheduled(fixedDelay=120000, initialDelay=45000)` — staggered 15s after WR sync
  - Pulls all JHAs from SharePoint via `JhaSharePointAdapter.getAll()`
  - Creates or updates local entities via `JhaMapper`
  - Links to `WorkRequest` by `workRequestSharepointId` → `WorkRequestRepo.findBySharepointId()`
  - Sets `PermitStatus` via `NgValueService.createValue("Permit Status", status)`
- `JhaMergeService` — deduplicates by `sharepoint_id`
  - Finds groups with `COUNT(*) > 1`, keeps lowest-ID entity, soft-deletes the rest
  - Runs in `REQUIRES_NEW` transaction with SyncContext cleared so deletions are tracked by `FieldChangeEntityListener`
  - Simpler than WR merge (no downstream FK transfer)

---

### Implementation — PWA Frontend

#### Feature Directory: `browser/ng-ui/src/app/features/jha/`

| File | Purpose |
|------|---------|
| `jha.component.ts/html/css` | Main container — mode toggle (form/file), file upload, preview |
| `jha-form/` | Reactive form UI (uses `app-reactive-form`) |
| `jha-table/` | Previously submitted JHAs table |
| `jha-left-menu/` | Tabs: "Needs JHA" (work requests) + "Submitted" (JHAs with action popup: template reuse, revoke) |
| `jha-state.service.ts` | State management — `submitNewRequest()`, `submitFileOnlyJha()`, `revokeSelected()`, `reuseJhaTemplate()` |
| `jha-api.service.ts` | Legacy PA V1 wrapper (no longer used for revocation — revoke now goes through orchestrator) |
| `jha-db.service.ts` | IndexedDB persistence (Dexie) |
| `jha-local-storage.service.ts` | Draft persistence |
| `jha-image/jha-image.util.ts` | Form-to-image capture via `html2canvas` (form mode only) |

#### Models: `browser/ng-ui/src/app/models/permits/`
- `jha.model.ts` — `Jha` class with `getFormFields()`, `convertToPaModel()`, `getEmailBody()`, `addJobStep()`
- `jha-job-step.model.ts` — `JobStep` (sequence, description, hazard, safetyMeasures)
- `jha-pa.model.ts` — PascalCase DTO for Power Automate
- `jha-transfer.model.ts` — WR → JHA transfer model

#### Key Integration Points
- `SubmissionOrchestratorService` (`services/submission-orchestrator.service.ts`) — server → PA V2 → email fallback
- `ServerApiService` — converts `Jha` to `PwaJhaDto` for server submission
- `PowerAutomateService` — direct PA V2 submission (`submitV2('jha', request)`)

---

### Association Across Systems

JHA is associated with its work request in three places:

| System | Link Field | Notes |
|--------|-----------|-------|
| PWA IndexedDB | `workRequestSharepointId`, `workRequestLocalUuid` | Set when user selects WR |
| Java H2 DB | `work_request_id` FK + `workRequestSharepointId` | FK resolved by sync service |
| SharePoint | `WorkRequestSharepointId` column | String reference to WR list item ID |

---

### Remaining Work

- [ ] Create SharePoint "JHA" list (see `pa-flow-setup-jha.md`)
- [ ] Create JHA Power Automate flow (see `pa-flow-setup-jha.md`)
- [ ] Configure flow URL in environments + `application.properties`
- [ ] Test end-to-end: PWA → server → SharePoint → sync back
- [ ] Add JHA to Server Sync entity list (sync-server codebase)
- [ ] Verify JHA image attachment appears on both JHA and WR items in SharePoint
- [ ] Cross-dedup: when WR merge happens, JHAs pointing to deleted WR should re-link to canonical WR
