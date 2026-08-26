# Sync Conformance Test Plan

Endpoint-driven sync-conformance harness: for each **real frontend mutation endpoint**, seed a throwaway → call the endpoint → assert a `FieldChange` was **emitted locally** → force one sync cycle → assert the **hub converged** (content-hash) → soft-delete teardown. Guarded so mutations refuse to run unless the node is isolated (SharePoint/Maximo/Supabase off — see `SyncConformanceService.assertIsolatedOrThrow`).

Source: full controller-layer enumeration (7-area parallel sweep, 2026-08-25). **250 distinct mutation endpoints** across synced entities. Scope = `EntityTableRegistry` (ENTITY_TYPE_TO_TABLE + SYNC_ORDER); `PlantChat*` are `@LocalOnlyEntity`; `WledCommand`/`Bypass`/`data_transfer.*` extend `BaseIdEntity` but are **not registered** (inbound dropped) → out of scope.

---

## ⚠️ Design-critical caveats (these change the harness, not just the plan)

1. **Native-SQL emission bypass — NEGATIVE allowlist (do NOT assert these sync):**
   - `POST /api/pwa/auth/login` → writes `User.lastLoginDate` via native bulk UPDATE, skips `FieldChangeEntityListener`.
   - WR/Loto merge `transferRelationships()` half-merge paths + `JobLog` merge → native SQL.
   - The harness must carry an explicit allowlist that asserts these do **not** emit (else false-FAIL).
2. **Attachments ride a SEPARATE channel.** `PermitAttachment` / SDS / inventory / field-list / Task attachments are **not `BaseIdEntity`** — they sync via `PendingFileSync`/`AttachmentSyncHandler`, not `FieldChange`. Different oracle. `LotoPoint.pictures` / `Task.attachments` add the M2M row (assert via FieldChange) **and** create a FileObject whose **bytes** sync separately (assert via the file channel or ignore).
3. **Mutating GETs** must be treated as writes: `GET /ng/daily-permit-packages/build-permits/{id}/{whatToBuild}/{permitId}`, `GET /ng/work-requests/change-status/{id}/{status}`, `/process/{sharepointId}`, `/process-by-id/{id}`, `GET /ng/physical-object/{id}/diagram`, `GET /api/pwa/{work-request,jha}/submit-from-email`.
4. **Role fixtures required.** Provision synthetic identities: `CONTROL_AUTHORITY` (Loto add/remove/reorder, ca-*, release-ca), `PLANT/ADMIN + SoD` (PWA hang/verify — hanger ≠ verifier), `ADMIN` (schedule-v2), `INSTRUMENTATION`, `INSULATION`, `KIOSK`, `OPERATOR`.
5. **Duplicate REST surfaces — pick the one the Angular/PWA frontend actually calls** (dedupe to one canonical test each): WorkRequest (`/ng/work-requests` vs `/work-requests-api`), Jha (`/ng/jhas` vs `/jha-api`), scheduler Task/Flow/TaskTemplate + schedule-v2 (enumerated twice).
6. **Child/side-effect entities have no direct endpoint** — assert the oracle can verify a *child* synced, not just the named entity: `LotoStandardApprovalEvent` (side-effect of workflow/*, historical silent-drop hotspot), `LotoSnapshot` (inside Loto lifecycle), `Highlight` (via Equipment/File clone).

---

## First batch (build these 12 first — one per distinct collection MECHANISM)

| # | Endpoint | Why |
|---|----------|-----|
| 1 | `POST /ng/loto-standards/{standardId}/add-loto-point/{lotoPointId}` | **Flagship** — add member to `LotoStandard.lotoPoints` M2M |
| 2 | `DELETE /ng/loto-standards/{standardId}/remove-loto-point/{lotoPointId}` | **The exact reported bug** — assert removal reaches hub |
| 3 | `PUT /ng/loto-standards/{id}/reorder-loto-points` | reorder (`lotoPointOrder`) — ordering-only drift |
| 4 | `PUT /ng/loto-standards` | whole-collection REPLACE — LWW-snapshot clobber surface |
| 5 | `POST /ng/loto-points/{id}/pictures/link/{fileId}` | pure M2M add, no file-bytes channel — cleanest membership test |
| 6 | `DELETE /ng/loto-points/{id}/pictures/{fileId}` | M2M remove (FileObject survives) |
| 7 | `POST /ng/lotos/add/{pointId}/to/{lotoId}` | add to active permit `LotoSnapshot` element-collection (distinct mechanism) |
| 8 | `DELETE /ng/lotos/remove/{pointId}/from/{lotoId}` | remove from snapshot + flips `wasModifiedDuringActive` |
| 9 | `PUT /ng/physical-object/{id}/systems` | full-replace `systems` M2M; force-sets `dateModified` (the exact hazard) |
| 10 | `PUT /ng/scheduler/tasks/{id}/prerequisites` | `Task.prerequisites` M2M clear()+re-add — 2nd independent OR-Set candidate |
| 11 | `POST /ng/work-areas` | REPLACES `constantLotos` (M2M) + `locations` (Value M2M, OR-Set) — exercises OR-Set end-to-end |
| 12 | `DELETE /ng/job-logs/{jobId}/packages/{packageId}` | owning `@OneToMany` remove (prior data-loss bug) |

---

## Tier 1 — collection / relationship membership (63) — the bug class

**LotoStandard.lotoPoints / groups**
- POST `/ng/loto-standards/{standardId}/add-loto-point/{lotoPointId}` [lotoPoints]
- DELETE `/ng/loto-standards/{standardId}/remove-loto-point/{lotoPointId}` [lotoPoints]
- PUT `/ng/loto-standards/{id}/reorder-loto-points` [lotoPoints]
- PUT `/ng/loto-standards` [lotoPoints, groups]
- POST `/api/pwa/secured/loto-standards/{standardId}/add-point/{pointId}` [lotoPoints] {PLANT/ADMIN+CA}
- DELETE `/api/pwa/secured/loto-standards/{standardId}/points/{pointId}` [lotoPoints] {PLANT/ADMIN+CA}
- POST `/api/pwa/secured/loto-points` [lotoPoints, conditional on addToStandardId] {PLANT/ADMIN}
- POST `/ng/red-tag-standards/{id}/generate-standard` [lotoPoints]
- POST `/ng/loto-standards/{id}/duplicate` [lotoPoints, groups] {CA/Manager}

**LotoPoint.pictures / conflicts**
- POST `/ng/loto-points/{id}/pictures` [pictures] (+ file bytes channel)
- POST `/ng/loto-points/{id}/pictures/link/{fileId}` [pictures] — pure M2M
- DELETE `/ng/loto-points/{id}/pictures/{fileId}` [pictures]
- POST `/api/pwa/secured/loto-points/{pointId}/photos` [pictures] {PLANT/ADMIN}
- DELETE `/api/pwa/secured/loto-points/{pointId}/photos/{fileId}` [pictures] {uploader-only}
- POST `/ng/loto-points/conflicts/merge` [equipmentList, lotoStandards, pictures]

**Loto (active permit snapshot / locks)**
- POST `/ng/lotos/add/{pointId}/to/{lotoId}` [snapshots/lotoPointsData] {CA}
- DELETE `/ng/lotos/remove/{pointId}/from/{lotoId}` [snapshots/lotoPointsData] {CA}
- PUT `/ng/lotos/{id}/reorder-loto-points` [snapshot] {CA}
- DELETE `/api/pwa/secured/loto/{lotoId}/points/{pointId}` [LotoSnapshot] {PLANT/ADMIN+CA}
- POST `/api/pwa/secured/loto/{id}/hang/submit` [LotoSnapshot] {PLANT/ADMIN+SoD}
- POST `/api/pwa/secured/loto/{id}/verify/submit` [LotoSnapshot] {PLANT/ADMIN+SoD}
- POST `/ng/lotos/create-from-standard/{standardId}` [snapshots]
- POST `/ng/lotos/create-from-scratch` [snapshots]
- PUT `/ng/lotos/{id}/assign-locks` [locks]
- PUT `/ng/lotos/{id}/lifecycle/remove-locks` [locks]

**DailyPermitPackage child collections**
- PUT `/ng/daily-permit-packages/{id}` [safeWorks/hotWorks/confinedSpaces/lotos/energizedWorkPermits/excavationPermits/ventingPermits/workRequests]
- DELETE `/ng/daily-permit-packages/{packageId}/permits/{permitType}/{permitId}`
- POST `/ng/daily-permit-packages/build-permits`
- GET `/ng/daily-permit-packages/build-permits/{id}/{whatToBuild}/{permitId}` (mutating GET)
- POST `/ng/daily-permit-packages/{sourceId}/reissue`
- POST `/ng/daily-permit-packages/reissue-permits-from/{a}/to/{b}`
- POST `/ng/daily-permit-packages/reissue-from/{sourceId}/for-wr/{wrId}`
- POST `/ng/daily-permit-packages/reissue-permits-by-work-request-id/{wrId}/`
- POST `/ng/daily-permit-packages/{id}/generate-continuation`

**JobLog.packages (owning @OneToMany)**
- POST `/ng/job-logs/{jobId}/add-package`
- DELETE `/ng/job-logs/{jobId}/packages/{packageId}`
- POST `/ng/job-logs/{jobId}/create-package`
- POST `/ng/job-logs/{jobId}/process-work-request/{workRequestId}`
- POST `/ng/job-logs/{sourceJobId}/move-package/{packageId}/to/{targetJobId}`
- POST `/ng/job-logs/{sourceJobId}/merge-into/{targetJobId}` [packages/lotos]

**WorkArea / Equipment / FileObject / PhysicalObject**
- POST `/ng/work-areas` [constantLotos, locations]
- PUT `/ng/work-areas/{id}` [constantLotos, locations]
- PUT `/ng/equipment` [files, lotoPoints]
- DELETE `/ng/equipment/{id}` [files, lotoPoints]
- POST `/ng/equipment/copy` [files, lotoPoints]
- PUT `/ng/files` [systems, tags]
- POST `/ng/files/{id}/clone-to-unit` [highlights + counterpart links]
- POST `/ng/files/clone-suggestions/accept` [lotoPoints]
- POST `/ng/files/{id}/import-from-counterpart` [Equipment/LotoPoint links]
- POST `/ng/files/migrate-systems-tags` [systems, tags]
- PUT `/ng/physical-object/{id}/systems` [systems]

**Diagram / HeatTrace / Scheduler Task**
- POST `/ng/diagram-connections/bulk-save/{diagramId}` [Diagram.connections]
- POST `/ng/diagram-placements/bulk-save/{diagramId}` [Diagram.placements]
- POST `/ht-api/` [equipmentList, pid]
- PUT `/ht-api/` [equipmentList, pid]
- PUT `/ng/scheduler/tasks/{id}/prerequisites` [prerequisites]
- POST `/ng/scheduler/tasks/{id}/attachments` [attachments]
- DELETE `/ng/scheduler/tasks/{id}/attachments/{fileId}` [attachments]
- POST `/ng/scheduler/tasks/{id}/references` [references]
- DELETE `/ng/scheduler/tasks/{id}/references/{refId}` [references]
- POST `/ng/scheduler/tasks` [prerequisites, attachments]
- PUT `/ng/scheduler/tasks/{id}` [prerequisites, attachments]
- POST `/ng/scheduler/task-templates/{id}/instantiate` [prerequisites, references]

---

## Tier 2 — permit lifecycle transitions + FK repoints (60)

**LotoStandard workflow** (side-effects `LotoStandardApprovalEvent` — assert emission!): submit-for-verification, verify, walkdown-complete, ready-for-testing, approve, send-back-to-draft, close-review; `/api/pwa/.../walkdown/submit`; pending-changes `/keep` `/dismiss`.

**Loto lifecycle** {CA where noted}: `PUT /ng/lotos/{id}/status`, ca-approve-hanging, ca-activate, hung, verified, release-requestor, release-ca, per-point `/point/{pointId}/{hung,verified,walkdown,removed}`, `/pull-for-test`, `/transfer`, `/api/pwa/.../basic`, sign-on.

**Package/JobLog lifecycle**: DPP `/activate` `/close` `/apply-date-time` `/foreman-sign-on`{loopback}; JobLog `/close`, `create-from-work-request/{id}`.

**WR / JHA**: Jha `POST /ng/jhas`, `PUT /jha-api`, `/jha-api/revoke/{id}`; WR `change-status` (mutating GET), `process-by-id`, `/work-requests-api/revoke`, `/request-details/{id}` (email), PWA `/permits/{id}/sign-on`.

**FK repoints / links**: LotoPoint link/unlink-counterpart, set-model-file; File link-counterpart; FileConnector create; PhysicalObject binder links (`/files/{fileId}`, `/loto-points/{lotoId}`, `/work-areas/{workAreaId}`, `PUT /{id}`, `/diagram` mutating GET).

**Value/Category dedup-divergence class**: `/ng/cv-manager/values/{merge,move}`, `DELETE .../values/{id}`, `/ng/values/{id}/repoint/{targetId}`, `/ng/cv-manager/categories/{merge}` `DELETE /{id}` [values].

**Misc**: InventoryUsage, EmailCorrespondence mark-read, Message create, Comment create, FieldListItem change-status {Maximo}.

---

## Tier 3 — scalar create/update/delete (53, representative)

One row per synced-entity family (siblings PUT/DELETE/save-all follow the same pattern): Category, Value, Equipment, HeatTrace, ElectricalPanel/breakers, Instrument, InstrumentLog, SdsChemical, InventoryItem, WorkRequest, Jha, Conversation/Message, User, RecurringPm, MaximoTicketAsset/FormTemplate/FormSubmission, Round/Question/RoundInstance/RoundAnswer/RoundIssue, schedule-v2 crew/pattern/assignment/event/coverage/PTO, EspDevice, Highlight (transitive), FileObject, EngraverTemplate, etc.

---

## Coverage blind spots (synced entity, NO frontend mutation endpoint)

| Entity | Note |
|--------|------|
| FireImpairment | registered, zero endpoints — Electron-only feature. **Untestable via endpoint.** |
| PrintableForm | registered, no endpoint. Blind spot. |
| FormContainer | registered, no endpoint (670 orphan containers historically). Blind spot. |
| FlowTemplate | scheduler flow templates, no endpoint. Blind spot. |
| Role | registered but `User.role` is a CSV scalar → entity effectively dead. Dead registration. |
| LedStrip | only path is one-shot `POST /ng/loto-boxes/heal-strips` migration; otherwise seed-only. Known drift+gap. |
| Highlight / LotoSnapshot / LotoStandardApprovalEvent / TaskReference | no direct endpoint — cover **transitively** via parent operations. |

---

## External-touching endpoints — ISOLATION-ONLY (the guard blocks these off-lab)

- **SharePoint**: WR update/complete, PWA WR/JHA submit, Instrument create/delete/bulk, SdsChemical submit/sync-pdfs/pull/push, InventoryItem, SDS audit, FieldListItem, insulation.
- **Maximo**: PM catalog refresh, ticket-index backfill/incremental, form submissions/complete, physical-object reseed, field-list-drift retries (⚠ not ADMIN-gated), physical-object maximo-link (metadata only).
- **Supabase**: `POST/PUT /ng/users` (async pw mirror), PWA register/change-password/reconcile/login.
- **ESP/WLED hardware**: loto-boxes led-color.
- **email/Graph**: WR request-details, email-correspondence/poll.
- **RedTag external**: red-tag simple-build / full-build.

`SyncConformanceService.isIsolated()` gates all mutations; verify via `GET /api/sync-conformance/isolation-status`.

---

## Open decisions (need input before/while building Phase 2)

1. **Duplicate surfaces** — which does the frontend call: `/ng/work-requests` vs `/work-requests-api`? `/ng/jhas` vs `/jha-api`? (Pick the canonical one per entity.)
2. **Attachment channel** — in scope? If yes, add the `PendingFileSync` oracle; if no, skip the *bytes* and assert only the M2M membership.
3. **External-touching** — stub vs sandbox vs skip. Default: skip (guard already blocks them off-lab).
4. **Role fixtures** — confirm the harness may mint synthetic `CONTROL_AUTHORITY`/`PLANT+SoD`/`ADMIN` identities.
5. **Blind spots** — accept transitive coverage for Highlight/LotoSnapshot/ApprovalEvent; document FireImpairment/PrintableForm/FormContainer/FlowTemplate/LedStrip as endpoint-untestable.
