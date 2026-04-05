# Field Lists — End-to-End Implementation

## Summary

Field Lists is a generic tracking system for field observations (insulation removal, leaks, winterization, etc.). Single entity, single SharePoint list, type-discriminated via `ListType` Value category.

Full stack: PWA submission → Server → SharePoint (with PA fallback) → Hub sync → Desktop UI.

---

## 1. Backend

### Entity
- `entities/field_list/FieldListItem.java` — extends `BaseAuditEntity`
- Fields: listType, status, location (all ManyToOne → Value), title, notes, dateObserved, timeObserved, specificLocation, equipment (ManyToOne), lotoPoint (ManyToOne), sharepointId, localUuid, spModifiedTime, submitter info
- Single `EquipmentTag` column on SP — server resolves to LotoPoint (preferred) or Equipment via `FieldListItemMapper.resolveEquipmentReference()`
- `DateObserved` combined date+time on SP (DateTime column), split into separate strings internally (same as WR's DateOfWork pattern)

### DTO
- `dto/field_list/FieldListItemDto.java` — flat DTO with Value names, equipment tag, `attachmentCount` (queried from PermitAttachment)
- `dto/pwa/PwaFieldListItemDto.java` — PWA submission payload

### Repository
- `repository/field_list/FieldListItemRepo.java` — extends BaseRepository, finders by sharepointId, localUuid, listType, status

### Mapper
- `mappers/field_list/FieldListItemMapper.java` — converts entity↔DTO, resolves equipment (LotoPoint-first, Equipment-fallback), counts attachments via `PermitAttachmentRepo`

### Services
- `sevice/angular/field_list/NgFieldListItemService.java` — CRUD, auto-sets status "Open" on create
- `sevice/pwa/PwaFieldListItemService.java` — PWA submission: dedup by localUuid, save locally first, try SP (cert → PA fallback), attachment dedup via SHA-256

### Controllers
- `controller/angular/field_list/NgFieldListItemController.java` — `/ng/field-list-items/*` (CRUD + attachments endpoint)
- `controller/pwa/PwaFieldListItemController.java` — `/api/pwa/field-list-item/*` (submit, status, update, list-types, loto-points, locations, health)

### Value Seeder
- `config/FieldListValueSeeder.java` — seeds FieldListType (Insulation Removal, Leaks, Winterization) and FieldListStatus (Open, In Progress, Resolved, Closed) on startup

### Security
- `/api/pwa/**` is `permitAll()` in SecurityConfigSpring — no changes needed

---

## 2. SharePoint Integration

### List Provisioning
- `SharePointListProvisioner.java` — "Field Lists" definition with 11 columns (PwaId, ListType, Status, Location, SpecificLocation, Notes, DateObserved, EquipmentTag, SubmitterName/Email/Phone)
- Auto-provisioned via Admin > SharePoint tab
- `fieldExists()` in `SharePointCertificateAccess` handles 400 responses (SharePoint sometimes returns 400 instead of 404 for missing fields)

### SP Adapter
- `sevice/sharepoint/adapters/FieldListItemSharePointAdapter.java` — cert + PA dual access
- `toMap()` combines dateObserved+timeObserved via `toCentralIso()` for SP DateTime column
- `mapFromSharePoint()` splits back via `fromSharePointDateTime()`

### SP Syncable
- `sevice/sharepoint/syncables/FieldListItemSharePointSyncable.java` — 60s interval, field-level LWW, auto-discovered by orchestrator

### Power Automate
- `PowerAutomateV2Client.fieldList()` method + `pa.flow.field-list-url` in `application.properties`
- PA flow setup guide: `project/architecture/sharepoint/pa-flow-setup-field-list.md`
- Flow structure: single Scope around Switch (create/getAll/update/addAttachment), success Response inside Scope, failure Response on parallel branch

---

## 3. GitHub Pages Publishing

### Published Data Files
All published to `browser/ng-ui/public/data/` and GitHub repo (`JacksonGeneration/permits`):

| File | Content | Auto-trigger |
|------|---------|-------------|
| `field-list-types.json` | `[{id, name}]` from FieldListType category | On Value change |
| `locations.json` | `[{id, name}]` from Location category | On Value change |
| `loto-points.json` | `[{id, tagNumber, description, specificLocation, eqType, locationId}]` | On LotoPoint save |
| `work-areas.json` | `[{id, name, locationIds}]` — extended with locationIds | On WorkArea save |

### Publisher
- `WorkAreaGitHubPublisher.java` — targets: AREAS, MAP, CATEGORIES, FIELD_LIST_TYPES, LOCATIONS, LOTO_POINTS, ALL
- `NgValueService.publishPwaCategoriesIfRelevant()` — triggers on FieldListType, Location, Work Category changes
- `NgLotoPointService.processLotoPoint()` — triggers `publishLotoPoints()` on save
- Admin manual publish via `AdminFunctionalitiesService.publishPwaData()` — targets: areas, map, categories, fieldlisttypes, locations, lotopoints, all

### WorkArea → Location Relationship
- `WorkArea.java` has ManyToMany `locations` (Set<Value>) via `work_area_location` join table
- `WorkAreaDto` has `locationIds` field
- Desktop UI: work area form has multi-select for Location Values
- Enables equipment picker filtering: area → locationIds → filter LotoPoints by locationId

---

## 4. PWA (browser/ng-ui)

### Navigation
- Home page card: "Field Lists" under static cards
- Header menu: "Field Lists" in MAIN_MENU_ITEMS
- Route: `/field-lists` with `FieldListPageComponent` → `FieldListComponent`

### Form
- Refactored to use `ReactiveFormComponent` (same pattern as WR form)
- Fields defined in `models/field-list/field-list-item.model.ts` via `fieldListFormFields()`
- Includes: work-area-map selector, equipment-picker, list type dropdown, title, date, time, notes, attachments

### Equipment Picker
- `shared/forms/equipment-picker/equipment-picker.component.ts` — ControlValueAccessor
- Loads data via `EquipmentDataService` (loto-points.json, work-areas.json, locations.json)
- When area selected: filters LotoPoints by area's locationIds, groups by eqType
- Search: multi-word AND matching (tokenize query, all tokens must match)
- When no area results: shows inline search for all equipment
- Registered in ReactiveFormComponent as `'equipment-picker'` field type
- Wired to `workAreaMap` form control for workAreaId context

### Submission Flow
- Uses `SubmissionOrchestratorService.submitFieldListItem()` — server first (30s timeout), PA fallback
- PA flow URL in `environment.ts` / `environment.prod.ts` → `paFlowUrls.fieldList`
- PA response handles string booleans (`"True"` vs `true`)
- Submission overlay: spinner while submitting, success/error result card
- Items saved to localStorage history (attachments stripped for serialization)
- Draft persistence: form values auto-saved to localStorage, restored on reopen, cleared on successful submit

### Edit Flow
- "View / Edit Previous" shows localStorage history
- Items track `submitted: boolean` — true only if server/PA accepted
- Non-submitted items use create (not update) when re-submitted
- "Local only" badge shown for non-submitted items

### Offline Support
- List types: load from localStorage/hardcoded defaults immediately, refresh from server in background
- Equipment data: server → static JSON → localStorage fallback chain
- All data cached in localStorage with `pwa_` prefix keys

---

## 5. Desktop Frontend (frontend/)

### Page Structure
- `features/field-list/refactored/rf-field-list-page/rf-field-list-page.component.ts`
- Uses `MainLayoutComponent` with `[header]` and `[main-content]` slots (same as InstrumentPageComponent)
- Contains: list type tabs, Print button, + New Item button, SpSyncToolbarComponent, table, form popup, detail dialog

### Table
- `features/field-list/refactored/rf-field-list-table/rf-field-list-table.component.ts`
- Uses shared `TableComponent` with required providers (TableSearchService, TableStateService, etc.)
- Template: `.table-wrapper` div wrapping `<app-table>` — **must match InstrumentTableComponent pattern exactly** for proper flex height chain
- Columns: listType (colored), status (colored), title, date/time, location, specificLocation, equipment, submitter, notes, attachmentCount, createdBy

### Detail Dialog
- `features/field-list/refactored/rf-field-list-detail-dialog/rf-field-list-detail-dialog.component.ts`
- Opens on row double-click via `RfPopupProjectionComponent`
- Shows read-only fields, loads attachments via API, image grid with lightbox (fullscreen on click)
- Edit button → opens form popup

### Print
- Print button in toolbar collects displayed items, loads attachments for each, opens new window with formatted HTML + inline images, triggers `window.print()`

### Model
- `models/field-list/field-list-item.model.ts` — interface + DTO class with toJson/fromJson/toFormFields/toTableColumns
- `attachmentCount` field for table display

### Routes
- `routes/field-list.routes.ts` — `/field-lists` and `/field-lists/:listType`
- Registered in `app.routes.ts` with authGuard + fullAccessGuard
- Navigation: "Field Lists" card in Log group (navigation-card.model.ts + router-menu.model.ts)

---

## 6. Known Issues & Lessons Learned

### SharePoint
- `fieldExists()` returns 400 (not 404) for missing fields on some lists — catch `HttpClientErrorException.BadRequest`
- `sharepointRestTemplate` has no connect/read timeout — if SP is unreachable, server request thread blocks indefinitely
- DateObserved is a DateTime column — use `toCentralIso()` / `fromSharePointDateTime()` for timezone conversion

### PWA
- `saveToLocalHistory()` must strip `attachments` before `JSON.stringify` — File objects are not serializable, will throw and block the success callback silently (RxJS swallows errors in `next` handlers)
- PA response `success` field may be string `"True"` — always coerce: `response.success === true || String(response.success).toLowerCase() === 'true'`
- Server API methods used by orchestrator should NOT have their own `catchError(this.handleError)` — let raw errors propagate to the orchestrator's `catchError` for proper PA fallback
- Equipment picker: `cdk-virtual-scroll-viewport` needs explicit height from flex chain — follow InstrumentTableComponent pattern exactly

### Desktop Frontend
- Table component requires 10 providers (TableSearchService, TableStateService, etc.) — missing any causes `NullInjectorError` that silently kills router navigation
- Page must follow InstrumentPageComponent layout pattern exactly — MainLayout → main-content → content-area div → table component
- Table wrapper must use `.table-wrapper { flex: 1 1 auto; display: flex; flex-direction: column; min-height: 0; height: 100%; overflow: hidden; }` — deviating breaks virtual scroll viewport height

---

## 7. File Index

### Backend (Java)
```
entities/field_list/FieldListItem.java
dto/field_list/FieldListItemDto.java
dto/pwa/PwaFieldListItemDto.java
repository/field_list/FieldListItemRepo.java
mappers/field_list/FieldListItemMapper.java
sevice/angular/field_list/NgFieldListItemService.java
sevice/pwa/PwaFieldListItemService.java
controller/angular/field_list/NgFieldListItemController.java
controller/pwa/PwaFieldListItemController.java
sevice/sharepoint/adapters/FieldListItemSharePointAdapter.java
sevice/sharepoint/syncables/FieldListItemSharePointSyncable.java
config/FieldListValueSeeder.java
```

### Modified Backend Files
```
clients/PowerAutomateV2Client.java — added fieldList() method
sevice/sharepoint/SharePointListProvisioner.java — added "Field Lists" definition
sevice/sharepoint/SharePointCertificateAccess.java — fieldExists() catches 400
sevice/angular/permits/WorkAreaGitHubPublisher.java — LOCATIONS, LOTO_POINTS targets
sevice/angular/NgValueService.java — triggers for Location, FieldListType
sevice/angular/loto/NgLotoPointService.java — triggers publishLotoPoints on save
sevice/angular/admin/AdminFunctionalitiesService.java — manual publish targets
sevice/angular/permits/NgWorkAreaService.java — handles locationIds on save
entities/permits/WorkArea.java — ManyToMany locations
controller/pwa/PwaWorkRequestController.java — locationIds in work areas response
application.properties — pa.flow.field-list-url
```

### Desktop Frontend
```
models/field-list/field-list-item.model.ts
models/permits/work-area.model.ts — locationIds field
features/field-list/refactored/rf-field-list-page/
features/field-list/refactored/rf-field-list-table/
features/field-list/refactored/rf-field-list-form/
features/field-list/refactored/rf-field-list-detail-dialog/
features/field-list/refactored/services/rf-field-list-api.service.ts
features/field-list/refactored/services/rf-field-list-state.service.ts
routes/field-list.routes.ts
models/ui/navigation-card.model.ts — Field Lists card in Log group
models/ui/router-menu.model.ts — Field Lists menu item
app.routes.ts — FIELD_LIST_ROUTES
```

### PWA Frontend (browser/ng-ui)
```
features/field-list/field-list.component.ts
pages/field-list-page/field-list-page.component.ts
models/field-list/field-list-item.model.ts
services/equipment-data.service.ts
services/server-api.service.ts — field list + equipment data methods
services/submission-orchestrator.service.ts — submitFieldListItem, PA fallback
services/power-automate.service.ts — 'fieldList' entity type
shared/forms/equipment-picker/equipment-picker.component.ts
shared/forms/reactive-form/reactive-form.component.html — equipment-picker case
shared/forms/work-area-map-select/ — confined space badge, zoom limits, label fixes
models/inputs/form-field.model.ts — 'equipment-picker' type
pages/home-page/home-page.component.ts — Field Lists card
models/menu/router-menu.model.ts — Field Lists menu
app.routes.ts — field-lists route
environments/environment.ts — paFlowUrls.fieldList
environments/environment.prod.ts — paFlowUrls.fieldList
styles.css — theme variables (input-bg, success-bg, error-bg)
```

### Documentation
```
project/features/field-list/field-list.md — architecture overview
project/features/field-list/field-list-e2e.md — this file
project/architecture/sharepoint/pa-flow-setup-field-list.md — PA flow creation steps
```
