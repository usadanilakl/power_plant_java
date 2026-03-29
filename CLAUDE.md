# Power Plant Java

## Project Overview
- Spring Boot 3.2.4 / Java 21 desktop + PWA app with Electron wrapper
- H2 file-based database with Spring Data Auditing
- Angular 19 frontend (standalone components, Angular Material)
- Field-level CRDT sync to central server at configurable URL
- Default port: 8082 (desktop), 8090 (hub)

## Deployment Profiles
- **Desktop** (`prod`): Local Electron-wrapped instance on port 8082. Syncs to hub via SSE. Manual SharePoint sync per entity type.
- **Hub** (`prod,hub,server`): Central sync server on port 8085. Auto-polls SharePoint every 30s. Broadcasts changes to desktops via SSE. Serves backups and updates. Runs behind IIS reverse proxy (`server` profile trusts `X-Forwarded-*` headers).
- **Dev/Test** (`dev`/`test`): Local development with separate H2 databases.
- Conditional activation: `@ConditionalOnProperty(name = "sync.role", havingValue = "hub")` for hub-only beans.

## Data Flow
```
PWA (GitHub Pages) ──JWT──▶ Hub ──▶ SharePoint (certificate)
                                └──▶ SharePoint (Power Automate V2 fallback)
PWA ──────────────────────▶ SharePoint (direct fallback when hub offline)

Desktop ◀──SSE──▶ Hub ──▶ SharePoint
```
- Data always saved locally first — SharePoint submission is best-effort
- `SharepointAccessService` facade: certificate access (primary) → Power Automate V2 (fallback)
- Each entity type has a `*SharePointAdapter` with `cert*()` and `pa*()` method pairs

## PWA (separate project: `ng-ui`)
PWA frontend is a **separate Angular project** (`ng-ui`), not part of this repo. This repo provides the backend APIs it consumes (`controller/pwa/`, `sevice/pwa/`).
- **Work Request / JHA submission** with attachments (base64, SHA-256 dedup)
- **Instrumentation** data submission and logging
- **Messaging** via `PwaConversationController`
- **User registration** and profile management
- **Email-based submission links** (`/api/pwa/work-request/submit-from-email?data={base64}`)
- JWT auth (72h expiry), CORS: `dk-power.github.io`, `jacksongeneration.github.io`, `localhost`

## Build & Run
- **Backend**: `mvn spring-boot:run` (Maven, pom.xml)
- **Frontend**: `cd frontend && ng build --configuration production --base-href=/angular/browser/`
- **Electron**: `cd electron-manager && npm run dev` (must run `npm run build:main` after TS changes)
- **Tests**: Skipped by default (`mvn test -DskipTests=false` to enable)

## Critical Conventions
- **Package typo**: Service package is `sevice/` (NOT `service/`) — do NOT rename
- **Response wrapper**: All Angular endpoints return `ResponseEntity<NgApiResponse<T>>`
- **Controller prefix**: `/ng/*` for Angular-facing REST controllers; `/api/pwa/*` for PWA endpoints
- **Naming**: Controllers `Ng<Entity>Controller`, Services `Ng<Entity>Service`, DTOs `<Entity>Dto` / `<Entity>IdDto`
- **Soft deletes**: `deleted` boolean + `@Where(clause = "deleted = false")` — never hard delete domain entities
- **DI**: Constructor injection via `@RequiredArgsConstructor` (Lombok), use `@Lazy` for circular deps
- **Mapper**: `UniversalMapper` (ModelMapper, strict matching, skip null, field access) — explicit field-by-field in custom mappers
- **ID generation**: `DevicePrefixedIdGenerator` — supports pre-assigned IDs from sync
- **Pagination**: 1-indexed (page 1 = first page, converted to 0-indexed internally)
- **Transactions**: `@Transactional` at service class level

## Entity Hierarchy
- `BaseIdEntity` — ID gen, soft delete, sync listener (`FieldChangeEntityListener`), dateCreated/dateModified
- `BaseAuditEntity extends BaseIdEntity` — adds createdBy/modifiedBy (Spring Data `@CreatedBy`/`@LastModifiedBy`)
- `BasePermitEntity extends BaseAuditEntity` — adds permitNumber, permitStatus

## Sync Architecture
- Field-level CRDT with Last-Writer-Wins conflict resolution
- `FieldChangeEntityListener` on BaseIdEntity tracks all changes automatically
- Three-pass entity application: simple fields → ManyToMany → failed ManyToOne retry
- SSE for real-time updates, exponential backoff reconnection (2s → 60s max)
- `SyncContext` thread-local prevents infinite sync loops
- `SharePointSyncOrchestrator` runs on hub only — registered `SharePointSyncable` beans per entity type

## Frontend Patterns (Angular 19)
- Standalone components with direct imports
- Model pattern: `interface <Entity>Model extends BaseModel` + `class <Entity>Dto extends BaseDto`
- DTO methods: `toJson()`, `fromJson(json)`, `toFormFields()`, `toTableColumns()`
- Services: `@Injectable({ providedIn: 'root' })`, return `Observable<SpringApiResponse<T>>`
- State: BehaviorSubject + `toSignal()` + `computed()` in `current-items-services/`
- Search: POST `/search` with `SearchCriteria` body
- Cleanup: `takeUntilDestroyed(destroyRef)` for subscriptions

### Shared Components — MUST reuse, do NOT duplicate
Reference implementation: **Loto Builder** (`features/loto-standard/refactored/loto-builder/`) — composes shared + cross-feature components with signal-based state (`LotoBuilderStateService`).

**Shared UI components** (from `shared/`):
- **`MainLayoutComponent`** — Page structure wrapper
- **`RouterMenuComponent`** — Top navigation menu
- **`InteractiveImageComponent`** — Canvas-based image viewer with shape drawing/selection
- **`RfFloatingWindowComponent`** — Draggable floating window container
- **`RfPopupProjectionComponent`** — Portal-based modal wrapper
- **`RfToggleMenuComponent`** — Nested toggle tree menu
- **`ContextMenuComponent`** — Right-click context menu
- **`GuideDirective`** / **`ReactiveGuideDirective`** — Contextual help tooltips

**Cross-feature components** (reuse from other features, don't recreate):
- `RfLotoPointFormComponent` / `RfLotoPointTableComponent` / `LotoPointDualFormComponent` / `LotoPointDisplayTableComponent` — from `features/loto-points/refactored/`
- `RfFileLeftPanelComponent` / `RfFileFormComponent` / `RfMultiUploadComponent` — from `features/files/refactored/`
- `DiagramCanvasComponent` — from `features/diagram-builder/`
- `BulkSearchDialogComponent` — from `features/loto-points/`

**State pattern**: `LotoBuilderStateService` — comprehensive signal-based state (context, UI toggles, interaction, form, OCR/processing). New complex features should follow this pattern.

### Shared Services — use existing, do NOT create new ones
- **`SharedDataService`**: Cached enum/value loading (`loadSystems()`, `loadEquipmentTypes()`, etc.) with `shareReplay(1)` + SSE refresh. Never duplicate these API calls.
- **`Current*Service`** pattern (`services/current-items-services/`): BehaviorSubject + `toSignal()` + `computed()` for entity state. Examples: `CurrentEquipmentService`, `CurrentDailyPermitPackageService`.
- **`ClipboardService`**: In-memory copy/paste with `CopyPasteDirective` (Ctrl+click copy, Shift+click paste).
- **`QaService`**: Context-sensitive help — injected into form components automatically.

### New Feature Checklist
When creating a new feature component:
1. DTO: extend `BaseDto`/`BasePermitDto`, implement `toJson()`, `fromJson()`, `static toTableColumns()`, `static toFormFields()`
2. Table: use `TableComponent` with columns from `Dto.toTableColumns()`
3. Forms: use `SmartFormComponent` with fields from `Dto.toFormFields(dto)`
4. State: create a `Current<Entity>Service` following the BehaviorSubject + signals pattern
5. Dialogs: use `PopupComponent`, `AttachmentDialogComponent`, `CommentsDialogComponent` — don't build custom dialogs
6. Dropdowns: use `SharedDataService` cached observables for options
7. All custom inputs: implement `ControlValueAccessor` for reactive forms integration

## Secrets
- **Never commit secrets** — all externalized to gitignored files
- Backend: `application-secrets.properties` (loaded via `spring.profiles.include=secrets`)
- Electron: runtime configs in `managed_apps/pid/` (pjm-config.json, gate-log-config.json)
- Certificate: `data/certificate.pfx` (gitignored)

## Key Directories
- `src/main/java/com/dk_power/power_plant_java/` — Java source
- `frontend/src/app/` — Angular source
- `electron-manager/src/` — Electron source
- `project/` — Architecture docs and feature specs
- `project/architecture/` — 66+ architecture decision docs
- `project/features/` — 70+ feature specification docs



## LOTO Point
- holds equipment information and characteristics (JSON array: fluid, voltage, pressure, temperature, etc.)
- connects with related files via Equipment entity (used for coordinates linking LotoPoint ↔ FileObject)
- loto point form has field to connect to FileObject (open dialog, select file, draw shape)
- loto points with tag number 01/02 have counterpart — dual form shows both side by side
- counterpart transfer logic copies and converts data (unit text transformation, zero energy equipment lookup)
- related LOTO points (comma-separated IDs) for points that always travel together
- ZeroEnergy relationship — template-based methods with equipment ID substitutions
- LotoStandard ManyToMany with custom ordering (lotoPointOrder JSON map)
- BradyPrinter (web-based label printing) and Engraver (LightBurn CSV generation) services
- bulk edit and bulk search capabilities
- tag number auto-generation per system
