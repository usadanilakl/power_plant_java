# Category & Value Manager

## Overview

The Category & Value Manager provides a dedicated UI for managing Categories and Values used throughout the application. Previously, values could only be managed through dropdown selects in forms. This feature adds a centralized management page with full CRUD operations, duplicate detection, and merge capabilities.

**Route:** `/category-values`

## Features

### Category Management

- **View all categories** with value counts
- **Create** new categories with name and alias
- **Edit** existing category name/alias
- **Delete** categories (with value transfer if not empty)

### Value Management

- **View all values** across all categories
- **Filter by category** using the dropdown filter
- **Create** new values in any category
- **Edit** value name/alias (triggers file relocation for Vendor/FileType categories)
- **Delete** values (with reference transfer if in use)

### Duplicate Detection & Resolution

- **Find Duplicates** button scans for:
  - Categories with the same name (case-insensitive)
  - Values with the same name within the same category (case-insensitive)
- **Merge duplicates** by selecting which entity to keep
  - All values are transferred to the kept category
  - All references (Equipment, Files, LotoPoints) are transferred to the kept value
  - Duplicate entities are soft-deleted

## UI Components

### Main Page (`/category-values`)

- **Tab Navigation**: Switch between Categories and Values views
- **Toolbar**: Contains "Find Duplicates" and "New" buttons
- **Category Filter** (Values tab only): Filter values by category
- **Table**: Displays entities with click-to-edit support
- **Action Buttons**: Edit and Delete for each row

### Dialogs

1. **Create/Edit Form**: Modal form for category/value CRUD
2. **Delete Confirmation**: Shows dependencies and transfer options
3. **Duplicate Resolver**: Lists all duplicate groups with merge buttons

## Backend API

### Endpoints

**Base URL:** `/api/cv-manager`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | All categories with value counts |
| POST | `/categories` | Create category |
| PUT | `/categories/{id}` | Update category |
| DELETE | `/categories/{id}?transferToCategoryId=` | Delete category |
| GET | `/categories/duplicates` | Find duplicate categories |
| POST | `/categories/merge` | Merge duplicate categories |
| GET | `/values?categoryId=` | All values (optional filter) |
| POST | `/values` | Create value |
| PUT | `/values/{id}` | Update value |
| DELETE | `/values/{id}?transferToValueId=` | Delete value |
| GET | `/values/{id}/dependencies` | Get value reference counts |
| GET | `/values/duplicates?categoryId=` | Find duplicate values |
| POST | `/values/merge` | Merge duplicate values |
| POST | `/values/move` | Move value to different category |

### Services

- **CategoryValueManagerService**: Orchestrates all operations
- Delegates to **NgValueService** for:
  - `updateValueName()` - handles file relocation for Vendor/FileType
  - `moveItemsToNewValue()` - transfers Equipment, LotoPoint, FileObject references
  - `deleteValue()` - soft-deletes values

## File Relocation Behavior

When updating a value in the **Vendor** or **File Type** category:

1. Physical folders are renamed on disk via `fileService.updateFileStructureWithNewValue()`
2. All affected FileObject records have their `fileLink` and `folder` fields rebuilt
3. Changes are tracked and synced to other machines

This ensures file paths remain consistent when value names change.

## Reference Transfer on Delete

When deleting a value that is referenced by other entities:

1. User must select a target value to transfer references to
2. All Equipment, LotoPoints, and FileObjects referencing the deleted value are updated
3. The delete operation uses `NgValueService.moveItemsToNewValue()` which:
   - Calls `equipmentService.refactorValues(oldValue, newValue)`
   - Calls `lotoPointService.refactorValues(oldValue, newValue)`
   - Calls `fileService.refactorValues(oldValue, newValue)`

## Duplicate Merge Behavior

When merging duplicates:

1. User selects which entity to keep (by ID)
2. For categories: all values are transferred to the kept category
3. For values: all downstream references are transferred using `refactorValues()`
4. Duplicate entities are soft-deleted (`deleted = true`)
5. Changes are tracked by `FieldChangeEntityListener` and synced

The merge uses deterministic selection (user choice) rather than automatic lowest-ID selection used in sync-time deduplication.

## Related Documentation

- [Category Value Deduplication](../sync-and-backup/category-value-deduplication.md) - Automatic deduplication during sync
- [Field-Based Sync](../sync-and-backup/field-based-sync.md) - How changes propagate to other machines

## Files

### Backend
- `src/main/java/com/dk_power/power_plant_java/sevice/angular/CategoryValueManagerService.java`
- `src/main/java/com/dk_power/power_plant_java/controller/angular/CategoryValueManagerController.java`
- `src/main/java/com/dk_power/power_plant_java/dto/categories/CategoryWithCountDto.java`
- `src/main/java/com/dk_power/power_plant_java/dto/categories/DuplicateCategoryDto.java`
- `src/main/java/com/dk_power/power_plant_java/dto/categories/DuplicateValueDto.java`
- `src/main/java/com/dk_power/power_plant_java/dto/categories/ValueWithDependenciesDto.java`
- `src/main/java/com/dk_power/power_plant_java/dto/categories/MergeRequestDto.java`

### Frontend
- `frontend/src/app/features/values/refactored/components/cv-manager/cv-manager-page.component.ts`
- `frontend/src/app/features/values/refactored/models/cv-manager.model.ts`
- `frontend/src/app/features/values/refactored/services/cv-manager-api.service.ts`
- `frontend/src/app/routes/standalone.routes.ts` (route registration)
