# LOTO Point Characteristics & Engraver Info Layout — Verification Prompt

Copy and paste this prompt to Claude to verify the implementation is complete and correct.

---

## Prompt

```
Review the LOTO point characteristics and engraver info layout feature. Check the following end-to-end flow and report any issues, missing pieces, or broken connections:

## 1. Entity & Backend Stack
Read these files and verify:
- `src/main/java/com/dk_power/power_plant_java/entities/loto/LotoPoint.java` — has `characteristicsJson` field with @Column(columnDefinition = "TEXT"), existing `normalPosition` and `fluid` fields still present, NO `normalPressure` or `normalTemperature` fields
- `src/main/java/com/dk_power/power_plant_java/dto/permits/loto_point/LotoPointDto.java` — has `characteristicsJson` (String), has `fluid` (uncommented), NO `normalPressure`/`normalTemperature`
- `src/main/java/com/dk_power/power_plant_java/dto/permits/loto_point/LotoPointIdDto.java` — has `characteristicsJson` (String), NO `fluid`/`normalPressure`/`normalTemperature`
- `src/main/java/com/dk_power/power_plant_java/mappers/LotoPointMapper.java` — `characteristicsJson` mapped in all 4 conversion methods (convertToDto from entity, convertToDto from IdDto, convertToEntity, convertIdDtoToEntity) AND in toIdDto. `fluid` mapped (uncommented). NO references to `normalPressure`/`normalTemperature`

## 2. Frontend Model
Read these files and verify:
- `frontend/src/app/models/loto/loto-point.model.ts`:
  - `LotoPointCharacteristic` interface exported with `characteristicId: number`, `name: string`, `value: string`
  - `LotoPointModel` interface has `characteristicsJson: string | null` and `fluid: string | null`, NO `normalPressure`/`normalTemperature`
  - `LotoPointDto` class has `characteristicsJson` in: field declaration, constructor, toJson(), fromJson(), toIdModel(), isValidKey()
  - NO `normalPressure`/`normalTemperature` anywhere in the file
- `frontend/src/app/models/loto/loto-point-id.model.ts` — has `characteristicsJson: string | null`, NO `fluid`/`normalPressure`/`normalTemperature` in field declarations, constructor, toJson(), fromJson()
- `frontend/src/app/models/loto/loto-point-clipboard.model.ts` — `fluid` and `characteristicsJson` are in the Omit list of `ILotoPointClipboard`, NO `normalPressure`/`normalTemperature` fields on the class

## 3. Characteristics Editor Component
Read these files and verify:
- `frontend/src/app/shared/reactive-form/refactored/input-fields/characteristics-editor/characteristics-editor.component.ts`:
  - Implements ControlValueAccessor
  - Uses `signal<LotoPointCharacteristic[]>` for internal state
  - `writeValue()` parses JSON string to array, handles null/empty/invalid
  - `addCharacteristic()` adds `{ characteristicId: 0, name: '', value: '' }`
  - `removeCharacteristic(index)` splices array
  - `onCharacteristicSelected(index, valueDto)` sets characteristicId + name from RfValueDto
  - `onValueChanged(index, event)` updates value from input
  - `emitChange()` serializes to JSON string and calls onChange
  - Imports `RfValueSelectComponent` and `FormsModule`
- `frontend/src/app/shared/reactive-form/refactored/input-fields/characteristics-editor/characteristics-editor.component.html`:
  - Renders rows with `app-rf-value-select` (categoryAlias, canManageValues=true, ngModel, valueSelected output)
  - Text input for value
  - Remove button per row
  - Add button at bottom
- `frontend/src/app/shared/reactive-form/refactored/input-fields/characteristics-editor/characteristics-editor.component.css` — dark theme styling

## 4. Form Integration
Read these files and verify:
- `frontend/src/app/models/ui/form-field.model.ts` — `'characteristics-editor'` is in the RfFormField type union
- `frontend/src/app/shared/reactive-form/refactored/reactive-form/rf-reactive-form.component.ts` — imports `CharacteristicsEditorComponent`, includes it in imports array
- `frontend/src/app/shared/reactive-form/refactored/reactive-form/rf-reactive-form.component.html` — has `@case('characteristics-editor')` block passing formControl, label, categoryAlias
- `frontend/src/app/features/loto-points/refactored/services/rf-loto-point-mapper.service.ts`:
  - `'characteristicsJson'` is in the default fields list of `toFormFields()`
  - `characteristicsJson` entry in `allFields` with type `'characteristics-editor'`, categoryAlias `'equipmentCharacteristic'`, initialValue from `lotoPoint.characteristicsJson || '[]'`
  - NO `fluid`, `normalPressure`, `normalTemperature` in default fields list or allFields

## 5. Engraver Backend
Read these files and verify:
- `src/main/java/com/dk_power/power_plant_java/sevice/angular/engraver/EngraverService.java`:
  - Original `generateCsvForBatch(batch, withQr)` method unchanged — 12 columns, no extra columns appended
  - New overloaded `generateCsvForBatch(batch, withQr, characteristicNames)` method:
    - If characteristicNames is null/empty, delegates to original method
    - Otherwise: generates CSV with standard 12 columns + N extra columns (one per characteristic name)
    - Uses `ObjectMapper` to parse `characteristicsJson` from each LotoPoint
    - `getCharacteristicValues()` helper builds a name→value map from JSON, returns values in order of characteristicNames
  - Imports `com.fasterxml.jackson.core.type.TypeReference` and `com.fasterxml.jackson.databind.ObjectMapper`
- `src/main/java/com/dk_power/power_plant_java/controller/angular/engraver/EngraverController.java`:
  - `processBatch` accepts `@RequestParam(required = false) List<String> characteristicNames` and `@RequestParam(defaultValue = "standard") String layoutVersion`
  - Calls the overloaded service method when characteristicNames is non-empty, otherwise calls the original

## 6. Engraver Frontend
Read these files and verify:
- `frontend/src/app/shared/engraver-manager/engraver-api.service.ts`:
  - `processBatch()` accepts `characteristicNames: string[]` parameter (default `[]`)
  - Appends `characteristicNames` as repeated query params when non-empty
- `frontend/src/app/shared/engraver-manager/engraver-modal.service.ts`:
  - Has `layoutVersion` signal (`'standard' | 'info'`)
  - Has `selectedCharacteristicNames` signal (string[]) and `maxEngraveCharacteristics = 4`
  - `availableCharacteristicNames` computed signal — collects unique names from all items' characteristicsJson
  - `toggleLayoutVersion()` — toggles and auto-selects first N characteristics when switching to info
  - `toggleCharacteristicName(name)` — adds/removes from selection, respects max limit
  - `parseCharacteristics(json)` — helper to parse JSON to LotoPointCharacteristic[]
  - All signals reset on `close()`
- `frontend/src/app/shared/engraver-manager/engraver-manager.component.ts`:
  - `toggleLayoutVersion()` delegates to modal service
  - `getCharacteristicValue(item, name)` — looks up characteristic value by name from item's characteristicsJson
  - `processBatch()` passes `characteristicNames` to API when layoutVersion is 'info'
- `frontend/src/app/shared/engraver-manager/engraver-manager.component.html`:
  - Layout version toggle button (Standard / Info)
  - Characteristic picker section (checkboxes, only visible when info layout active, max limit enforced, "no characteristics" message when empty)
  - Batch items table: info layout shows dynamic columns from selectedCharacteristicNames, standard shows Description
  - Tag preview: info layout shows QR + dynamic characteristic values using tag-info-N classes, standard shows QR + description lines
  - Empty row colspan adjusts based on layout version and selected characteristic count
- `frontend/src/app/shared/engraver-manager/engraver-manager.component.css`:
  - `.tag-info-1` through `.tag-info-4` positioning styles
  - 2x1 tag overrides for info classes
  - `.char-picker-list`, `.char-picker-item`, `.no-chars-msg` styles

## 7. Report
For each section above, report:
- ✅ if correct
- ⚠️ if minor issue (works but could be improved)
- ❌ if broken/missing (prevents feature from working)

Include specific file paths and line numbers for any issues found.
```
