# Functionality:
User can configure a zero energy verification method for each LOTO point. A zero energy method is a phrase template (e.g. "Verify that [tag1] is open and [tag2] shows zero pressure") with equipment placeholders that get substituted with actual equipment tag numbers.

The system uses a **deduplication pattern**: identical zero energy combinations (same template + same equipment) are stored once and shared across multiple LOTO points.

Key concepts:
- **ZeroEnergyTemplate** - A Value entity storing the phrase with `[tag#]` placeholders (JSON in the `alias` field)
- **ZeroEnergy** - An entity linking a template to specific equipment IDs, with the resolved method string persisted
- **Phrase Builder** - Frontend component for creating/editing templates and previewing equipment substitutions
- **Clipboard** - Stores previously used template + equipment combinations for quick reuse

## Data Model

### ZeroEnergy Entity
[ZeroEnergy.java](../../../src/main/java/com/dk_power/power_plant_java/entities/loto/ZeroEnergy.java)
- `zeroEnergyTemplate` (Value, @ManyToOne) - The phrase template (line 21-23)
- `templateEquipmentIds` (String, TEXT) - Comma-separated, sorted equipment IDs: "123,456,789" (line 25-26)
- `method` (String, TEXT) - Resolved phrase with equipment tag numbers substituted (line 28-29)
- `getSignature()` - Deduplication key: "templateId|equipmentIds" (line 119-124)
- `setNormalizedEquipmentIds()` - Filters nulls/zeros, sorts for consistent storage (line 100-111)

### ZeroEnergyTemplate (Value entity)
[Value.java](../../../src/main/java/com/dk_power/power_plant_java/entities/categories/Value.java)
- Category: "Zero Energy Template" (alias: `zeroEnergyTemplate`)
- `name` - Human-readable phrase name (e.g. "Valve Open Verification")
- `alias` - JSON containing phrase segments and raw text:
```json
{
  "segments": [
    { "type": "text", "content": "Verify that " },
    { "type": "placeholder", "content": "tag1", "placeholderIndex": 0 },
    { "type": "text", "content": " is open and " },
    { "type": "placeholder", "content": "tag2", "placeholderIndex": 1 },
    { "type": "text", "content": " shows zero pressure" }
  ],
  "rawText": "Verify that [tag1] is open and [tag2] shows zero pressure"
}
```

### LotoPoint relationship
[LotoPoint.java](../../../src/main/java/com/dk_power/power_plant_java/entities/loto/LotoPoint.java)
- `zeroEnergy` (ZeroEnergy, @ManyToOne, line 74-75) - Many LotoPoints can share one ZeroEnergy
- `zeroEnergyMethod` (String, TEXT, line 70-71) - Legacy field (deprecated, kept for backward compatibility)

## Backend

### DTOs
[ZeroEnergyDto.java](../../../src/main/java/com/dk_power/power_plant_java/dto/permits/zero_energy/ZeroEnergyDto.java) - Full object references
- `method` (String) - Resolved method string
- `zeroEnergyTemplate` (ValueDto) - Full template object with name/alias
- `templateEquipment` (List<EquipmentDto>) - Full equipment objects (loaded by mapper)
- `templateEquipmentIds` (List<Long>) - Equipment IDs

[ZeroEnergyIdDto.java](../../../src/main/java/com/dk_power/power_plant_java/dto/permits/zero_energy/ZeroEnergyIdDto.java) - ID references only (used for API updates)
- `method` (String)
- `zeroEnergyTemplateId` (Long)
- `templateEquipmentIds` (List<Long>)

### Mapper
[ZeroEnergyMapper.java](../../../src/main/java/com/dk_power/power_plant_java/mappers/ZeroEnergyMapper.java)

Key methods:
- `convertToDto(ZeroEnergy)` (line 42) - Entity to full DTO, loads EquipmentDto objects for each equipment ID
- `convertToIdDto(ZeroEnergy)` (line 95) - Entity to ID-only DTO
- `convertToEntity(ZeroEnergyDto)` (line 223) - DTO to entity, calls `buildResolvedMethod()`
- `convertIdDtoToEntity(ZeroEnergyIdDto)` (line 289) - ID DTO to entity, calls `buildResolvedMethod()`
- `convertToEntityWithDeduplication(ZeroEnergyDto)` (line 276) - Recommended: delegates to `findOrCreate()`
- `buildResolvedMethod(ZeroEnergy)` (line 140) - Parses JSON segments from template alias, substitutes `[tag#]` placeholders with actual equipment tag numbers from DB

### Service
[NgZeroEnergyService.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/angular/loto/NgZeroEnergyService.java)

Core deduplication:
- `findOrCreate(ZeroEnergyIdDto)` (line 129) - Find existing or create new ZeroEnergy
  1. Extract templateId and equipment IDs from DTO
  2. Normalize equipment IDs (remove nulls/zeros, sort, join as comma-separated string)
  3. Query `findByTemplateAndEquipmentIds()` for existing match
  4. If found: return existing (reuse). If method is null on legacy record, regenerate it.
  5. If not found: create new via mapper and save
- `findOrCreate(ZeroEnergyDto)` (line 260) - Same pattern with full DTO

Counterpart unit support:
- `createCounterpartZeroEnergy(ZeroEnergyIdDto, sourceUnit)` (line 509) - Creates zero energy for the other unit (01 -> 02 or vice versa)
- `lookupCounterpartEquipment(List<Long>, sourceUnit)` (line 403) - Maps equipment to other unit via LOTO point counterpart chain:
  1. Find equipment -> get first LOTO point -> find counterpart LOTO point -> get first equipment

Admin utilities:
- `migrateMethodFields()` (line 369) - Populates method field for legacy records
- `cleanupOrphans()` (line 358) - Deletes ZeroEnergy items not referenced by any LotoPoint

[ZeroEnergyServiceImpl.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/loto/zero_energy/ZeroEnergyServiceImpl.java)
- Implements `ZeroEnergyService` interface
- Contains duplicate of `findOrCreate()` logic (both service classes can perform deduplication)

### Repository
[ZeroEnergyRepo.java](../../../src/main/java/com/dk_power/power_plant_java/repository/loto/ZeroEnergyRepo.java)
- `findByTemplateAndEquipmentIds(Long templateId, String equipmentIds)` (line 22-30) - Core deduplication query. Matches on template ID AND exact comma-separated equipment ID string. Handles null template and empty equipment.
- `findOrphans()` (line 37-39) - ZeroEnergy items with no LotoPoint references
- `deleteOrphans()` (line 46-49) - Bulk delete orphans

### LotoPoint save flow
[LotoPointMapper.java](../../../src/main/java/com/dk_power/power_plant_java/mappers/LotoPointMapper.java) (lines 313-328)

When saving a LotoPoint with zero energy:
1. Client sends `LotoPointIdDto` with nested `zeroEnergy: { zeroEnergyTemplateId, templateEquipmentIds }`
2. `convertIdDtoToEntity()` checks:
   - If `dto.getZeroEnergy() != null` -> calls `zeroEnergyService.findOrCreate(dto.getZeroEnergy())` (deduplication)
   - Else if `dto.getZeroEnergyId() != null` -> loads existing by ID

## Sync Server

[LotoPoint.java (sync)](../../../sync-server/src/main/java/com/dk_power/sync_server/entity/domain/LotoPoint.java)
- `zeroEnergy` (ZeroEnergy, @ManyToOne, line 74-75) - Same relationship as main server
- `zeroEnergyMethod` (String, TEXT, line 71) - Legacy field

## Frontend Models

[zero-energy.model.ts](../../../frontend/src/app/models/loto/zero-energy.model.ts)
- `ZeroEnergyModel` interface: `method`, `zeroEnergyTemplate` (ValueModel), `templateEquipment` (EquipmentModel[]), `templateEquipmentIds` (number[])
- `ZeroEnergyIdModel` interface: `method`, `zeroEnergyTemplateId` (number), `templateEquipmentIds` (number[])
- `ZeroEnergyDto` class: implements ZeroEnergyModel with constructor that handles type coercion (ValueDto from number or object)

[zero-energy-phrase-clipboard.model.ts](../../../frontend/src/app/models/loto/zero-energy-phrase-clipboard.model.ts)
- `ZeroEnergyPhraseClipboardItem` class: stores `zeroEnergyTemplate` ({id, name}), `templateEquipment` (any[]), `templateEquipmentIds` (number[])

[loto-point.model.ts](../../../frontend/src/app/models/loto/loto-point.model.ts)
- `zeroEnergy: ZeroEnergyModel | null` on LotoPointModel interface and LotoPointDto class
- `toIdModel()` extracts: `zeroEnergy: { id, zeroEnergyTemplateId, templateEquipmentIds }` (line 694-706)

## Frontend Phrase Builder Component

[zero-energy-phrase-builder.component.ts](../../../frontend/src/app/shared/reactive-form/refactored/input-fields/zero-energy-phrase-builder/zero-energy-phrase-builder.component.ts)

### Inputs (Angular 19 signal-based):
- `label` (string) - Component label, default "Zero Energy Phrase"
- `categoryAlias` (string) - Value category for phrase storage, default "zeroEnergyTemplate"
- `canManageValues` (boolean) - Allow CRUD on phrases, default true
- `selectedEquipment` (any[]) - Equipment items for placeholder substitution
- `initialPhraseId` (number | null) - Pre-select a phrase on load

### Outputs:
- `clipboardItemSelected` - Emitted when clipboard item is clicked (phraseId, templateEquipment, templateEquipmentIds)
- `placeholderCountChange` - Emitted when placeholder count changes

### ControlValueAccessor:
Implements Angular's ControlValueAccessor to work with reactive forms. The form control value is the selected phrase ID (number).

### Template sections:

1. **Dropdown** - Uses `app-searchable-select-input` to select from existing phrases. Options show phrase names with preview.

2. **Phrase Preview** - Shows selected phrase with real-time equipment substitution:
   - Text segments rendered as plain text
   - Unfilled placeholders shown in purple gradient (`[tag1]`)
   - Filled placeholders shown in green gradient with equipment tag number

3. **Action Buttons** - Edit (opens phrase dialog) and Delete (opens confirmation with optional transfer)

4. **Clipboard** - Stores/recalls previous template + equipment combinations. Initial selection marked with "[Initial]". Click to restore both phrase and equipment.

5. **Add/Edit Phrase Dialog** - Modal for creating/editing phrases:
   - Phrase name input
   - Textarea with `[tag#]` placeholder syntax
   - "Add Tag Placeholder" button inserts `[tagN]` at cursor position
   - Live preview showing parsed segments with highlighted placeholders

6. **Delete Confirmation Dialog** - Confirms deletion with optional transfer of references to another phrase

### Phrase parsing:
Regex `/\[([^\]]+)\]/g` splits text into segments:
- `{ type: 'text', content: '...' }` - Plain text
- `{ type: 'placeholder', content: 'tag1', placeholderIndex: 0 }` - Equipment placeholder

### Equipment substitution priority:
1. LOTO point tag number from equipment's first LOTO point
2. Equipment's direct tagNumber property
3. Equipment's tag field
4. Fallback: "Equipment #ID" or "Equipment N"

### Phrase storage:
Phrases are stored as Value entities. The alias field contains JSON with segments and rawText. CRUD operations use the Value service API (`createValue`, `updateValue`).

## Frontend Form Integration

[rf-loto-point-mapper.service.ts](../../../frontend/src/app/features/loto-points/refactored/services/rf-loto-point-mapper.service.ts)

The zero energy form field is defined as a **group** containing two sub-fields:
```
zeroEnergy (group)
  +-- zeroEnergyTemplate (zero-energy-phrase-builder) - Phrase selection/management
  +-- templateEquipment (equipment-list-manager) - Equipment assignment for placeholders
```

[form-group-input.component.ts](../../../frontend/src/app/shared/reactive-form/refactored/input-fields/form-group-input/form-group-input.component.ts)
renders the phrase builder and passes `selectedEquipment` from the sibling `templateEquipment` field. Clipboard paste events update both fields simultaneously via `onZeroEnergyClipboardPaste()`.

### Data submission:
`toIdModel()` in LotoPointDto extracts zero energy data as:
```typescript
{
  id: zeroEnergy.id || null,
  zeroEnergyTemplateId: zeroEnergy.zeroEnergyTemplate?.id || null,
  templateEquipmentIds: zeroEnergy.templateEquipment?.map(eq => eq.id) || []
}
```
This is sent to the backend where `findOrCreate()` handles deduplication.

## Edit for All (Shared Edit)

### Concept
By default, editing zero energy in the loto point form only affects that loto point — it uses find-or-create deduplication to either reuse an existing ZeroEnergy record or create a new one. The **"Edit for All"** feature allows the user to edit the actual shared ZeroEnergy record in-place, so the change propagates to all LotoPoints that reference it.

### UX Flow
1. When a loto point form has an existing ZeroEnergy (with an ID), an **"Edit for All"** button appears next to the "Zero Energy" group label
2. Clicking it fetches the usage count from the backend (`GET /ng/loto-points/zero-energy/{id}/usage-count`)
3. A confirmation dialog shows: "This zero energy is shared by N LOTO points. Changes will affect all of them. Continue?"
4. If confirmed, the button highlights as "Editing for All" and a hidden `editShared` FormControl is set to `true`
5. The user modifies template/equipment as normal
6. On form save, `editShared: true` is included in the API payload
7. The button can be toggled off to revert to default find-or-create behavior

### Backend Flow
[NgZeroEnergyService.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/angular/loto/NgZeroEnergyService.java)
- `updateShared(ZeroEnergyIdDto)` - Updates the existing ZeroEnergy record in-place:
  1. Load existing ZeroEnergy by ID
  2. Normalize new template ID and equipment IDs
  3. Check for deduplication conflict: if the new combination matches another existing ZeroEnergy, merge (reassign all referencing LotoPoints to the match via `lotoPointRepo.reassignZeroEnergy()`, delete the old record)
  4. If no conflict: update template, equipment, rebuild method string, save

[LotoPointMapper.java](../../../src/main/java/com/dk_power/power_plant_java/mappers/LotoPointMapper.java)
- In `convertIdDtoToEntity()`, checks `dto.getZeroEnergy().getEditShared()`:
  - If `true` and ID is set → calls `zeroEnergyService.updateShared()`
  - Otherwise → calls `zeroEnergyService.findOrCreate()` (default behavior)

### Frontend Implementation
[form-group-input.component.ts](../../../frontend/src/app/shared/reactive-form/refactored/input-fields/form-group-input/form-group-input.component.ts)
- `context` input receives `zeroEnergyId` from the field definition
- `editSharedEnabled` signal tracks toggle state
- `onEditForAllClick()` fetches usage count, shows confirmation, sets hidden `editShared` FormControl

[rf-loto-point-mapper.service.ts](../../../frontend/src/app/features/loto-points/refactored/services/rf-loto-point-mapper.service.ts)
- Zero energy group field includes `context: { zeroEnergyId }` and a hidden `editShared` sub-field
- `toApiModel()` passes `editShared` flag to the API payload

### Data Flow
```
User clicks "Edit for All" → confirm(count) → editShared FormControl = true
  ↓
Form submit → toApiModel() includes editShared: true
  ↓
Backend LotoPointMapper → dto.getZeroEnergy().getEditShared() == true
  ↓
NgZeroEnergyService.updateShared() → update in-place OR merge with duplicate
  ↓
All LotoPoints sharing this ZeroEnergy now see updated template/equipment/method
```

## Key Design Patterns

1. **Deduplication** - Same template + equipment combination stored once, shared across LotoPoints. Signature: `"templateId|sortedEquipmentIds"`. Repository query matches exact comma-separated string.

2. **Method Resolution** - Template JSON parsed, `[tag#]` placeholders replaced with equipment tag numbers. Resolved string persisted in `method` field for quick retrieval without re-parsing.

3. **Dual DTO** - `ZeroEnergyDto` (full objects for views) and `ZeroEnergyIdDto` (IDs only for API updates). Reduces payload size on saves.

4. **Normalized Storage** - Equipment IDs sorted and deduplicated before storage. Ensures `[1,2,3]` and `[3,1,2]` match the same ZeroEnergy record.

5. **Counterpart Mapping** - Equipment mapped between units (01 <-> 02) via LOTO point counterpart chain for dual-unit plants.
