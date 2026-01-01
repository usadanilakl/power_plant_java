# LOTO Standard - Quick Start Guide

## Table of Contents
1. [Setup & Routing](#setup--routing)
2. [Common Use Cases](#common-use-cases)
3. [Customization Guide](#customization-guide)
4. [Troubleshooting](#troubleshooting)

---

## Setup & Routing

### Step 1: Add Route Configuration

```typescript
// app.routes.ts or your routing module
import { RfLotoStandardPageComponent } from './features/loto-standard/refactored/rf-loto-standard-page/rf-loto-standard-page.component';
import { RfLotoStandardMainTableViewComponent } from './features/loto-standard/refactored/rf-loto-standard-page/rf-loto-standard-main-table-view.component';

export const routes: Routes = [
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
];
```

### Step 2: Ensure Backend Endpoints Exist

The following API endpoints must be implemented on the backend:

```
GET    /api/loto-standards/paginated?page=1&pageSize=50
POST   /api/loto-standards/search
GET    /api/loto-standards/{id}
POST   /api/loto-standards
PUT    /api/loto-standards
DELETE /api/loto-standards/{id}
POST   /api/loto-standards/unique-values/{column}/filtered
GET    /api/loto-standards/grouped?groupBy=system
```

### Step 3: Test Navigation

Navigate to `/loto-standards` in your browser. You should see:
- A table with LOTO standards
- An "Add New LOTO Standard" button
- Column headers with filter dropdowns
- Sortable columns

---

## Common Use Cases

### Use Case 1: Display a Basic Table

```typescript
<app-rf-loto-standard-table
  [tableId]="'my-table'"
  [isTableIsolated]="false"
  [loadMoreEnabled]="true"
></app-rf-loto-standard-table>
```

### Use Case 2: Display Table with Specific Columns

```typescript
<app-rf-loto-standard-table
  [tableId]="'custom-columns-table'"
  [fieldsToDisplay]="['name', 'description', 'isVerified']"
></app-rf-loto-standard-table>
```

### Use Case 3: Display Isolated Table (Local Data)

```typescript
export class MyComponent {
  myLocalStandards = signal<LotoStandardDto[]>([
    new LotoStandardDto({ name: 'Standard 1', description: 'Test' }),
    new LotoStandardDto({ name: 'Standard 2', description: 'Test 2' })
  ]);
}

// Template
<app-rf-loto-standard-table
  [tableId]="'isolated-table'"
  [inputItems]="myLocalStandards()"
  [isTableIsolated]="true"
></app-rf-loto-standard-table>
```

### Use Case 4: Open Form to Create New Standard

```typescript
import { RfLotoStandardStateService } from './services/rf-loto-standard-state.service';

export class MyComponent {
  private stateService = inject(RfLotoStandardStateService);

  createNewStandard() {
    this.stateService.setSelectedItem(new LotoStandardDto());
    this.stateService.openForm(['name', 'description', 'lotoPoints']);
  }
}
```

### Use Case 5: Open Form to Edit Existing Standard

```typescript
editStandard(standardId: number) {
  // This will fetch the full entity from the server
  this.stateService.loadItemById(standardId);
  // Form will open automatically when item is loaded
}
```

### Use Case 6: Handle Selection Changes

```typescript
export class MyComponent {
  selectedStandards = signal<LotoStandardDto[]>([]);

  onSelectionChanged(items: LotoStandardDto[]) {
    this.selectedStandards.set(items);
    console.log('Selected:', items.map(i => i.name));
  }
}

// Template
<app-rf-loto-standard-table
  (selectedItemsEvent)="onSelectionChanged($event)"
></app-rf-loto-standard-table>
```

### Use Case 7: Programmatically Search/Filter

```typescript
import { SearchCriteria } from './models/api/search-criteria.model';

searchByName(searchTerm: string) {
  const criteria: SearchCriteria = {
    type: 'column',
    filters: {
      name: searchTerm
    }
  };

  // The table component will handle this if you have a reference
  this.tableComponent.onSearch(criteria);
}
```

### Use Case 8: Listen to Form Submissions

```typescript
import { RfLotoStandardStateService } from './services/rf-loto-standard-state.service';

export class MyComponent implements OnInit {
  private stateService = inject(RfLotoStandardStateService);
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    // Subscribe to state changes
    this.stateService.allLoadedLotoStandards$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(standards => {
        console.log('Standards updated:', standards.length);
      });
  }
}
```

---

## Customization Guide

### Customize Table Columns

Edit `LotoStandardMapperService.toTableColumns()`:

```typescript
// services/rf-loto-standard-mapper.service.ts
toTableColumns(fields: (keyof LotoStandardDto)[] = [...]) {
  const allColumns = {
    // Add custom column
    customField: {
      id: 'customField',
      header: 'Custom Field',
      accessorKey: 'customField',
      width: 150,
      filterable: true,
      sortable: true,
    },
    // ...other columns
  };

  return fields.map(field => allColumns[field]).filter(Boolean) as Column[];
}
```

### Customize Form Fields

Edit `LotoStandardMapperService.toFormFields()`:

```typescript
// services/rf-loto-standard-mapper.service.ts
toFormFields(lotoStandard: LotoStandardDto | null, fields: [...]) {
  const allFields = {
    // Add custom field
    customField: {
      name: 'customField',
      label: 'Custom Field',
      type: 'text',
      initialValue: lotoStandard?.customField || '',
      validators: [Validators.required],
      required: true,
    },
    // ...other fields
  };

  return fields.map(field => allFields[field]).filter(Boolean) as RfFormField[];
}
```

### Add Custom Table Button

Edit `LotoStandardTableControlService`:

```typescript
// rf-loto-standard-table/rf-loto-standard-table-control.service.ts
constructor() {
  super();

  this.addTableControlButtons([
    {
      name: 'Add New LOTO Standard',
      action: () => { /* existing */ },
      color: 'accent' as ButtonColor,
      icon: 'add_box',
    },
    // Add your custom button
    {
      name: 'Export to CSV',
      action: () => {
        // Your export logic here
      },
      color: 'primary' as ButtonColor,
      icon: 'download',
    }
  ]);
}
```

### Add Context Menu

1. Create context menu service:

```typescript
// services/loto-standard-context-menu.service.ts
import { Injectable, signal } from '@angular/core';
import { ContextMenuAction } from '../../../../models/ui/context-menu.model';

@Injectable({ providedIn: 'root' })
export class LotoStandardContextMenuService {
  contextMenuVisible = signal<boolean>(false);
  contextMenuPosition = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  contextMenuSelectedItem = signal<LotoStandardDto | null>(null);

  contextMenuActions: ContextMenuAction[] = [
    {
      label: 'Edit',
      icon: 'edit',
      action: (item: LotoStandardDto) => {
        // Handle edit
      }
    },
    {
      label: 'Delete',
      icon: 'delete',
      action: (item: LotoStandardDto) => {
        // Handle delete
      }
    }
  ];

  showContextMenu(item: LotoStandardDto, event: MouseEvent) {
    this.contextMenuSelectedItem.set(item);
    this.contextMenuPosition.set({ x: event.clientX, y: event.clientY });
    this.contextMenuVisible.set(true);
    event.preventDefault();
  }

  closeContextMenu() {
    this.contextMenuVisible.set(false);
  }
}
```

2. Use in click service:

```typescript
// rf-loto-standard-table/rf-loto-standard-click.service.ts
protected override handleRowRightClick(item: any, event: MouseEvent): void {
  const normalizedItem = this.normalizeItem(item) as LotoStandardDto;
  this.contextMenuService.showContextMenu(normalizedItem, event);
  this.contextMenuService.positionContextMenu(event, 220, 320);
}
```

### Customize Validation

Edit `LotoStandardMapperService`:

```typescript
isValid(lotoStandard: Partial<LotoStandardDto>): boolean {
  if (!lotoStandard.name || lotoStandard.name.trim() === '') {
    return false;
  }
  // Add your custom validation
  if (lotoStandard.lotoPoints && lotoStandard.lotoPoints.length === 0) {
    return false;
  }
  return true;
}

getValidationErrors(lotoStandard: Partial<LotoStandardDto>): string[] {
  const errors: string[] = [];

  if (!lotoStandard.name || lotoStandard.name.trim() === '') {
    errors.push('Name is required');
  }
  // Add your custom error messages
  if (lotoStandard.lotoPoints && lotoStandard.lotoPoints.length === 0) {
    errors.push('At least one LOTO point is required');
  }

  return errors;
}
```

---

## Troubleshooting

### Problem: Table shows no data

**Check:**
1. Backend API is running and accessible
2. API endpoint returns correct format: `SpringPaginatedResponse<LotoStandardDto>`
3. Browser console for HTTP errors
4. Network tab in DevTools for API response

**Fix:**
```typescript
// Check if data is being loaded
ngOnInit() {
  this.stateService.allLoadedLotoStandards$
    .subscribe(items => console.log('Loaded items:', items));
}
```

### Problem: Form doesn't open

**Check:**
1. `RfPopupProjectionComponent` is in the template
2. State service is setting form open signal
3. Form component is imported in page component

**Fix:**
```typescript
// Verify state is being set
openForm() {
  console.log('Opening form');
  this.stateService.openForm();
  console.log('Form open:', this.stateService.isLotoStandardFormOpen());
}
```

### Problem: Columns not filtering

**Check:**
1. Backend endpoint `/unique-values/{column}/filtered` exists
2. Column has `filterable: true` in mapper
3. No console errors when opening filter dropdown

**Fix:**
```typescript
// Verify unique values are being loaded
loadUniqueItems(columnKey: string, searchString: string) {
  console.log('Loading unique items for:', columnKey);
  this.stateService.loadUniqueItems(columnKey as keyof LotoStandardDto, searchString);

  // Check what was loaded
  this.stateService.currentColumnUniqueItems()
    .subscribe(items => console.log('Unique items:', items));
}
```

### Problem: Draft not saving

**Check:**
1. LocalStorage is enabled in browser
2. No errors in console related to localStorage
3. Draft service is properly injected

**Fix:**
```typescript
// Manually test draft saving
testDraft() {
  const testItem = new LotoStandardDto({ name: 'Test', description: 'Test' });
  this.stateService.saveDraft(testItem);

  // Check if it was saved
  const loaded = this.stateService.loadDraftForItem(null);
  console.log('Draft loaded:', loaded);
}
```

### Problem: Sorting doesn't work

**Check:**
1. Backend supports sorting (sortColumn, sortDirection parameters)
2. Column has `sortable: true` in mapper
3. SearchCriteria includes sort fields

**Fix:**
```typescript
// Verify sort criteria is being sent
onTableSortChanged(event: { column: Column; isAscending: boolean }) {
  const criteria: SearchCriteria = {
    sortColumn: event.column.id,
    sortDirection: event.isAscending ? 'ASC' : 'DESC',
    type: 'sort'
  };
  console.log('Sorting with criteria:', criteria);
  // ...rest of method
}
```

### Problem: Can't delete items

**Check:**
1. Backend DELETE endpoint exists
2. Permissions/authorization configured
3. API service has deleteLotoStandard method

**Fix:**
```typescript
// Add delete functionality
deleteStandard(id: number) {
  this.apiService.deleteLotoStandard(id.toString())
    .subscribe({
      next: () => {
        console.log('Deleted successfully');
        // Refresh table
        this.loadInitialData();
      },
      error: (err) => {
        console.error('Delete failed:', err);
      }
    });
}
```

---

## Best Practices

### 1. Always Use State Service for State Management
```typescript
// ✅ Good
this.stateService.setSelectedItem(item);

// ❌ Bad - bypassing state service
this.selectedItem = item;
```

### 2. Use Computed Values in Components
```typescript
// ✅ Good - reactive
items = computed(() => this.inputItems() ?? this.items$());

// ❌ Bad - manual updates needed
items = this.inputItems() || this.items$();
```

### 3. Clean Up Subscriptions
```typescript
// ✅ Good - using takeUntilDestroyed
this.stateService.allLoadedLotoStandards$
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe(items => { /* ... */ });

// ❌ Bad - memory leak
this.stateService.allLoadedLotoStandards$
  .subscribe(items => { /* ... */ });
```

### 4. Handle Errors Properly
```typescript
// ✅ Good - error handling
this.apiService.getLotoStandards(1, 50)
  .pipe(
    tap(response => { /* success */ }),
    catchError(error => {
      console.error('Error:', error);
      this.errorMessage.set('Failed to load data');
      return of(null);
    })
  )
  .subscribe();

// ❌ Bad - no error handling
this.apiService.getLotoStandards(1, 50)
  .subscribe(response => { /* ... */ });
```

### 5. Use Mapper Service for Transformations
```typescript
// ✅ Good - centralized mapping
const columns = this.mapperService.toTableColumns(fields);
const formFields = this.mapperService.toFormFields(entity, fields);

// ❌ Bad - inline transformations
const columns = fields.map(f => ({ id: f, header: f, ... }));
```

---

## Additional Resources

- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Complete implementation details
- [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md) - Visual architecture diagrams
- Loto Point implementation: `features/loto-points/refactored/` - Reference implementation
- Shared table component: `shared/table/refactored/` - Base table functionality
