# LOTO Standard Backend Implementation Summary

## Overview
This document summarizes the backend API implementation for LOTO Standards to support the refactored Angular frontend.

## Files Modified

### 1. Controller
**File:** `src/main/java/com/dk_power/power_plant_java/controller/angular/loto/NgLotoStandardController.java`

**Changes:**
- ✅ Changed request mapping from `/ng/loto-standard` to `/ng/loto-standards` (plural)
- ✅ Added `@GetMapping("/paginated")` - Get paginated LOTO standards
- ✅ Added `@PostMapping("/search")` - Search with criteria (global, column, sort)
- ✅ Added `@PostMapping` - Create new LOTO standard
- ✅ Added `@PutMapping` - Update existing LOTO standard
- ✅ Added `@DeleteMapping("/{id}")` - Delete LOTO standard
- ✅ Added `@PostMapping("/unique-values/{column}/filtered")` - Get unique column values with filtering
- ✅ Added `@GetMapping("/grouped")` - Get grouped LOTO standards
- ✅ Updated all endpoints to return proper `NgApiResponse` with timestamps

### 2. Service
**File:** `src/main/java/com/dk_power/power_plant_java/sevice/angular/loto/NgLotoStandardService.java`

**New Methods Added:**
- ✅ `findAllPaginated(Pageable)` - Paginated retrieval
- ✅ `updateStandard(LotoStandardIdDto)` - Update existing standard
- ✅ `deleteById(String)` - Delete by ID
- ✅ `complexSearch(SearchCriteria, page, pageSize, sortColumn, sortDirection, useAndLogic)` - Advanced search
- ✅ `searchGlobally(String, Pageable)` - Global search across fields
- ✅ `searchByFilters(Map, Pageable, boolean)` - Column-specific filtering
- ✅ `matchesFilters(LotoStandard, Map, boolean)` - Filter matching logic
- ✅ `matchesFilter(LotoStandard, String, String)` - Single field matching
- ✅ `getFilteredUniqueValuesOfColumn(String, SearchCriteria, int, int, boolean)` - Unique values for dropdowns
- ✅ `getGroupedLotoStandards(String)` - Group standards by field
- ✅ `getFieldValue(LotoStandard, String)` - Extract field value by name
- ✅ `getGroupKey(LotoStandard, String)` - Get grouping key
- ✅ `createPageable(int, int, String, String)` - Helper for pagination
- ✅ `paginateList(List, Pageable)` - Helper for list pagination
- ✅ `paginateStringList(List, Pageable)` - Helper for string list pagination

## API Endpoints

### Base URL
```
/ng/loto-standards
```

### Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/paginated?page=1&pageSize=50` | Get paginated standards |
| GET | `/{id}` | Get single standard by ID |
| POST | `/search` | Search with criteria |
| POST | `` | Create new standard |
| PUT | `` | Update existing standard |
| DELETE | `/{id}` | Delete standard |
| POST | `/unique-values/{column}/filtered` | Get unique column values |
| GET | `/grouped?groupBy=name` | Get grouped standards |
| GET | `/get-all` | Get all standards (legacy) |
| POST | `/{id}/add-loto-point/{lotoStandardId}` | Add loto point to standard |
| DELETE | `/{id}/remove-loto-point/{lotoStandardId}` | Remove loto point from standard |
| GET | `/{lotoStandardId}/related-files` | Get related files from all loto points |
| PUT | `/{currentStandardId}/reorder-loto-points` | Reorder loto points in standard |

## Request/Response Examples

### 1. Get Paginated Standards
```http
GET /ng/loto-standards/paginated?page=1&pageSize=50

Response:
{
  "responseData": {
    "content": [
      {
        "id": 1,
        "name": "Standard 1",
        "description": "Test standard",
        "lotoPoints": [...],
        "isVerified": false
      }
    ],
    "totalElements": 100,
    "totalPages": 2,
    "size": 50,
    "number": 0
  },
  "message": "LOTO standards retrieved successfully",
  "timestamp": "2024-01-01T12:00:00"
}
```

### 2. Search Standards
```http
POST /ng/loto-standards/search?page=1&pageSize=50
Content-Type: application/json

{
  "type": "COLUMN",
  "filters": {
    "name": "Emergency",
    "description": "Shutdown"
  },
  "sortColumn": "name",
  "sortDirection": "ASC"
}

Response:
{
  "responseData": {
    "content": [...],
    "totalElements": 5,
    "totalPages": 1
  },
  "message": "Search completed successfully"
}
```

### 3. Create Standard
```http
POST /ng/loto-standards
Content-Type: application/json

{
  "name": "Emergency Shutdown Standard",
  "description": "Standard procedure for emergency shutdown",
  "lotoPoints": [1, 2, 3]
}

Response:
{
  "responseData": {
    "id": 5,
    "name": "Emergency Shutdown Standard",
    "description": "Standard procedure for emergency shutdown",
    "lotoPoints": [...]
  },
  "message": "LOTO standard created successfully",
  "timestamp": "2024-01-01T12:00:00"
}
```

### 4. Update Standard
```http
PUT /ng/loto-standards
Content-Type: application/json

{
  "id": 5,
  "name": "Updated Standard Name",
  "description": "Updated description",
  "lotoPoints": [1, 2, 3, 4]
}

Response:
{
  "responseData": {...},
  "message": "LOTO standard updated successfully",
  "timestamp": "2024-01-01T12:00:00"
}
```

### 5. Delete Standard
```http
DELETE /ng/loto-standards/5

Response:
{
  "responseData": null,
  "message": "LOTO standard deleted successfully"
}
```

### 6. Get Unique Column Values
```http
POST /ng/loto-standards/unique-values/name/filtered?page=1&pageSize=50
Content-Type: application/json

{
  "type": "COLUMN",
  "filters": {
    "description": "Emergency"
  }
}

Response:
{
  "responseData": {
    "content": [
      "Emergency Shutdown Standard",
      "Emergency Response Standard",
      "Emergency Isolation Standard"
    ],
    "totalElements": 3
  },
  "message": "Filtered unique values retrieved successfully"
}
```

### 7. Get Grouped Standards
```http
GET /ng/loto-standards/grouped?groupBy=name

Response:
{
  "responseData": {
    "Emergency Standards": [...],
    "Normal Operations": [...],
    "Maintenance": [...]
  },
  "message": "Successfully retrieved grouped LOTO standards"
}
```

## Search Criteria Types

The frontend uses three types of search criteria:

### 1. GLOBAL Search
Searches across multiple fields (name, description)
```json
{
  "type": "GLOBAL",
  "query": "emergency"
}
```

### 2. COLUMN Search
Searches specific columns with filters
```json
{
  "type": "COLUMN",
  "filters": {
    "name": "Emergency",
    "description": "Shutdown"
  },
  "columnFilterLogic": "AND"
}
```

### 3. SORT Only
Just sorts without filtering
```json
{
  "type": "SORT",
  "sortColumn": "name",
  "sortDirection": "DESC"
}
```

## Implementation Details

### Search Logic

#### Global Search
- Searches across `name` and `description` fields
- Case-insensitive
- Uses `contains` matching

#### Column Search
- Supports AND/OR logic between filters
- Case-insensitive
- Individual field matching
- Supports fields: `name`, `description`, `id`

#### Sorting
- Supports sorting by any field
- Directions: `ASC` or `DESC`
- Default: `name` ascending

### Pagination
- Server-side pagination implemented
- Page numbers start at 1 (frontend convention)
- Converted to 0-based for Spring Data (backend convention)
- Returns Spring `Page` object with metadata

### Unique Values
- Extracts unique values from specified column
- Applies current filters to narrow down results
- Sorted alphabetically
- Paginated for large datasets

## Integration with Frontend

The backend now fully supports all frontend API calls defined in:
- `RfLotoStandardApiService.getLotoStandards()`
- `RfLotoStandardApiService.searchLotoStandards()`
- `RfLotoStandardApiService.getLotoStandardById()`
- `RfLotoStandardApiService.saveLotoStandard()`
- `RfLotoStandardApiService.deleteLotoStandard()`
- `RfLotoStandardApiService.getFilteredUniqueValuesOfColumn()`
- `RfLotoStandardApiService.getGroupedLotoStandards()`

## Testing the API

### Using curl

```bash
# Get paginated standards
curl -X GET "http://localhost:8080/ng/loto-standards/paginated?page=1&pageSize=10"

# Search standards
curl -X POST "http://localhost:8080/ng/loto-standards/search?page=1&pageSize=10" \
  -H "Content-Type: application/json" \
  -d '{"type":"GLOBAL","query":"emergency"}'

# Create standard
curl -X POST "http://localhost:8080/ng/loto-standards" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Standard","description":"Test","lotoPoints":[]}'

# Get by ID
curl -X GET "http://localhost:8080/ng/loto-standards/1"

# Delete standard
curl -X DELETE "http://localhost:8080/ng/loto-standards/1"
```

### Using Postman
Import the following collection:
1. Create new collection "LOTO Standards API"
2. Add requests for each endpoint above
3. Set base URL variable: `{{baseUrl}}/ng/loto-standards`

## Error Handling

All endpoints include try-catch blocks with:
- `200 OK` - Successful operations
- `400 Bad Request` - Invalid input or search criteria
- `404 Not Found` - Standard not found
- `500 Internal Server Error` - Server-side errors

Error responses include:
```json
{
  "responseData": null,
  "message": "Error description here"
}
```

## Performance Considerations

### Current Implementation
- In-memory filtering and search (suitable for moderate datasets)
- Fetches all standards then filters in Java

### Future Optimization (for large datasets)
If you have thousands of standards, consider:
1. Using JPA Specifications for database-level filtering
2. Adding database indexes on searchable fields
3. Implementing query optimization
4. Caching frequently accessed data

Example specification-based implementation:
```java
public Page<LotoStandard> searchWithSpecifications(
    SearchCriteria criteria, Pageable pageable) {

    Specification<LotoStandard> spec = Specification.where(null);

    // Add specifications based on criteria
    if (criteria.getFilters() != null) {
        for (Map.Entry<String, String> filter : criteria.getFilters().entrySet()) {
            spec = spec.and((root, query, cb) ->
                cb.like(cb.lower(root.get(filter.getKey())),
                    "%" + filter.getValue().toLowerCase() + "%")
            );
        }
    }

    return lotoStandardRepo.findAll(spec, pageable);
}
```

## Compatibility

### Backend Requirements
- Spring Boot 2.7+ or 3.x
- Spring Data JPA
- Java 17+
- Hibernate

### Frontend Requirements
- Angular 17+
- RxJS 7+
- TypeScript 5+

## Next Steps

1. ✅ Controller updated with all required endpoints
2. ✅ Service methods implemented for search, pagination, filtering
3. ✅ Unique values filtering for column dropdowns
4. ✅ Grouped endpoints for left menu (future use)
5. ⏭️ Add integration tests for all endpoints
6. ⏭️ Add database indexes for performance
7. ⏭️ Implement caching strategy if needed
8. ⏭️ Add API documentation (Swagger/OpenAPI)

## Summary

The backend is now fully compatible with the refactored Angular frontend. All required API endpoints are implemented and follow the same pattern as the LOTO Points controller for consistency.

**Key Features:**
- ✅ Paginated data retrieval
- ✅ Advanced search (global, column, sort)
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Unique values for column filters
- ✅ Grouped data for hierarchical navigation
- ✅ Related files aggregation from loto points
- ✅ Loto point ordering within standards
- ✅ Consistent response format with NgApiResponse
