# LOTO Point Left Menu - Design Documentation

## Overview

The LOTO Point Left Menu is a hierarchical navigation component designed to efficiently handle and display ~15,000 LOTO points grouped by various criteria. It provides search functionality, virtual scrolling, and visual status indicators.

## Architecture

### Components

1. **RfLotoPointLeftMenuComponent** (`rf-loto-point-left-menu.component.ts`)
   - Main container component
   - Manages UI state and user interactions
   - Delegates data loading to the menu service
   - Handles click events to load full LOTO point data

2. **RfLotoPointLeftMenuService** (`services/rf-loto-point-left-menu.service.ts`)
   - Data management and caching
   - Transforms server data to hierarchical NestedItem structure
   - Handles grouping logic
   - Provides observables for reactive updates

3. **RfToggleMenuComponent** (shared component)
   - Reusable toggle menu with search
   - Virtual scrolling for performance
   - AND/OR search modes
   - Handles item expansion/collapse

4. **ToggleListVirtualScrollComponent** (shared component)
   - CDK Virtual Scroll implementation
   - Efficiently renders large lists
   - Tracks clicked/expanded state

## Features

### Grouping Criteria

LOTO points can be grouped by:
- **Equipment Type** - Group by equipment type (valve, pump, etc.)
- **Location** - Group by physical location
- **File** - Group by associated P&ID file
- **System** - Group by system (cooling water, steam, etc.)
- **Unit** - Group by plant unit
- **Zero Energy Method** - Group by isolation method

### Search Functionality

- **Word-bucket approach**: Split search into multiple terms
- **AND mode**: All search terms must match (default)
- **OR mode**: Any search term must match
- **Recursive search**: Searches both group names and LOTO point details
- **Auto-expand**: Automatically expands groups with matching children

### Visual Indicators

Color coding for LOTO points:
- 🔴 **Red**: Missing critical information (tagNumber or description)
- 🟡 **Yellow**: Not verified (isVerified = false)
- 🟢 **Green**: Complete and verified

### Performance Optimizations

1. **Virtual Scrolling**: Only renders visible items
2. **Caching**: Groups are cached in memory after first load
3. **Lazy Loading**: Load groups on demand from server
4. **Flattening**: Hierarchical data flattened for efficient rendering

## Data Flow

```
User Action (Click Group Button)
    ↓
Component.loadLotoPoints(groupBy)
    ↓
Service.loadGroupedLotoPoints(groupBy)
    ↓
Check Cache → If exists, return cached data
    ↓
If not cached → API Call to Backend
    ↓
Transform Response → NestedItem[]
    ↓
Cache Result
    ↓
Emit via Observable
    ↓
Component receives data → Update Signal
    ↓
Template renders with RfToggleMenu
```

## Backend Requirements

### API Endpoint Needed

**Endpoint**: `GET /api/loto-points/grouped`

**Query Parameters**:
- `groupBy`: string - One of: "equipmentType", "location", "file", "system", "unit", "zeroEnergyMethod"

**Response Format**:
```json
{
  "responseData": {
    "Valve": [
      {
        "id": 21002,
        "tagNumber": "HV-001",
        "description": "Main Steam Isolation Valve",
        "isVerified": true,
        "equipmentType": { "name": "Valve" },
        "location": { "name": "Turbine Hall" },
        "unit": { "name": "Unit 1" }
        // ... other fields
      },
      // ... more loto points
    ],
    "Pump": [
      // ... loto points for pump group
    ]
  }
}
```

### Expected Server-Side Implementation

The backend should:

1. **Query LOTO points** with the groupBy parameter
2. **Group results** by the specified field
3. **Return grouped map** with group names as keys and arrays of LOTO points as values
4. **Include necessary fields** for display:
   - id
   - tagNumber
   - description
   - isVerified
   - Associated objects (equipmentType, location, etc.)

### SQL Query Example (for equipmentType grouping)

```sql
SELECT
  et.name as group_name,
  lp.*
FROM loto_point lp
LEFT JOIN equipment e ON lp.equipment_id = e.id
LEFT JOIN equipment_type et ON e.equipment_type_id = et.id
WHERE lp.deleted = false
ORDER BY et.name, lp.tag_number
```

Then group in Java:
```java
Map<String, List<LotoPointDto>> groupedPoints = lotoPoints.stream()
  .collect(Collectors.groupingBy(
    lp -> lp.getEquipmentType() != null
      ? lp.getEquipmentType().getName()
      : "Uncategorized"
  ));
```

## Usage

### Basic Integration

Add to a parent component template:
```html
<app-rf-loto-point-left-menu></app-rf-loto-point-left-menu>
```

### With Routing

The menu automatically integrates with `RfLotoPointStateService` to:
- Load full LOTO point data on click
- Open forms on double-click
- Trigger state updates

## File Structure

```
frontend/src/app/features/loto-points/refactored/
├── rf-loto-point-left-menu/
│   ├── rf-loto-point-left-menu.component.ts      # Main component
│   ├── rf-loto-point-left-menu.component.html    # Template
│   ├── rf-loto-point-left-menu.component.css     # Styles
│   └── README.md                                   # This file
├── services/
│   ├── rf-loto-point-left-menu.service.ts        # Menu service
│   ├── rf-loto-point-api.service.ts              # API service (add endpoint)
│   └── rf-loto-point-state.service.ts            # State management
└── ...
```

## Next Steps - Backend Implementation

### 1. Create Controller Method

File: `LotoPointController.java`

```java
@GetMapping("/grouped")
public ResponseEntity<SpringApiResponse<Map<String, List<LotoPointDto>>>> getGroupedLotoPoints(
    @RequestParam String groupBy
) {
    Map<String, List<LotoPointDto>> grouped = lotoPointService.getGroupedLotoPoints(groupBy);
    return ResponseEntity.ok(
        SpringApiResponse.<Map<String, List<LotoPointDto>>>builder()
            .responseData(grouped)
            .message("Successfully retrieved grouped LOTO points")
            .build()
    );
}
```

### 2. Create Service Method

File: `LotoPointService.java`

```java
public Map<String, List<LotoPointDto>> getGroupedLotoPoints(String groupBy) {
    List<LotoPoint> allPoints = lotoPointRepository.findAllByDeletedFalse();

    return allPoints.stream()
        .map(this::toDto)  // Convert to DTO
        .collect(Collectors.groupingBy(
            lp -> extractGroupKey(lp, groupBy)
        ));
}

private String extractGroupKey(LotoPointDto lotoPoint, String groupBy) {
    return switch (groupBy) {
        case "equipmentType" -> Optional.ofNullable(lotoPoint.getEquipmentType())
            .map(ValueDto::getName)
            .orElse("Uncategorized");
        case "location" -> Optional.ofNullable(lotoPoint.getLocation())
            .map(ValueDto::getName)
            .orElse("Uncategorized");
        case "file" -> Optional.ofNullable(lotoPoint.getMainFile())
            .map(FileDto::getName)
            .orElse("Uncategorized");
        case "system" -> Optional.ofNullable(lotoPoint.getSystem())
            .map(ValueDto::getName)
            .orElse("Uncategorized");
        case "unit" -> lotoPoint.getUnit() != null
            ? lotoPoint.getUnit()
            : "Uncategorized";
        case "zeroEnergyMethod" -> Optional.ofNullable(lotoPoint.getZeroEnergy())
            .map(ZeroEnergyDto::getMethod)
            .orElse("Uncategorized");
        default -> "Uncategorized";
    };
}
```

### 3. Add API Service Method (Frontend)

File: `rf-loto-point-api.service.ts`

```typescript
getGroupedLotoPoints(groupBy: string): Observable<SpringApiResponse<any>> {
  return this.http.get<SpringApiResponse<any>>(
    `${this.baseUrl}/grouped`,
    { params: { groupBy } }
  );
}
```

### 4. Update Menu Service (Frontend)

Replace the `loadAllAndGroup` method in `rf-loto-point-left-menu.service.ts`:

```typescript
private loadAllAndGroup(groupBy: GroupingCriteria): void {
  this.apiService.getGroupedLotoPoints(groupBy).pipe(
    takeUntilDestroyed(this.destroyRef),
    tap((response) => {
      const nestedItems = this.transformToNestedItems(
        response.responseData,
        groupBy
      );
      this.groupedDataCache.set(groupBy, nestedItems);
      this.menuDataSubject.next(nestedItems);
      this.isLoadingSubject.next(false);
    }),
    catchError((error) => {
      console.error('Error loading grouped LOTO points:', error);
      this.errorSubject.next(error.message || 'Failed to load LOTO points');
      this.isLoadingSubject.next(false);
      return of(null);
    })
  ).subscribe();
}
```

## Testing Plan

### Unit Tests
- Service grouping logic
- Color determination
- Display name generation
- Cache management

### Integration Tests
- Component-service interaction
- API endpoint responses
- State management updates

### Performance Tests
- Load time with 15k items
- Scroll performance
- Search performance
- Memory usage

## Future Enhancements

1. **Filter Persistence**: Save selected grouping in localStorage
2. **Multi-level Grouping**: Group by multiple criteria (e.g., Location → Equipment Type)
3. **Custom Grouping**: Allow users to create custom grouping rules
4. **Export**: Export grouped lists to CSV/Excel
5. **Context Menu**: Right-click actions (edit, delete, duplicate)
6. **Drag & Drop**: Drag LOTO points to other groups (update fields)
7. **Batch Operations**: Select multiple and perform bulk actions
