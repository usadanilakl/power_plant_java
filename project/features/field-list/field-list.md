# Field Lists

## Overview

Field Lists is a generic, type-discriminated tracking system for field observations. A single entity (`FieldListItem`) and a single SharePoint list (`Field Lists`) back all list types, distinguished by a `ListType` column (Value category).

**Current list types:** Insulation Removal, Leaks, Winterization. New types are added by creating a Value in the "FieldListType" category — no code changes required.

## Data Flow

```
PWA (ng-ui) ──POST /api/pwa/field-list-item/submit──▶ Hub
  │                                                      ├─ Save to H2 (local first)
  │                                                      ├─ Try SP: cert → PA V2 fallback
  │                                                      └─ Return PwaSubmissionResult
  │
  └──(if hub offline)── PA flow direct to SP list ──▶ SharePoint "Field Lists"

Hub ──SharePointSyncOrchestrator (60s)──▶ Poll SP "Field Lists"
  ├─ Field-level LWW merge
  └─ Broadcast via SSE to desktops

Desktop ──Angular UI──▶ /ng/field-list-items/* ──▶ NgFieldListItemService
  ├─ CRUD operations
  ├─ Filter by listType
  └─ SP Sync Toolbar for manual sync/verify
```

## Entity Design

`FieldListItem` extends `BaseAuditEntity` (inherits id, deleted, dateCreated/Modified, createdBy/modifiedBy, sync tracking via FieldChangeEntityListener).

### Fields

| Field | Type | Description |
|-------|------|-------------|
| listType | ManyToOne → Value | Category "FieldListType" (Insulation Removal, Leaks, Winterization) |
| status | ManyToOne → Value | Category "FieldListStatus" (Open, In Progress, Resolved, Closed) |
| location | ManyToOne → Value | Existing "Location" category |
| specificLocation | String | Free-text location detail |
| title | String | Brief description |
| notes | TEXT | Detailed notes |
| dateObserved | String | Date of observation |
| timeObserved | String | Time of observation |
| equipment | ManyToOne → Equipment | Optional equipment reference |
| lotoPoint | ManyToOne → LotoPoint | Optional loto point reference |
| sharepointId | String | SP list item ID |
| localUuid | String | PWA dedup ID |
| spModifiedTime | Instant | SP Modified timestamp for LWW |
| submitterName/Email/Phone | String | PWA submitter contact info |

### Equipment/LotoPoint Resolution

The UI presents a **single search field**. Backend resolves:
1. Search **LotoPoint** by tag — if found, set lotoPoint + equipment (from linked equipment)
2. If no LotoPoint, search **Equipment** by tag — set equipment only
3. If neither found, leave both null — user describes in notes

This reflects the data model: all loto points are equipment, not all equipment has loto points.

## Backend Stack

| Layer | File | Path Prefix |
|-------|------|-------------|
| Entity | `entities/field_list/FieldListItem.java` | |
| DTO | `dto/field_list/FieldListItemDto.java` | |
| PWA DTO | `dto/pwa/PwaFieldListItemDto.java` | |
| Repository | `repository/field_list/FieldListItemRepo.java` | |
| Mapper | `mappers/field_list/FieldListItemMapper.java` | |
| Angular Service | `sevice/angular/field_list/NgFieldListItemService.java` | |
| Angular Controller | `controller/angular/field_list/NgFieldListItemController.java` | `/ng/field-list-items` |
| PWA Service | `sevice/pwa/PwaFieldListItemService.java` | |
| PWA Controller | `controller/pwa/PwaFieldListItemController.java` | `/api/pwa/field-list-item` |
| SP Adapter | `sevice/sharepoint/adapters/FieldListItemSharePointAdapter.java` | |
| SP Syncable | `sevice/sharepoint/syncables/FieldListItemSharePointSyncable.java` | |
| Value Seeder | `config/FieldListValueSeeder.java` | |

## Frontend Stack

| Layer | File |
|-------|------|
| Model/DTO | `models/field-list/field-list-item.model.ts` |
| API Service | `features/field-list/refactored/services/rf-field-list-api.service.ts` |
| State Service | `features/field-list/refactored/services/rf-field-list-state.service.ts` |
| Page Component | `features/field-list/refactored/rf-field-list-page/rf-field-list-page.component.ts` |
| Table Component | `features/field-list/refactored/rf-field-list-table/rf-field-list-table.component.ts` |
| Form Component | `features/field-list/refactored/rf-field-list-form/rf-field-list-form.component.ts` |
| Routes | `routes/field-list.routes.ts` |

**Navigation:** Under "Log" group (home page card + header menu), alongside System Log and Instruments.

**Routes:** `/field-lists` (all types), `/field-lists/:listType` (filtered)

## API Endpoints

### Angular (authenticated, desktop)
- `GET /ng/field-list-items/get-all` — All items
- `GET /ng/field-list-items/by-list-type/{listType}` — Filtered by type
- `GET /ng/field-list-items/by-status/{status}` — Filtered by status
- `GET /ng/field-list-items/get-by-id/{id}` — Single item
- `POST /ng/field-list-items` — Create
- `PUT /ng/field-list-items/{id}` — Update
- `DELETE /ng/field-list-items/{id}` — Soft delete

### PWA (CORS-enabled, public)
- `POST /api/pwa/field-list-item/submit` — Submit new item
- `GET /api/pwa/field-list-item/status/{localUuid}` — Check submission status
- `PUT /api/pwa/field-list-item/update` — Update existing
- `GET /api/pwa/field-list-item/list-types` — Available list types
- `GET /api/pwa/field-list-item/health` — Health check

## SharePoint Integration

### List: "Field Lists"

Auto-provisioned via `SharePointListProvisioner` (Admin > SharePoint tab).

| SP Column | Type | Maps From |
|-----------|------|-----------|
| Title | Text (built-in) | title |
| PwaId | Text | localUuid |
| ListType | Text | listType.name |
| Status | Text | status.name |
| Location | Text | location.name |
| SpecificLocation | Text | specificLocation |
| Notes | Note (multi-line) | notes |
| DateObserved | Date and Time | dateObserved + timeObserved (combined, like WR's DateOfWork) |
| EquipmentTag | Text | lotoPoint.tagNumber (preferred) or equipment.tagNumber |
| SubmitterName | Text | submitterName |
| SubmitterEmail | Text | submitterEmail |
| SubmitterPhone | Text | submitterPhone |

### Sync
- Interval: 60 seconds (hub only)
- Auto-discovered by `SharePointSyncOrchestrator` (no registration needed)
- Field-level LWW merge via `SharePointFieldMergeService`
- localUuid binding: if local item has matching localUuid, binds to SP ID on first sync

### Power Automate Fallback
- Flow URL: `pa.flow.field-list-url` in `application-secrets.properties`
- Added to `PowerAutomateV2Client.fieldList()` method
- See `pa-flow-setup-field-list.md` for manual flow creation steps

## Adding New List Types

1. Add a Value to "FieldListType" category via Admin UI or `NgValueService.createValue("FieldListType", "New Type")`
2. Items with the new type automatically appear in the same SP list with `ListType = "New Type"`
3. Frontend list type tabs can be extended in the page component template
4. No backend code changes needed

## Attachments

Uses existing `PermitAttachment` entity with `entityType = "FieldListItem"`. SHA-256 content hash dedup prevents duplicate storage. Attachments are uploaded to SP after item creation.
