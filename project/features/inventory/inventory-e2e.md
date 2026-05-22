# Inventory — End-to-End Implementation Status

## Summary

QR-driven asset tracking. Two entities (`InventoryItem`, `InventoryUsage`), two SharePoint
lists. Full stack: PWA submission/scan → Server → SharePoint (PA fallback) → Hub sync →
Desktop UI. Mirrors the Field Lists architecture.

**Status: complete and building.** Operational setup steps remain (provision the two SP
lists, build the single PA flow, fill its URL).

---

## 1. Backend — DONE

### Entities
- `entities/inventory/InventoryItem.java` — extends `BaseAuditEntity`. itemType/status/location
  (ManyToOne → Value), title, serialNumber, manufacturer, model, description, qrToken (unique),
  currentLocation, currentHolderName/Email, lastCheckedOutAt, SP sync fields, submitter info
- `entities/inventory/InventoryUsage.java` — extends `BaseAuditEntity`. inventoryItem (ManyToOne),
  userName/Email, location, purpose, comments, scannedAt, returnedAt, eventType, SP sync fields

### DTOs
- `dto/inventory/InventoryItemDto.java`, `InventoryUsageDto.java`
- `dto/pwa/PwaInventoryItemDto.java`, `PwaInventoryUsageDto.java`

### Repositories
- `repository/inventory/InventoryItemRepo.java` — finders by sharepointId, localUuid, qrToken,
  itemType, status; combined type+status query
- `repository/inventory/InventoryUsageRepo.java` — finders by item, user, sharepointId, localUuid

### Mappers
- `mappers/inventory/InventoryItemMapper.java` — entity↔DTO, batch conversion (1 query for
  attachment counts), usage count
- `mappers/inventory/InventoryUsageMapper.java`

### Services
- `sevice/angular/inventory/NgInventoryItemService.java` — CRUD, status change, QR token
  generation, `recordUsage()` (updates item status/holder + best-effort SP push), attachments,
  audit queries (`getCheckedOutItems`, `getMissingItems`)
- `sevice/angular/inventory/InventoryItemSyncService.java`, `InventoryUsageSyncService.java` —
  implement `SyncableService` for hub↔desktop sync
- `sevice/pwa/PwaInventoryItemService.java` — PWA submit/update/recordUsage with dedup + SP push

### Controllers
- `controller/angular/inventory/NgInventoryItemController.java` — `/ng/inventory-items/*`
- `controller/pwa/PwaInventoryItemController.java` — `/api/pwa/inventory-item/*`
- `controller/pwa/PwaSecuredController.java` — `/api/pwa/secured/inventory/*` (JWT)
- `controller/qr/QrTrafficController.java` — `/qr/inv/{token}` deep-link redirect

### Value Seeder
- `config/InventoryValueSeeder.java` — seeds InventoryType + InventoryStatus on hub startup

### Sync registration
- `EntityTableRegistry` — `InventoryItem` → `inventory_item`, `InventoryUsage` → `inventory_usage`;
  both in `SYNC_ORDER`
- `ServiceFacade` — both registered for `FieldSyncService` to apply incoming changes

---

## 2. SharePoint Integration — DONE (provisioning is an operational step)

- `SharePointListProvisioner` — "Inventory" (15 cols) + "Inventory Usage" (11 cols) definitions.
  Auto-appear in Admin > SharePoint tab.
- `InventoryItemSharePointAdapter`, `InventoryUsageSharePointAdapter` — cert + PA dual access
- `InventoryItemSharePointSyncable`, `InventoryUsageSharePointSyncable` — 60s LWW merge,
  auto-discovered by orchestrator
- `PowerAutomateV2Client.inventory()` — single method/URL; the request's `entity`
  field ("item" | "usage") routes to the right list
- `pa.flow.inventory-url` (set) — one flow serves both lists

**Operational TODO:**
1. Restart hub → Admin > SharePoint > Refresh Status → Create both lists
2. Build the single "Inventory V2" PA flow per `pa-flow-setup-inventory.md`
   (top-level Switch on `entity`, nested Switch on `actionType`)
3. Confirm the flow URL in `pa.flow.inventory-url` + PWA `paFlowUrls.inventory`

---

## 3. GitHub Pages Publishing — DONE

- `WorkAreaGitHubPublisher` — `INVENTORY_TYPES` target → `inventory-types.json`
- `NgValueService` — auto-publishes on InventoryType Value change
- `AdminFunctionalitiesService` — `"inventorytypes"` publish target
- Admin Sync tab — "Sync Inventory Types" button
- `browser/ng-ui/public/data/inventory-types.json` — placeholder shipped for offline fallback

---

## 4. PWA (browser/ng-ui) — DONE

### Navigation
- Home card "Inventory", header menu item, route `/inventory` → `/inventory/form`

### Component — `features/inventory/inventory.component.ts`
- **Select mode** — three cards: Scan Item / Add New Item / View Inventory
- **Scan** — in-app ZXing scanner (`QrScannerService`), extracts token from URL
- **Deep link** — reads `?scan={token}` query param on init, auto-opens scan-result
- **New** — `ReactiveFormComponent`, submitter auto-populated from `UserSetupService`
- **Scan result** — shows item summary + usage form (checkout/checkin)
- **List** — server-backed active items when logged in & online
- Offline: inventory types fall back localStorage → `data/inventory-types.json` → hardcoded

### Services
- `server-api.service.ts` — `getInventoryTypes`, `submitInventoryItem`, `updateInventoryItem`,
  `recordInventoryUsage`, `getInventoryItemByQr`, `getActiveInventoryItems`
- `submission-orchestrator.service.ts` — `submitInventoryItem`, `updateInventoryItem`,
  `recordInventoryUsage` — all with server → PA → email fallback chain
- `power-automate.service.ts` — `'inventory'` entity type; `PaV2Request.entity` discriminator
- `environment.ts` / `environment.prod.ts` — `paFlowUrls.inventory` (single URL, both lists)

---

## 5. Desktop Frontend (frontend/) — DONE

- `models/inventory/inventory-item.model.ts` — DTO + `toTableColumns()` + `toFormFields()`
- `rf-inventory-page` — type tabs, Audit button, Print Labels button, + New Item, SP sync toolbar
- `rf-inventory-table` — image thumbnails + lightbox, context menu, double-click → detail
- `rf-inventory-form` — reactive form
- `rf-inventory-detail-dialog` — fields, status chips, **QR code canvas**, usage history,
  attachments grid, Print Label button
- `rf-inventory-audit` — dashboard: Overdue / Missing / Most Used
- `rf-inventory-context-menu.service` — View, Edit, Print Label (QR), status changes, delete
- QR/Brady — reuses shared `BradyPrinterModalService` + `QrCodeService` (no LOTO coupling)
- Routes registered in `app.routes.ts` with authGuard + fullAccessGuard

---

## 6. Sync Server Mirror — DONE

- `sync-server` — mirror `InventoryItem` + `InventoryUsage` entities + repositories
- Registered in `ServerEntitySyncService` (SUPPORTED_TYPES, createEntity, getRepository)

---

## 7. Known Gaps / Future Work

- **Native-camera deep link** assumes the PWA URL `pwa.public.url`
  (`https://jacksongeneration.github.io/permits`) — update the property if the PWA moves.
- **PWA "View Inventory"** requires login + online (uses the JWT-secured endpoint).
  No offline item list — only types fall back to static JSON.
- **QR PDF export** for non-Brady printers is not implemented — Brady label printing only.
- **Inventory Usage SP list** sync depends on the single PA flow being built (the
  `usage` branch of the entity Switch).

---

## 8. File Index

### Backend (Java)
```
entities/inventory/InventoryItem.java
entities/inventory/InventoryUsage.java
dto/inventory/InventoryItemDto.java
dto/inventory/InventoryUsageDto.java
dto/pwa/PwaInventoryItemDto.java
dto/pwa/PwaInventoryUsageDto.java
repository/inventory/InventoryItemRepo.java
repository/inventory/InventoryUsageRepo.java
mappers/inventory/InventoryItemMapper.java
mappers/inventory/InventoryUsageMapper.java
sevice/angular/inventory/NgInventoryItemService.java
sevice/angular/inventory/InventoryItemSyncService.java
sevice/angular/inventory/InventoryUsageSyncService.java
sevice/pwa/PwaInventoryItemService.java
controller/angular/inventory/NgInventoryItemController.java
controller/pwa/PwaInventoryItemController.java
sevice/sharepoint/adapters/InventoryItemSharePointAdapter.java
sevice/sharepoint/adapters/InventoryUsageSharePointAdapter.java
sevice/sharepoint/syncables/InventoryItemSharePointSyncable.java
sevice/sharepoint/syncables/InventoryUsageSharePointSyncable.java
config/InventoryValueSeeder.java
```

### Modified Backend Files
```
clients/PowerAutomateV2Client.java — inventory() (single flow, entity-routed)
dto/pa/PaRequestDto.java — entity discriminator field
sevice/sharepoint/SharePointListProvisioner.java — "Inventory" + "Inventory Usage" lists
sevice/sync/EntityTableRegistry.java — InventoryItem + InventoryUsage
sevice/ServiceFacade.java — both sync services registered
sevice/angular/permits/WorkAreaGitHubPublisher.java — INVENTORY_TYPES target
sevice/angular/NgValueService.java — InventoryType publish trigger
sevice/angular/admin/AdminFunctionalitiesService.java — inventorytypes publish target
controller/pwa/PwaSecuredController.java — /inventory/* secured endpoints
controller/qr/QrTrafficController.java — /qr/inv/{token} deep link
application.properties — pa.flow.inventory-url, pwa.public.url
```

### Desktop Frontend
```
models/inventory/inventory-item.model.ts
features/inventory/refactored/rf-inventory-page/
features/inventory/refactored/rf-inventory-table/
features/inventory/refactored/rf-inventory-form/
features/inventory/refactored/rf-inventory-detail-dialog/
features/inventory/refactored/rf-inventory-audit/
features/inventory/refactored/services/
routes/inventory.routes.ts
app.routes.ts — INVENTORY_ROUTES
models/ui/navigation-card.model.ts — Inventory card
models/ui/router-menu.model.ts — Inventory menu item
pages/admin/tabs/admin-sync.component.ts — Sync Inventory Types button
services/admin/admin-functionalities.service.ts — publishPwaData signature
```

### PWA Frontend (browser/ng-ui)
```
features/inventory/inventory.component.ts
pages/inventory-page/inventory-page.component.ts
models/inventory/inventory-item.model.ts
services/server-api.service.ts — inventory methods
services/submission-orchestrator.service.ts — submit/update/recordUsage + PA fallbacks
services/power-automate.service.ts — inventory entity type + PaV2Request.entity
app.routes.ts — inventory route
pages/home-page/home-page.component.ts — Inventory card
models/menu/router-menu.model.ts — Inventory menu
environments/environment.ts + environment.prod.ts — paFlowUrls.inventory
public/data/inventory-types.json — offline fallback placeholder
```

### Sync Server
```
entity/domain/InventoryItem.java
entity/domain/InventoryUsage.java
repository/domain/InventoryItemRepository.java
repository/domain/InventoryUsageRepository.java
service/ServerEntitySyncService.java — registered
```

### Documentation
```
project/features/inventory/inventory.md — architecture overview
project/features/inventory/inventory-e2e.md — this file
project/architecture/sharepoint/pa-flow-setup-inventory.md — both PA flow guides
```
