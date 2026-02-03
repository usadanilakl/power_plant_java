# Log Page (Comments Database View)

Displays all comments across the entire system in a searchable, filterable, paginated table.
Uses the existing Comment entity — no new entity needed.

## Architecture

The table component handles filtering, sorting, scrolling and pagination via backend search endpoints.
The Log page follows the same pattern as LotoPoints page:
- Page component (layout shell with `<router-outlet>`)
- DB Table wrapper component (DI configuration for table services)
- Table component (renders columns, handles search/sort/pagination events)
- Services: API, State, Mapper

### Folder structure
```
frontend/src/app/features/log/
├── log-page/
│   ├── log-page.component.ts
│   ├── log-page.component.html
│   └── log-page.component.css
├── log-db-table/
│   ├── log-db-table.component.ts
│   ├── log-db-table-click.service.ts       (optional — row click opens CommentsDialog)
│   └── log-db-table-control.service.ts     (optional — context menu actions)
├── log-table/
│   ├── log-table.component.ts
│   ├── log-table.component.html
│   └── log-table.component.css
└── services/
    ├── log-api.service.ts
    ├── log-state.service.ts
    └── log-mapper.service.ts
```

## Backend

NgCrudService already provides `complexSearch`, `getAll(page, pageSize)`, and `getUniqueValuesOfColumn` — no new logic needed, just controller endpoints.

### 1. Add paginated + search endpoints to NgCommentController
[NgCommentController](../../../src/main/java/com/dk_power/power_plant_java/controller/angular/NgCommentController.java)

Add these endpoints (same pattern as [NgLotoPointController](../../../src/main/java/com/dk_power/power_plant_java/controller/angular/loto/NgLotoPointController.java)):

```java
// Paginated list
@GetMapping("/paginated")
public ResponseEntity<NgApiResponse<Page<CommentDto>>> getPaginated(
    @RequestParam(defaultValue = "1") int page,
    @RequestParam(defaultValue = "50") int pageSize)

// Complex search (global, column, sort)
@PostMapping("/search")
public ResponseEntity<NgApiResponse<Page<CommentDto>>> search(
    @RequestBody SearchCriteria criteria,
    @RequestParam(defaultValue = "1") int page,
    @RequestParam(defaultValue = "50") int pageSize)

// Unique column values for filter dropdowns
@GetMapping("/unique-values/{column}")
public ResponseEntity<NgApiResponse<List<String>>> getUniqueValues(
    @PathVariable String column)

// Filtered unique column values
@PostMapping("/unique-values/{column}/filtered")
public ResponseEntity<NgApiResponse<Page<String>>> getFilteredUniqueValues(
    @PathVariable String column,
    @RequestBody SearchCriteria criteria,
    @RequestParam(defaultValue = "1") int page,
    @RequestParam(defaultValue = "50") int pageSize)
```

All delegate to inherited NgCrudService methods — no custom service/repo changes needed.

### 2. Override globalSearchColumns (optional)
In NgCommentService, override `getGlobalSearchColumns()` to define which fields the global search bar queries:
```java
@Override
public List<String> getGlobalSearchColumns() {
    return List.of("content", "entityType", "createdBy");
}
```

## Frontend

### 3. Create routing
Create [routes/log.routes.ts](../../../frontend/src/app/routes/log.routes.ts):
```typescript
export const LOG_ROUTES: Routes = [
  {
    path: 'log',
    component: LogPageComponent,
    children: [
      { path: '', redirectTo: 'table', pathMatch: 'full' },
      { path: 'table', component: LogDbTableComponent },
    ]
  }
];
```
Register `LOG_ROUTES` in [app.routes.ts](../../../frontend/src/app/app.routes.ts).

### 4. Create LogApiService
[services/log-api.service.ts](../../../frontend/src/app/features/log/services/log-api.service.ts)
- Base URL: `/ng/comments`
- Methods:
  - `getPaginated(page, pageSize)` → GET `/ng/comments/paginated`
  - `search(criteria, pageSize)` → POST `/ng/comments/search`
  - `getUniqueValues(column)` → GET `/ng/comments/unique-values/{column}`
  - `getFilteredUniqueValues(column, criteria, page, pageSize)` → POST `/ng/comments/unique-values/{column}/filtered`
- All return `Observable<SpringPaginatedResponse<CommentDto>>` or similar

### 5. Create LogStateService
[services/log-state.service.ts](../../../frontend/src/app/features/log/services/log-state.service.ts)
- Manages `BehaviorSubject<CommentDto[]>` for loaded items
- Tracks `currentPage`, `pageSize`, `currentSearchCriteria`
- Methods: `addItems()`, `clearItems()`, `incrementPage()`
- Follow pattern from [RfLotoPointStateService](../../../frontend/src/app/features/loto-points/refactored/services/rf-loto-point-state.service.ts)

### 6. Create LogMapperService
[services/log-mapper.service.ts](../../../frontend/src/app/features/log/services/log-mapper.service.ts)

Table columns:
| Column ID     | Header          | AccessorKey / AccessorFn                |
|---------------|-----------------|----------------------------------------|
| content       | Content         | `content` (truncated)                  |
| entityType    | Entity Type     | `entityType`                           |
| entityId      | Entity ID       | `entityId`                             |
| commentType   | Type            | `commentType?.name`                    |
| needsAttention| Attention       | boolean → Yes/No, conditional styling  |
| isResolved    | Resolved        | boolean → Yes/No, conditional styling  |
| createdBy     | Author          | `createdBy`                            |
| dateCreated   | Date            | `dateCreated` (formatted)              |

Default columns: `['content', 'entityType', 'entityId', 'commentType', 'needsAttention', 'createdBy', 'dateCreated']`

### 7. Create LogTableComponent
[log-table/log-table.component.ts](../../../frontend/src/app/features/log/log-table/log-table.component.ts)
- Injects LogApiService, LogStateService, LogMapperService
- On init: loads first page via `apiService.getPaginated()`
- Handles `onSearch()` → calls `apiService.search(criteria)`
- Handles `onLoadMore()` → increments page, appends results
- Handles `onTableSortChanged()` → resets page, re-queries
- Renders `<app-table>` with columns from mapper

### 8. Create LogDbTableComponent (DI wrapper)
[log-db-table/log-db-table.component.ts](../../../frontend/src/app/features/log/log-db-table/log-db-table.component.ts)
- Provides table services (TableSearchService, TableStateService, etc.)
- Optionally provides custom click service (row click → open CommentsDialog for that entity)
- Template: `<app-log-table></app-log-table>`

### 9. Create LogPageComponent
[log-page/log-page.component.ts](../../../frontend/src/app/features/log/log-page/log-page.component.ts)
- Simple layout shell with `<router-outlet>`
- Optional: sidebar/header with title "System Log"

## Files to Create
1. `frontend/src/app/routes/log.routes.ts`
2. `frontend/src/app/features/log/log-page/log-page.component.ts` (+html, +css)
3. `frontend/src/app/features/log/log-table/log-table.component.ts` (+html, +css)
4. `frontend/src/app/features/log/log-db-table/log-db-table.component.ts`
5. `frontend/src/app/features/log/services/log-api.service.ts`
6. `frontend/src/app/features/log/services/log-state.service.ts`
7. `frontend/src/app/features/log/services/log-mapper.service.ts`

## Files to Modify
1. `src/main/java/.../controller/angular/NgCommentController.java` — add paginated/search/unique-values endpoints
2. `src/main/java/.../sevice/angular/NgCommentService.java` — optionally override `getGlobalSearchColumns()`
3. `frontend/src/app/app.routes.ts` — register LOG_ROUTES

## Verification
- Navigate to `/log` route
- Table loads first page of comments
- Global search filters by content/author
- Column filters work (especially entityType, commentType)
- Pagination loads more rows on scroll
- Sort by date/author works
