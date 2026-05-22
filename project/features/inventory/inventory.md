# Inventory

## Overview

Inventory is a QR-code-driven asset tracking system for tools, safety equipment, spare
parts and test equipment. Each item gets a unique QR label. Field workers scan the label
from the PWA to check items out and back in, recording who took it and where — so a
missing item can always be traced to its last known holder and location.

It is built on the same architecture as [Field Lists](../field-list/field-list.md):
PWA submission → Server → SharePoint (with PA fallback) → Hub sync → Desktop UI.

**Two entities, two SharePoint lists:**
- `InventoryItem` — the asset (one row per tool/part)
- `InventoryUsage` — one row per checkout/checkin scan event

## Data Flow

```
PWA (ng-ui) ──POST /api/pwa/inventory-item/submit────▶ Hub
  │                                                     ├─ Save to H2 (local first)
  │                                                     ├─ Generate QR token
  │                                                     ├─ Try SP: cert → PA V2 fallback
  │                                                     └─ Return PwaSubmissionResult
  │
  └──scan QR──POST /api/pwa/inventory-item/usage──────▶ Hub
                                                        ├─ Record InventoryUsage
                                                        ├─ Update item status + holder
                                                        └─ Push to SP "Inventory Usage"

Hub ──SharePointSyncOrchestrator (60s)──▶ Poll SP "Inventory" + "Inventory Usage"
  ├─ Field-level LWW merge
  └─ Broadcast via SSE to desktops

Desktop ──Angular UI──▶ /ng/inventory-items/* ──▶ NgInventoryItemService
  ├─ CRUD + status change + usage history
  ├─ QR label printing (Brady)
  └─ Audit dashboard
```

## Entity Design

### InventoryItem (extends BaseAuditEntity)

| Field | Type | Description |
|-------|------|-------------|
| itemType | ManyToOne → Value | Category "InventoryType" (Tools, Safety Equipment, Spare Parts, Test Equipment) |
| status | ManyToOne → Value | Category "InventoryStatus" (Available, Checked Out, Missing, Retired) |
| location | ManyToOne → Value | "Location" category — home location |
| title | String | Item name (e.g. "Fluke 87V Multimeter") |
| serialNumber | String | Manufacturer serial number |
| manufacturer | String | |
| model | String | |
| description | TEXT | Notes, condition, accessories |
| qrToken | String (unique) | Server-generated 12-char token, encoded in the QR label |
| currentLocation | String | Where the item currently is |
| currentHolderName/Email | String | Who has it now (if checked out) |
| lastCheckedOutAt | Instant | Timestamp of most recent checkout |
| sharepointId / localUuid / spModifiedTime | | SP sync fields |
| submitterName/Email/Phone | String | PWA submitter contact info |

### InventoryUsage (extends BaseAuditEntity)

| Field | Type | Description |
|-------|------|-------------|
| inventoryItem | ManyToOne → InventoryItem | The asset this event belongs to |
| userName/userEmail | String | Who scanned |
| location | String | Where it's being taken / returned |
| purpose | String | What it's being used for |
| comments | TEXT | Optional notes |
| scannedAt | Instant | When the scan happened |
| returnedAt | Instant | Optional return timestamp |
| eventType | String | "checkout" or "checkin" |
| sharepointId / localUuid / spModifiedTime | | SP sync fields |

### Status lifecycle

`recordUsage()` updates the item automatically:
- **checkout** → status = "Checked Out", sets currentHolder + currentLocation + lastCheckedOutAt
- **checkin** → status = "Available", clears currentHolder, updates currentLocation

`Missing` and `Retired` are set manually via the desktop UI (context menu / detail dialog).

## QR Code Workflow

1. On first save, the server generates a unique `qrToken` (12-char UUID slice).
2. The QR label encodes `https://<hub>/qr/inv/{qrToken}`.
3. Scanning:
   - **In PWA** (in-app ZXing scanner) — the token is extracted from the URL, item looked up.
   - **Native phone camera** — opens the URL; `QrTrafficController` redirects to
     `<pwa>/inventory/form?scan={token}`; the PWA auto-opens the scan-result view.
4. Desktop prints QR labels via the shared **Brady printer** integration
   (`BradyPrinterModalService`) — single item from context menu, or batch from selection.

## Backend Stack

| Layer | File | Path Prefix |
|-------|------|-------------|
| Entity | `entities/inventory/InventoryItem.java`, `InventoryUsage.java` | |
| DTO | `dto/inventory/InventoryItemDto.java`, `InventoryUsageDto.java` | |
| PWA DTO | `dto/pwa/PwaInventoryItemDto.java`, `PwaInventoryUsageDto.java` | |
| Repository | `repository/inventory/InventoryItemRepo.java`, `InventoryUsageRepo.java` | |
| Mapper | `mappers/inventory/InventoryItemMapper.java`, `InventoryUsageMapper.java` | |
| Angular Service | `sevice/angular/inventory/NgInventoryItemService.java` | |
| Sync Service | `sevice/angular/inventory/InventoryItemSyncService.java`, `InventoryUsageSyncService.java` | |
| Angular Controller | `controller/angular/inventory/NgInventoryItemController.java` | `/ng/inventory-items` |
| PWA Service | `sevice/pwa/PwaInventoryItemService.java` | |
| PWA Controller | `controller/pwa/PwaInventoryItemController.java` | `/api/pwa/inventory-item` |
| SP Adapter | `sevice/sharepoint/adapters/InventoryItemSharePointAdapter.java`, `InventoryUsageSharePointAdapter.java` | |
| SP Syncable | `sevice/sharepoint/syncables/InventoryItemSharePointSyncable.java`, `InventoryUsageSharePointSyncable.java` | |
| Value Seeder | `config/InventoryValueSeeder.java` | |
| QR deep link | `controller/qr/QrTrafficController.java` (`/qr/inv/{token}`) | |

## Frontend Stack (desktop)

| Layer | File |
|-------|------|
| Model/DTO | `models/inventory/inventory-item.model.ts` |
| API Service | `features/inventory/refactored/services/rf-inventory-api.service.ts` |
| State Service | `features/inventory/refactored/services/rf-inventory-state.service.ts` |
| Context Menu | `features/inventory/refactored/services/rf-inventory-context-menu.service.ts` |
| Table Click | `features/inventory/refactored/services/rf-inventory-table-click.service.ts` |
| Page | `features/inventory/refactored/rf-inventory-page/rf-inventory-page.component.ts` |
| Table | `features/inventory/refactored/rf-inventory-table/rf-inventory-table.component.ts` |
| Form | `features/inventory/refactored/rf-inventory-form/rf-inventory-form.component.ts` |
| Detail Dialog | `features/inventory/refactored/rf-inventory-detail-dialog/rf-inventory-detail-dialog.component.ts` |
| Audit Dashboard | `features/inventory/refactored/rf-inventory-audit/rf-inventory-audit.component.ts` |
| Routes | `routes/inventory.routes.ts` |

**Navigation:** "Inventory" card in the Log group + header menu.
**Routes:** `/inventory`, `/inventory/audit`, `/inventory/:type`.

## API Endpoints

### Angular (authenticated, desktop) — `/ng/inventory-items`
- `GET /get-all`, `GET /by-type/{type}`, `GET /by-status/{status}`
- `GET /get-by-id/{id}`, `GET /by-qr/{qrToken}`
- `POST /` (create), `PUT /{id}` (update), `DELETE /{id}` (soft delete)
- `POST /{id}/change-status/{status}`
- `GET /{id}/usage`, `POST /{id}/usage`
- `GET /{id}/attachments`, `POST /{id}/attachments`, `DELETE /{id}/attachments/{attachmentId}`
- `GET /audit/checked-out?minDaysOut=30`, `GET /audit/missing`

### PWA (CORS-enabled, public) — `/api/pwa/inventory-item`
- `POST /submit`, `PUT /update`, `POST /usage`
- `GET /by-qr/{qrToken}`, `GET /status/{localUuid}`, `GET /types`, `GET /health`

### PWA (JWT-secured) — `/api/pwa/secured/inventory`
- `GET /active-items?type=...`, `GET /by-qr/{qrToken}`, `GET /{id}/usage`

## SharePoint Integration

### Lists
- **"Inventory"** — 15 columns (auto-provisioned via Admin > SharePoint)
- **"Inventory Usage"** — 11 columns (auto-provisioned)

### Sync
- 60-second interval, hub only, auto-discovered by `SharePointSyncOrchestrator`
- Field-level LWW merge via `SharePointFieldMergeService`
- localUuid binding: PWA-created records bind to SP ID on first sync

### Power Automate Fallback
- `pa.flow.inventory-url` in `application.properties` — one flow serves both lists
- The request carries an `entity` field (`"item"` | `"usage"`) routing to the right list
- See `project/architecture/sharepoint/pa-flow-setup-inventory.md`

## GitHub Pages Publishing

- `inventory-types.json` published to `browser/ng-ui/public/data/` and the GitHub repo
- Triggered on InventoryType Value change, or manually via Admin > Sync > "Sync Inventory Types"
- PWA falls back to this static file when the server is offline

## Audit Dashboard

Desktop page at `/inventory/audit` (Audit button on the inventory page) showing three panels:
- **Overdue** — items checked out longer than a configurable threshold (7/14/30/60/90 days)
- **Missing** — items with status "Missing"
- **Most Used** — items ranked by usage count

## Adding New Item Types

1. Add a Value to "InventoryType" category via Admin UI
2. Items with the new type automatically work — no code changes
3. Frontend type tabs in the page component template can be extended if desired
