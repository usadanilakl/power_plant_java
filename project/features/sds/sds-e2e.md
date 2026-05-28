# SDS Chemical Inventory — End-to-End Implementation Status

## Summary

Safety Data Sheet (SDS) chemical inventory. One entity (`SdsChemical`), one SharePoint list
("SDS"). Full stack: PWA submission → Server → SharePoint (PA fallback) → Hub sync → Desktop UI.
Mirrors the Inventory / Field Lists architecture.

Requirements: `project/features/sds/chemical-inventory.md`.

**This is a phased build.** Phase 1 (core CRUD + sync + SharePoint + UI) and **Phase 2 (book/section
numbering + Incoming queue)** are **complete and building**. Phases 3–4 (document generation, intake
wizard, audit) are deferred — see §7. Phase 2 design detail: `sds-phase2-plan.md`.

### Confirmed design decisions (2026-05-28)
- **Names + locations** are newline-delimited strings in single TEXT columns (`names`,
  `locations`) — NOT `@ElementCollection` / child entities. Keeps field-level CRDT sync and the
  flat SharePoint columns simple, no lazy-init. First line of `names` = primary name.
- **Book/Section numbering** (Phase 2, DONE): `(bookNumber, sectionNumber)` = the unique address of
  one chemical ("Section" = the laminated title number on the physical sheet). Suggest-then-approve:
  `SdsAddressService.suggestNextAddress()` derives `(latestBook, nextSection)` from synced data
  floored by a config baseline; the desktop form pre-fills it and the user approves/edits. NO
  capacity cap / NO auto-rollover — "Start new book" is a manual button. Seed baseline:
  `sds.book.current-book-number=4`, `sds.book.current-max-section=40` (first suggestion Book 4 /
  Section 41).
- **Document generation** (Phase 3): server-side HTML → browser print (like the Field List print
  view), not a PDF library.
- **Status lifecycle** (`SdsStatus` category): **Incoming → Pending → Filed → Removed**. Incoming =
  admin dumped a raw PDF (no metadata). Pending = intake started, not yet filed. Filed = address
  assigned + sheets printed. Removed = out of inventory (record kept; soft-delete `deleted` flag
  stays reserved for true mistakes/dedup). Incoming + Pending = "needs processing" (Electron overview).

---

## 1. Backend — DONE

### Entity
- `entities/sds/SdsChemical.java` — extends `BaseAuditEntity` (→ `FieldChangeEntityListener` drives
  hub↔client sync). Fields: `names` (TEXT, newline-delimited), `locations` (TEXT), `status`
  (ManyToOne → Value "SdsStatus"), `bookNumber`, `chemicalIndex`, `notes`, `processedByName/Email`,
  `processedAt`, `lastAuditedAt`, SP sync fields (`sharepointId`/`localUuid`/`spModifiedTime`),
  submitter info. `@Where(clause = "deleted IS NOT TRUE")`.

### DTOs
- `dto/sds/SdsChemicalDto.java` — flat DTO; `primaryName` derived from first line of `names`;
  `attachmentCount`.
- `dto/pwa/PwaSdsChemicalDto.java` — PWA submission payload.

### Repository
- `repository/sds/SdsChemicalRepo.java` — extends `BaseRepository`; finders by sharepointId,
  localUuid, status (+ status-in).

### Mapper
- `mappers/sds/SdsChemicalMapper.java` — entity↔DTO; batch `convertToDtos()` (1 grouped COUNT query
  for attachment counts, no N+1); `primaryName()` static helper. `ENTITY_TYPE = "SdsChemical"`.

### Services
- `sevice/angular/sds/NgSdsChemicalService.java` — CRUD, `getActive()` (Pending+Filed),
  `getUnprocessed()` (Pending — Electron overview), `changeStatus()`, attachments, soft delete.
  Auto-sets status "Pending" on create. Status constants live here.
- `sevice/angular/sds/SdsChemicalSyncService.java` — implements `SyncableService<SdsChemical>` for
  hub↔desktop sync.
- `sevice/pwa/PwaSdsChemicalService.java` — PWA submit/update with localUuid dedup, save-local-first,
  SHA-256 attachment dedup, best-effort SP push.

### Controllers
- `controller/angular/sds/NgSdsChemicalController.java` — `/ng/sds-chemicals/*`
  (get-all, active, by-status, unprocessed, get-by-id, create, update, change-status, attachments,
  delete).
- `controller/pwa/PwaSdsChemicalController.java` — `/api/pwa/sds-chemical/*`
  (submit, update, status/{localUuid}, active, health) with the standard `@CrossOrigin` origins.

### Value Seeder
- `config/SdsValueSeeder.java` — seeds `SdsStatus` (Pending/Filed/Removed) on hub startup
  (`@ConditionalOnProperty sync.role=hub`).

### Sync registration (both done — required or sync silently breaks)
- `sevice/ServiceFacade.java` — `SdsChemicalSyncService` in constructor params + `serviceMap.put`.
- `sevice/sync/EntityTableRegistry.java` — `SdsChemical` → `sds_chemical` AND added to `SYNC_ORDER`.

---

## 2. SharePoint Integration — DONE (provisioning + PA flow are operational steps)

- `sevice/sharepoint/adapters/SdsChemicalSharePointAdapter.java` — cert + PA dual access; single
  list "SDS" (no `entity` discriminator — one list, like Field List). `toMap()` sets SP `Title` =
  primary name; `bookNumber`/`chemicalIndex` mapped as strings.
- `sevice/sharepoint/syncables/SdsChemicalSharePointSyncable.java` — 60s LWW field merge,
  auto-discovered by the orchestrator.
- `clients/PowerAutomateV2Client.java` — `sds()` method + `pa.flow.sds-url` property (blank) +
  `isSdsConfigured()`.
- `sevice/sharepoint/SharePointListProvisioner.java` — "SDS" list def (PwaId, Names[note],
  Locations[note], Status, BookNumber, ChemicalIndex, Notes[note], ProcessedByName/Email,
  SubmitterName/Email/Phone; `Title` = primary name). Auto-appears in Admin > SharePoint.
- `sevice/sync/PermitAttachmentSyncService.java` — `syncAttachmentsForSdsChemical()` + adapter inject.

**Operational TODO:**
1. Restart hub → Admin > SharePoint > Refresh Status → Create the "SDS" list.
2. Build the SDS Power Automate flow (single list; same shape as the Field List flow — Scope around
   Switch on `actionType` create/getAll/update/addAttachment/getAttachments).
3. Fill `pa.flow.sds-url` (backend) + PWA `paFlowUrls.sds` (both environments).

---

## 3. Desktop Frontend (frontend/) — DONE

`features/sds/refactored/` (trimmed from the Inventory template — no QR/Brady/usage/audit):
- `rf-sds-page` — status tabs (All / Pending / Filed / Removed), + New Chemical, `SpSyncToolbar`
  (`entityType="SdsChemical"`), table, form popup, detail dialog.
- `rf-sds-table` — image thumbnails + lightbox, context menu, double-click → detail (driven through
  the state service's `openDetail()`).
- `rf-sds-form` — reactive form (names/locations/notes textareas, processedBy, submitter).
- `rf-sds-detail-dialog` — names/locations chips, book/index address, status chips
  (Pending/Filed/Removed), notes, attachments grid + lightbox + upload. Uses
  `RfPopupProjectionComponent [isOpen]="true"`.
- `services/` — api, state (`openDetail()`, `isDetailOpen`/`detailItem` signals), context-menu
  (extends `ContextMenuService`), table-click (extends `TableClickService`).
- `models/sds/sds-chemical.model.ts` — DTO + `toTableColumns()` (status colored, primaryName,
  book/index address, locations joined, files, processedBy, createdBy) + `toFormFields()`.
- `routes/sds.routes.ts` — `/sds`, `/sds/:status`. Registered in `app.routes.ts` (`SDS_ROUTES`,
  authGuard + fullAccessGuard).
- Nav: "SDS Chemicals" card (`navigation-card.model.ts`) + menu item (`router-menu.model.ts`) —
  icon `science`, color `#8D6E63`.

---

## 4. PWA Frontend (browser/ng-ui) — DONE

- `features/sds/sds.component.ts` — single submission form (names/locations/notes textareas + SDS
  PDF upload). Submitter + processedBy auto-populated from `UserSetupService`. Draft persisted to
  localStorage. Submit overlay (spinner/success/error). Sets status "Pending".
- `pages/sds-page/sds-page.component.ts` — layout wrapper; route `/sds` → `/sds/form`.
- `models/sds/sds-chemical.model.ts` — `sdsChemicalFormFields()` + payload interface.
- `services/server-api.service.ts` — `submitSdsChemical` / `updateSdsChemical` (no inner catchError,
  so the orchestrator's fallback fires).
- `services/submission-orchestrator.service.ts` — `submitSdsChemical` / `updateSdsChemical` +
  `tryPowerAutomateSds` (server → PA → email chain).
- `services/power-automate.service.ts` — `'sds'` entity type.
- `environments/environment.ts` + `environment.prod.ts` — `paFlowUrls.sds` (blank).
- Home card + menu item.

---

## 4b. Phase 2 — Book/Section Numbering + Incoming Queue — DONE

Deltas on top of Phase 1 (detail: `sds-phase2-plan.md`):
- **Rename** `chemicalIndex` → `sectionNumber` everywhere; SP column `ChemicalIndex` → **`Section`**;
  UI label "Book / Section". (So §1–§2 mentions of `chemicalIndex`/`ChemicalIndex` now read
  `sectionNumber`/`Section`.)
- **`SdsAddressService.suggestNextAddress()`** (new) — derives `(latestBook, nextSection)` from
  synced data floored by config baseline (`sds.book.current-book-number`, `sds.book.current-max-section`).
  No counter, no rollover.
- **`SdsChemicalRepo`** — `findMaxBookNumber()`, `findMaxSectionInBook(book)`.
- **`NgSdsChemicalController`** — `GET /suggest-address`, `POST /dump` (bulk Incoming).
- **`NgSdsChemicalService`** — `STATUS_INCOMING`; `getUnprocessed()` = Incoming + Pending;
  `dumpIncoming(files)` (one Incoming chemical per PDF, filename → placeholder name).
- **`SdsValueSeeder`** — adds `Incoming`.
- **Desktop UI** — form has editable Book + Section number fields pre-filled from the suggestion +
  **"Start new book"** button (`viewChild` → `form.patchValue`); state `openNewForm()` /
  `openProcessForm()` fetch the suggestion; "Incoming" status tab; **"Dump PDFs"** page button
  (multi-file → base64 → `/dump`); detail dialog shows the **"check last filed section before filing"**
  reminder + Incoming status chip/colors.
- Config: `application.properties` → `sds.book.current-book-number=4`, `sds.book.current-max-section=40`.

PWA unchanged in Phase 2 (still submits Pending; address assigned later on desktop filing).

---

## 5. Build Status

- Backend: `mvn compile -q` → exit 0.
- PWA: `cd browser/ng-ui && npx ng build` → bundle complete (only pre-existing budget warnings).
- Desktop: `cd frontend && npx ng build --configuration production --base-href=/angular/browser/`
  → output written (only pre-existing budget / CommonJS warnings in unrelated components).
- **Not yet exercised in a running browser** — build-clean verified, click-through behavior not.

---

## 6. File Index

### Backend (new)
```
entities/sds/SdsChemical.java
dto/sds/SdsChemicalDto.java
dto/pwa/PwaSdsChemicalDto.java
repository/sds/SdsChemicalRepo.java
mappers/sds/SdsChemicalMapper.java
sevice/angular/sds/NgSdsChemicalService.java
sevice/angular/sds/SdsChemicalSyncService.java
sevice/angular/sds/SdsAddressService.java          (Phase 2)
sevice/pwa/PwaSdsChemicalService.java
controller/angular/sds/NgSdsChemicalController.java
controller/pwa/PwaSdsChemicalController.java
sevice/sharepoint/adapters/SdsChemicalSharePointAdapter.java
sevice/sharepoint/syncables/SdsChemicalSharePointSyncable.java
config/SdsValueSeeder.java
```
### Backend (modified)
```
clients/PowerAutomateV2Client.java         — sds() + pa.flow.sds-url + isSdsConfigured()
sevice/sync/PermitAttachmentSyncService.java — syncAttachmentsForSdsChemical()
sevice/sharepoint/SharePointListProvisioner.java — "SDS" list def
sevice/sync/EntityTableRegistry.java       — SdsChemical → sds_chemical + SYNC_ORDER
sevice/ServiceFacade.java                  — SdsChemicalSyncService registered
src/main/resources/application.properties  — pa.flow.sds-url=, sds.book.current-book-number/max-section
(Phase 2 modified) repository/sds/SdsChemicalRepo.java — findMaxBookNumber/findMaxSectionInBook
(Phase 2 modified) controller/angular/sds/NgSdsChemicalController.java — /suggest-address, /dump
(Phase 2 modified) sevice/angular/sds/NgSdsChemicalService.java — Incoming, getUnprocessed, dumpIncoming
(Phase 2 modified) config/SdsValueSeeder.java — Incoming
(Phase 2 renamed) entity/dto/mapper/adapter/syncable — chemicalIndex → sectionNumber, SP col Section
```
### Desktop frontend
```
models/sds/sds-chemical.model.ts
features/sds/refactored/rf-sds-page/
features/sds/refactored/rf-sds-table/
features/sds/refactored/rf-sds-form/
features/sds/refactored/rf-sds-detail-dialog/
features/sds/refactored/services/   (api, state, context-menu, table-click)
routes/sds.routes.ts
app.routes.ts                — SDS_ROUTES
models/ui/navigation-card.model.ts — SDS card
models/ui/router-menu.model.ts     — SDS menu
```
### PWA frontend
```
features/sds/sds.component.ts
pages/sds-page/sds-page.component.ts
models/sds/sds-chemical.model.ts
services/server-api.service.ts            — submit/update SDS
services/submission-orchestrator.service.ts — submit/update + PA fallback
services/power-automate.service.ts        — 'sds' entity
environments/environment.ts + environment.prod.ts — paFlowUrls.sds
app.routes.ts                — sds route
pages/home-page/home-page.component.ts — SDS card
models/menu/router-menu.model.ts       — SDS menu
```

---

## 7. Deferred — Phases 3–4 (design with the user before building)

- **Phase 3 — Document generation + guided intake wizard.** Title sheet (names + locations + Book/
  Section in the top-right corner) and index sheet (alphabetical — one row per *name*, all of a
  chemical's names pointing to its single Book/Section) as server-side HTML → print. Stateful
  "new SDS arrived" wizard with a manual-steps checklist + confirmation step.
- **Phase 4 — Audit flow.** Select by location / alphabetical → per-item confirm-correct (drops from
  list) or edit; on edit save the OLD snapshot in the hub DB (NOT SharePoint) + audit trail
  (who/when/comments). `lastAuditedAt` field already present. Pattern reference:
  `DailyPermitPackage.modificationsJson` / `PackageModification`.
- **Electron overview** of newly-added / unprocessed chemicals (`/ng/sds-chemicals/unprocessed`
  endpoint already exists).
- **Skipped:** GitHub-Pages SDS-status publishing — PWA auto-sets "Pending", so no offline status
  dropdown is needed.
