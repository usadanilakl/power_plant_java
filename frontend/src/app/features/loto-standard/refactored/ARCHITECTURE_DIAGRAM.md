# LOTO Standard Architecture Diagram

## Component Hierarchy

```
RfLotoStandardPageComponent
│
├─── MainLayoutComponent
│    │
│    ├─── [header]
│    │    └─── RouterMenuComponent
│    │
│    ├─── [left-menu]
│    │    └─── (Future: RfLotoStandardLeftMenuComponent)
│    │
│    ├─── [main-content]
│    │    └─── RouterOutlet
│    │         └─── RfLotoStandardMainTableViewComponent
│    │              └─── RfLotoStandardTableComponent
│    │                   ├─── Providers:
│    │                   │    ├─── RfLotoStandardClickService
│    │                   │    └─── LotoStandardTableControlService
│    │                   │
│    │                   └─── TableComponent (shared)
│    │                        ├─── Column headers with filters
│    │                        ├─── Sortable columns
│    │                        ├─── Pagination (load more)
│    │                        └─── Row selection
│    │
│    └─── [bottom-menu]
│         └─── (Future: bottom menu outlet)
│
└─── RfPopupProjectionComponent
     └─── RfLotoStandardFormComponent
          └─── RfReactiveFormComponent (shared)
               ├─── Text inputs
               ├─── Textareas
               ├─── Checkboxes
               └─── (Future: Double table for loto points)
```

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  RfLotoStandardTableComponent                               │
│  RfLotoStandardFormComponent                                │
│  RfLotoStandardPageComponent                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ inject
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      STATE LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  RfLotoStandardStateService                                 │
│  ├─── Signals (reactive UI state):                          │
│  │    ├─── selectedItem: signal<LotoStandardDto | null>     │
│  │    ├─── selectedItems: signal<LotoStandardDto[]>         │
│  │    ├─── filterOutItems: signal<LotoStandardDto[]>        │
│  │    ├─── currentColumnUniqueItems: signal<string[]>       │
│  │    ├─── loadingUniqueItems: signal<boolean>              │
│  │    ├─── isLotoStandardFormOpen: signal<boolean>          │
│  │    └─── formFields: signal<LotoStandardFieldName[]>      │
│  │                                                            │
│  └─── BehaviorSubjects (shared state):                      │
│       ├─── allLoadedLotoStandards$                          │
│       ├─── currentSearchCriteria$                           │
│       ├─── currentSortColumn$                               │
│       └─── currentSortDirection$                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ uses
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  RfLotoStandardApiService      (HTTP calls)                 │
│  LotoStandardMapperService     (DTO ↔ UI)                   │
│  LotoStandardLocalStorageService (Drafts)                   │
│  RfLotoStandardClickService    (User interactions)          │
│  LotoStandardTableControlService (Table buttons)            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND API                                │
├─────────────────────────────────────────────────────────────┤
│  GET    /loto-standards/paginated                           │
│  POST   /loto-standards/search                              │
│  GET    /loto-standards/{id}                                │
│  POST   /loto-standards                                     │
│  PUT    /loto-standards                                     │
│  DELETE /loto-standards/{id}                                │
│  POST   /loto-standards/unique-values/{column}/filtered     │
│  GET    /loto-standards/grouped                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow - Loading Initial Data

```
1. User navigates to LOTO Standards page
   ↓
2. RfLotoStandardMainTableViewComponent loads
   ↓
3. RfLotoStandardTableComponent.ngOnInit()
   ↓
4. loadInitialData() called
   ↓
5. RfLotoStandardApiService.getLotoStandards(page=1, pageSize=50)
   ↓
6. HTTP GET /loto-standards/paginated?page=1&pageSize=50
   ↓
7. Backend returns SpringPaginatedResponse<LotoStandardDto>
   ↓
8. RfLotoStandardStateService.addLotoStandards(content)
   ↓
9. allLoadedLotoStandards$ BehaviorSubject updated
   ↓
10. items$ signal updated (via toSignal)
   ↓
11. Table renders with data
```

## Data Flow - Search/Filter

```
1. User types in global search or column filter
   ↓
2. TableComponent emits search event
   ↓
3. RfLotoStandardTableComponent.onSearch(criteria)
   ↓
4. Determine if isolated table or database table
   ↓
   ├─ Isolated: searchWithinInputItems(criteria)
   │  └─ Filter local items array
   │
   └─ Database: searchInDatabase(criteria)
      ↓
      RfLotoStandardStateService.setSearchCriteria(mergedCriteria)
      ↓
      RfLotoStandardStateService.clearLotoStandards()
      ↓
      RfLotoStandardApiService.searchLotoStandards(criteria, pageSize)
      ↓
      HTTP POST /loto-standards/search
      ↓
      Backend returns filtered results
      ↓
      RfLotoStandardStateService.addLotoStandards(results)
      ↓
      Table updates with filtered data
```

## Data Flow - Opening Form

```
1. User clicks "Add New LOTO Standard" button
   ↓
2. LotoStandardTableControlService button action
   ↓
3. RfLotoStandardStateService.setSelectedItem(new LotoStandardDto())
   ↓
4. RfLotoStandardStateService.openForm()
   ↓
5. isLotoStandardFormOpen signal set to true
   ↓
6. RfPopupProjectionComponent shows (bound to isLotoStandardFormOpen)
   ↓
7. RfLotoStandardFormComponent renders
   ↓
8. checkForDrafts effect runs
   ↓
   ├─ Draft exists?
   │  ├─ Yes: Show draft comparison dialog
   │  └─ No: Load fresh form
   │
9. LotoStandardMapperService.toFormFields(entity, fields)
   ↓
10. RfReactiveFormComponent renders form fields
```

## Data Flow - Saving Data

```
1. User fills form and clicks Submit
   ↓
2. RfReactiveFormComponent emits formSubmit event
   ↓
3. RfLotoStandardFormComponent.onSubmit(item)
   ↓
4. RfLotoStandardStateService.submitForm(item)
   ↓
5. RfLotoStandardApiService.saveLotoStandard(item)
   ↓
   ├─ item.id exists?
   │  ├─ Yes: updateLotoStandard(item)
   │  │  └─ HTTP PUT /loto-standards
   │  │
   │  └─ No: createLotoStandard(item)
   │     └─ HTTP POST /loto-standards
   │
6. Backend processes and returns saved entity
   ↓
7. RfLotoStandardStateService.clearDraftForItem(id)
   ↓
8. RfLotoStandardStateService.setSelectedItem(savedEntity)
   ↓
9. Form updates with saved data
```

## Data Flow - Draft Management

```
┌─────────────────────────────────────────────────────────────┐
│  User modifies form                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  RfReactiveFormComponent.valueChanges                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  RfLotoStandardFormComponent.onAnyValueChange(item)         │
│  └─ hasRealDifferences(originalServerVersion, item)?        │
│     ├─ Yes: Continue                                         │
│     └─ No: Stop (no draft needed)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  RfLotoStandardStateService.saveDraft(item)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  LotoStandardLocalStorageService.saveDraft(item)            │
│  └─ localStorage.setItem('loto-standard-drafts', {...})     │
└─────────────────────────────────────────────────────────────┘

On form open:
┌─────────────────────────────────────────────────────────────┐
│  RfLotoStandardFormComponent.checkForDrafts effect          │
│  └─ entity() changed                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  RfLotoStandardStateService.loadDraftForItem(id)            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Draft found?                                                │
│  ├─ Yes: hasRealDifferences(server, draft)?                 │
│  │  ├─ Yes: Show draft comparison dialog                    │
│  │  └─ No: Clear draft silently                             │
│  │                                                            │
│  └─ No: Load fresh server data                              │
└─────────────────────────────────────────────────────────────┘
```

## Click Interaction Flow

```
User Double-Clicks Row
       │
       ▼
TableComponent detects click
       │
       ▼
Calls injected TableClickService
       │
       ▼
RfLotoStandardClickService.handleRowDoubleClick(item, event)
       │
       ▼
Normalizes item to LotoStandardDto
       │
       ▼
RfLotoStandardStateService.loadItemById(item.id)
       │
       ▼
RfLotoStandardApiService.getLotoStandardById(id)
       │
       ▼
HTTP GET /loto-standards/{id}
       │
       ▼
Backend returns full LotoStandardDto
       │
       ▼
RfLotoStandardStateService.setSelectedItem(fullEntity)
       │
       ▼
selectedItem signal updates
       │
       ▼
Form automatically opens (if configured)
```

## Shared Component Integration

```
┌──────────────────────────────────────────────────────────────┐
│         LOTO Standard Components (Feature-Specific)          │
├──────────────────────────────────────────────────────────────┤
│  RfLotoStandardTableComponent                               │
│  RfLotoStandardFormComponent                                │
│  RfLotoStandardPageComponent                                │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ uses
                     ▼
┌──────────────────────────────────────────────────────────────┐
│            Shared Components (Reusable)                      │
├──────────────────────────────────────────────────────────────┤
│  TableComponent                                              │
│  ├─── Handles rendering, sorting, filtering, pagination     │
│  ├─── Emits events for search, sort, selection              │
│  └─── Delegates clicks to injected TableClickService        │
│                                                               │
│  RfReactiveFormComponent                                     │
│  ├─── Dynamic form generation from RfFormField[]            │
│  ├─── Validation with Angular validators                    │
│  └─── Emits formValueChange and formSubmit events           │
│                                                               │
│  RfPopupProjectionComponent                                  │
│  ├─── Modal overlay for forms                               │
│  └─── Handles open/close state                              │
│                                                               │
│  MainLayoutComponent                                         │
│  ├─── Standard app layout with header, menu, content        │
│  └─── Content projection for flexible layout                │
└──────────────────────────────────────────────────────────────┘
```

## Pattern Summary

### Dependency Injection Pattern
```typescript
// Feature components inject feature services
export class RfLotoStandardTableComponent {
  private apiService = inject(RfLotoStandardApiService);
  protected stateService = inject(RfLotoStandardStateService);
  private mapperService = inject(LotoStandardMapperService);
}

// All services use providedIn: 'root' for singleton
@Injectable({ providedIn: 'root' })
export class RfLotoStandardStateService { }
```

### State Management Pattern
```typescript
// Signals for reactive UI state
selectedItem = signal<LotoStandardDto | null>(null);
isFormOpen = signal<boolean>(false);

// BehaviorSubjects for shared complex state
private allLoadedItems = new BehaviorSubject<LotoStandardDto[]>([]);
allLoadedItems$ = this.allLoadedItems.asObservable();

// Computed values in components
items = computed(() => this.inputItems() ?? this.items$());
```

### Service Extension Pattern
```typescript
// Feature services extend base services
export class RfLotoStandardClickService extends TableClickService {
  protected override handleRowDoubleClick(item: any, event: MouseEvent) {
    // Feature-specific implementation
  }
}

export class LotoStandardLocalStorageService extends BaseDraftService<LotoStandardModel> {
  protected readonly DRAFTS_KEY = 'loto-standard-drafts';
  protected getEntityId(draft: Partial<LotoStandardModel>): number | null {
    return draft.id || null;
  }
}
```
