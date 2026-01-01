# LOTO Standard Refactored Implementation Summary

This document summarizes the refactored LOTO Standard implementation following the established LOTO Point pattern.

## Directory Structure

```
frontend/src/app/features/loto-standard/refactored/
├── services/
│   ├── rf-loto-standard-api.service.ts          # HTTP API service
│   ├── rf-loto-standard-mapper.service.ts       # DTO ↔ UI mapping service
│   ├── rf-loto-standard-state.service.ts        # State management with signals
│   └── rf-loto-standard-local-storage.service.ts # Draft persistence
│
├── rf-loto-standard-table/
│   ├── rf-loto-standard-table.component.ts      # Table wrapper component
│   ├── rf-loto-standard-table.component.html
│   ├── rf-loto-standard-table.component.css
│   ├── rf-loto-standard-click.service.ts        # Click event handling
│   └── rf-loto-standard-table-control.service.ts # Table control buttons
│
├── rf-loto-standard-form/
│   ├── rf-loto-standard-form.component.ts       # Form component
│   ├── rf-loto-standard-form.component.html
│   └── rf-loto-standard-form.component.css
│
└── rf-loto-standard-page/
    ├── rf-loto-standard-page.component.ts       # Page container
    ├── rf-loto-standard-page.component.html
    ├── rf-loto-standard-page.component.css
    └── rf-loto-standard-main-table-view.component.ts # Main table view
```

## Implemented Components

### 1. Services Layer

#### **RfLotoStandardApiService**
- **Location:** `services/rf-loto-standard-api.service.ts`
- **Purpose:** All HTTP communication with backend
- **Key Methods:**
  - `getLotoStandards(page, pageSize)` - Paginated fetch
  - `searchLotoStandards(criteria, pageSize)` - Search with filters
  - `getLotoStandardById(id)` - Fetch single item
  - `saveLotoStandard(item)` - Create/update
  - `deleteLotoStandard(id)` - Delete
  - `getFilteredUniqueValuesOfColumn(column, criteria, page, pageSize)` - Dropdown options
  - `getGroupedLotoStandards(groupBy)` - For menu grouping (future)

#### **LotoStandardMapperService**
- **Location:** `services/rf-loto-standard-mapper.service.ts`
- **Purpose:** Bidirectional transformation between DTOs and UI models
- **Key Methods:**
  - `toTableColumns(fields)` - Maps DTO fields to Column definitions
  - `toFormFields(lotoStandard, fields)` - Maps DTO to RfFormField[]
  - `isValid(lotoStandard)` - Validation logic
  - `getValidationErrors(lotoStandard)` - Detailed error messages
  - `toApiModel(formData)` - Converts form data back to API format

#### **RfLotoStandardStateService**
- **Location:** `services/rf-loto-standard-state.service.ts`
- **Purpose:** Centralized state management using signals and BehaviorSubjects
- **State Signals:**
  - `selectedItem` - Currently open item in form
  - `selectedItems` - Multi-selected items in table
  - `filterOutItems` - Items to exclude/highlight
  - `currentColumnUniqueItems` - Dropdown options for column filters
  - `loadingUniqueItems` - Loading state for dropdown data
  - `isLotoStandardFormOpen` - Form visibility
  - `formFields` - Fields to display in form
- **State Observables:**
  - `allLoadedLotoStandards$` - All items loaded so far
  - `currentSearchCriteria$` - Active search/filter state
  - `currentSortColumn$` / `currentSortDirection$` - Sort state
- **Key Methods:**
  - `loadItemById(id)` - Fetch full item from server
  - `submitForm(item)` - Save to API and clear draft
  - `saveDraft(item)` - Persist form state to localStorage
  - `loadDraftForItem(id)` - Restore draft from localStorage
  - `loadUniqueItems(column, searchString)` - Fetch dropdown options
  - `openForm(fields)` / `closeForm()` - Form visibility control

#### **LotoStandardLocalStorageService**
- **Location:** `services/rf-loto-standard-local-storage.service.ts`
- **Purpose:** Draft management for unsaved forms
- **Key Methods:**
  - `saveDraft(item)` - Save form state with timestamp
  - `loadDraft(id)` - Retrieve draft for item
  - `clearDraft(id)` - Delete draft
  - `hasDraft(id)` - Check if draft exists

### 2. Table Components

#### **RfLotoStandardTableComponent**
- **Location:** `rf-loto-standard-table/rf-loto-standard-table.component.ts`
- **Purpose:** Wrapper around shared TableComponent with LOTO Standard-specific logic
- **Inputs:**
  - `tableId` - Unique identifier
  - `inputItems` - For isolated tables
  - `isTableIsolated` - Toggle between local and DB filtering
  - `fieldsToDisplay` - Which columns to show
- **Outputs:**
  - `selectedItemsEvent` - Selection changed
  - `itemsReorderedEvent` - Drag-drop reordered
  - `rowHoveredEvent` - Row hover state
- **Key Responsibilities:**
  1. Load initial batch of items via API
  2. Handle search (database or local)
  3. Handle sorting with server-side support
  4. Handle pagination with "load more"
  5. Manage column filters with dropdown options

#### **RfLotoStandardClickService**
- **Location:** `rf-loto-standard-table/rf-loto-standard-click.service.ts`
- **Purpose:** Extends TableClickService for LOTO Standard-specific interactions
- **Pattern:** Overrides base methods:
  - `handleRowDoubleClick()` - Load full item and open form
  - `handleCellDoubleClick()` - Open form with specific field
  - Context menu support (future implementation)

#### **LotoStandardTableControlService**
- **Location:** `rf-loto-standard-table/rf-loto-standard-table-control.service.ts`
- **Purpose:** Provides action buttons for the table
- **Table Controls:** "Add New LOTO Standard" button
- **Selection Controls:** Future - bulk edit functionality

### 3. Form Components

#### **RfLotoStandardFormComponent**
- **Location:** `rf-loto-standard-form/rf-loto-standard-form.component.ts`
- **Purpose:** CRUD form for single items with draft support
- **Key Features:**
  1. Auto-populate from state
  2. Draft detection with localStorage
  3. Draft comparison dialog (basic implementation)
  4. Deep diff detection for auto-save
- **Future Enhancements:**
  - Double table component for managing loto points
  - File viewer for viewing related images from all loto points

### 4. Page Components

#### **RfLotoStandardPageComponent**
- **Location:** `rf-loto-standard-page/rf-loto-standard-page.component.ts`
- **Purpose:** Container component orchestrating layout
- **Structure:**
  - MainLayoutComponent
  - RouterMenuComponent (header)
  - Left menu (future implementation)
  - RouterOutlet (main content)
  - RfPopupProjectionComponent (modal overlay for form)

#### **RfLotoStandardMainTableViewComponent**
- **Location:** `rf-loto-standard-page/rf-loto-standard-main-table-view.component.ts`
- **Purpose:** Main table view that can be used in routing
- **Providers:** Includes click service and table control service

## Data Flow Architecture

```
User Action (click, search, etc.)
        ↓
Table Component / Form Component
        ↓
State Service (manage state + API calls)
        ↓
API Service (HTTP)
        ↓
Backend API
        ↓
State Service (update signals/subjects)
        ↓
Component (computed re-render)
```

## Key Patterns Followed

1. **API-Centric State** - All data flows through state service
2. **Mapper Service** - Single source of truth for DTO ↔ UI transformations
3. **Signals for UI** - Reactive updates in components
4. **BehaviorSubjects for Shared State** - Complex derived state
5. **Service Composition** - Feature services extend shared base services
6. **Draft Persistence** - Automatic draft saving with localStorage
7. **Lazy Column Options** - Load dropdown options on-demand
8. **Isolated Tables** - Support both main tables (server-backed) and isolated tables (local data only)

## Integration Points

### Existing Models
- **LotoStandardDto** - `models/loto/loto-standard.model.ts`
- **LotoStandardIdDto** - `models/loto/loto-standard-id.model.ts`
- Both models already have methods: `toJson()`, `fromJson()`, `toIdDto()`, `toFormFields()`, `toTableColumns()`

### Shared Components Used
- **TableComponent** - `shared/table/refactored/table.component.ts`
- **RfReactiveFormComponent** - `shared/reactive-form/refactored/reactive-form/rf-reactive-form.component.ts`
- **RfPopupProjectionComponent** - `shared/popup-projection/rf-popup-projection.component.ts`
- **MainLayoutComponent** - `layout/refactored/main-layout.component.ts`

## Next Steps / Future Enhancements

1. **Backend Integration**
   - Ensure backend API endpoints exist: `/loto-standards/paginated`, `/loto-standards/search`, etc.
   - Implement grouped endpoints for left menu

2. **Left Menu Component**
   - Create `rf-loto-standard-left-menu` component
   - Implement grouping by system, unit, or other criteria
   - Follow pattern from `rf-loto-point-left-menu`

3. **Double Table Component**
   - Integrate double loto point table in the form
   - Allow users to add/remove/reorder loto points
   - Support drag-drop between available and selected tables

4. **File Viewer**
   - Create component to view all related images from all loto points in the standard
   - Similar to loto point file viewer but aggregated

5. **Context Menu**
   - Implement context menu service for right-click actions
   - Add common operations like duplicate, delete, copy

6. **Bulk Edit**
   - Implement bulk edit functionality for multiple standards
   - Follow pattern from loto point bulk edit

7. **Routing**
   - Set up routes for the loto standard module
   - Configure routing to use `RfLotoStandardMainTableViewComponent`

8. **Testing**
   - Add unit tests for services
   - Add integration tests for components
   - Test draft management and form validation

## Usage Example

### Basic Table Usage
```typescript
<app-rf-loto-standard-table
  [tableId]="'my-loto-standard-table'"
  [isTableIsolated]="false"
  [loadMoreEnabled]="true"
  [fieldsToDisplay]="['name', 'description', 'lotoPoints', 'isVerified']"
  (selectedItemsEvent)="onSelectionChanged($event)"
></app-rf-loto-standard-table>
```

### Opening Form Programmatically
```typescript
constructor(private stateService: RfLotoStandardStateService) {}

openNewStandard() {
  this.stateService.setSelectedItem(new LotoStandardDto());
  this.stateService.openForm(['name', 'description', 'lotoPoints']);
}

editStandard(id: number) {
  this.stateService.loadItemById(id);
  this.stateService.openForm();
}
```

### Routing Configuration Example
```typescript
{
  path: 'loto-standards',
  component: RfLotoStandardPageComponent,
  children: [
    {
      path: '',
      component: RfLotoStandardMainTableViewComponent
    }
  ]
}
```

## Architecture Alignment

This implementation follows the exact same architecture as the refactored Loto Point feature:

✅ Service layer with API, Mapper, State, and LocalStorage services
✅ Table component with click and control services
✅ Form component with draft management
✅ Page component with popup form integration
✅ Signals and BehaviorSubjects for state management
✅ Support for both isolated and database-backed tables
✅ Lazy loading of column filter options
✅ Server-side pagination and sorting

## Files Created

### Services (4 files)
- `rf-loto-standard-api.service.ts`
- `rf-loto-standard-mapper.service.ts`
- `rf-loto-standard-state.service.ts`
- `rf-loto-standard-local-storage.service.ts`

### Table Components (5 files)
- `rf-loto-standard-table.component.ts`
- `rf-loto-standard-table.component.html`
- `rf-loto-standard-table.component.css`
- `rf-loto-standard-click.service.ts`
- `rf-loto-standard-table-control.service.ts`

### Form Components (3 files)
- `rf-loto-standard-form.component.ts`
- `rf-loto-standard-form.component.html`
- `rf-loto-standard-form.component.css`

### Page Components (4 files)
- `rf-loto-standard-page.component.ts`
- `rf-loto-standard-page.component.html`
- `rf-loto-standard-page.component.css`
- `rf-loto-standard-main-table-view.component.ts`

**Total: 16 new files created**
