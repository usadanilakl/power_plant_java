## Frontend Architecture

### Route

- `/permit-builder/work-areas` → `WorkAreaPageComponent`
- `/permit-builder/work-area-map` → `WorkAreaMapComponent`

### Model

**WorkAreaModel / WorkAreaDto** (`models/permits/work-area.model.ts`)
- Extends `BaseDto` (id, name, dateCreated, dateModified)
- `description` (string | null)
- `areaType` ({ id, name } | null) - area type reference
- `constantHazards` (SwHazards | null) - constant hazards POJO
- `constantLotoIds` (number[]) - LOTO standard IDs
- `shapeId` (number | null) - map shape reference

Static methods:
- `fromJson(json)` - deserializes API response
- `toFormFields(entity)` - generates RfFormField[] for the CRUD form (name, description, areaType value-select, constantHazards checkbox group)
- `toTableColumns()` - generates Column[] for the table (name, description, areaType)
- `getHazardFields(hazards)` - generates 20 hazard checkbox fields in a horizontal group

**WorkAreaMapShapeDto** - interface for map shape data
- id, coordinates, originalPictureSize, label, workAreaIds

**WorkAreaPermitCounts** - interface for overview mode
- workArea (WorkAreaDto), safeWorkCount, hotWorkCount, confinedSpaceCount

### Services

**WorkAreaApiService** (`features/permit-builder/work-area/services/work-area-api.service.ts`)
- `providedIn: 'root'`
- Base URL: `/ng/work-areas`

| Method | Backend Call | Description |
|--------|-------------|-------------|
| `getAll()` | GET `/get-all` | All work areas as WorkAreaDto[] |
| `getById(id)` | GET `/get-by-id/{id}` | Single work area |
| `save(dto)` | POST `/` | Create/update, sends `dto.toJson()` |
| `delete(id)` | DELETE `/{id}` | Soft delete |
| `getByAreaType(typeId)` | GET `/by-area-type/{typeId}` | Filter by type |
| `getWithPermitCounts()` | GET `/with-permit-counts` | Areas with permit counts |
| `getPermitCounts(id)` | GET `/permit-counts/{id}` | Counts for one area |
| `getAllShapes()` | GET shapes `/get-all` | All map shapes |
| `saveShape(dto)` | POST shapes `/` | Save shape |
| `deleteShape(id)` | DELETE shapes `/{id}` | Delete shape |

**WorkAreaStateService** (`features/permit-builder/work-area/services/work-area-state.service.ts`)
- `providedIn: 'root'`
- Follows `RfWorkRequestStateService` pattern
- Signals: `items`, `selectedItem`, `formOpen`, `isLoading`
- Methods: `loadAll()`, `selectItem(id)`, `saveItem(dto)`, `deleteItem(id)`, `openForm(item?)`, `closeForm()`

**WorkAreaMapperService** (`features/permit-builder/work-area/services/work-area-mapper.service.ts`)
- `toFormFields(entity)` - delegates to `WorkAreaDto.toFormFields()`
- `toTableColumns()` - delegates to `WorkAreaDto.toTableColumns()`

### Components

**WorkAreaPageComponent** (`features/permit-builder/work-area/work-area-page.component.ts`)
- CRUD management page following `RfWorkRequestPageComponent` pattern
- Layout: toolbar + searchable/sortable table + form popup
- Table displays: Name, Description, Area Type
- Form includes: Name (required), Description, Area Type (value-select with categoryAlias `workAreaType`), Constant Hazards (20 checkbox fields in horizontal group)

**WorkAreaSelectComponent** (`features/permit-builder/work-area/components/work-area-select/work-area-select.component.ts`)
- Custom form field implementing `ControlValueAccessor`
- Wraps `SearchableSelectInputComponent`
- Loads work area options from `WorkAreaApiService.getAll()`
- Caches options in a signal
- Input: `label` (default: 'Work Area')
- Output: `workAreaSelected` - emits full `WorkAreaDto` on selection (so parent can read constantHazards)
- `refresh()` method to reload options after creating a new area

### Form Field Integration

The `work-area-select` field type is registered in both form systems:

1. **RfReactiveFormComponent** (refactored form) - used by WorkRequest
    - `@case('work-area-select')` renders `WorkAreaSelectComponent` with `[formControl]` binding
    - `(workAreaSelected)` event triggers `onWorkAreaSelected()` for hazard auto-apply

2. **SmartFormComponent** (legacy form) - used by SafeWork, HotWork, ConfinedSpace
    - Same `@case('work-area-select')` pattern
    - Same `onWorkAreaSelected()` handler

The field is added to permit form definitions via each permit's mapper/model:
- WorkRequest mapper: `{ name: 'workArea', label: 'Work Area', type: 'work-area-select' }`
- SafeWork, HotWork, ConfinedSpace models: same field definition in `toFormFields()`

### Form Field Types

Added to `form-field.model.ts`:
- `'work-area-select'` type in both `FormField.type` and `RfFormField.type` unions
