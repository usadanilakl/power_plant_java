# Functionality:
User can manage (view, change) labeling/lockability status of each loto point.

The following fields will be used to track the status:
    - isLabeled (Boolean) - tracks labeling status
    - isLockable (Boolean) - tracks if locking mechanism is installed
    - isProcessed (Boolean) - ALREADY EXISTS on LotoPoint entity (line 47). Set to true after loto point is fully processed
    - isVerified (Boolean) - ALREADY EXISTS on BaseIdEntity (line 30). Inherited by all entities including LotoPoint

needsAttention is NOT a field on LotoPoint. It lives on the Comment entity (Comment.needsAttention).
A loto point "needs attention" when it has any unresolved comment with needsAttention=true.
This avoids duplicating state between LotoPoint and Comment.

Comments are managed via the universal Comment feature (entityType="LotoPoint", entityId=lotoPoint.id).
Comments are used to note corrections needed for the loto point (e.g. needs relabeling, new locking mechanism).
See [comment.md](../base/comment.md) for the Comment system architecture.

Acceptance Criteria:
1. User sets new status (isLabeled, isLockable, isProcessed, isVerified) - server database is updated, sync server is updated, local state is updated (forms, tables)
2. User adds a comment with needsAttention=true to a loto point - the loto point shows as "needs attention" (derived from Comment, not a LotoPoint field).
3. User can view/add/edit/resolve comments for a loto point via the shared Comments dialog (from both table cell and form).

# Implementation

## Backend

1. Add missing fields to Entity: isLabeled (Boolean), isLockable (Boolean).
    [LotoPoint.java](../../../src/main/java/com/dk_power/power_plant_java/entities/loto/LotoPoint.java)
    - isProcessed already exists on LotoPoint (line 47)
    - isVerified already exists on BaseIdEntity (line 30) - inherited
    - Add: private Boolean isLabeled = false;
    - Add: private Boolean isLockable = false;

2. Add missing fields to DTOs (only the DTOs that need them):
    [LotoPointDto](../../../src/main/java/com/dk_power/power_plant_java/dto/permits/loto_point/LotoPointDto.java)
        - Add: isLabeled, isLockable, isProcessed (isProcessed is on entity but missing from this DTO)
        - isVerified: verify if inherited from BaseDto, add if missing
    [LotoPointIdDto](../../../src/main/java/com/dk_power/power_plant_java/dto/permits/loto_point/LotoPointIdDto.java)
        - Add: isLabeled, isLockable, isProcessed
        - isVerified: verify if inherited from BaseDto, add if missing
    [LotoPointSummaryDto](../../../src/main/java/com/dk_power/power_plant_java/dto/permits/loto_point/LotoPointSummaryDto.java)
        - isVerified already exists (line 21)
        - Add: isLabeled, isLockable, isProcessed
    [LotoPointDtoLight](../../../src/main/java/com/dk_power/power_plant_java/dto/permits/loto_point/LotoPointDtoLight.java)
        - Skip - lightweight DTO for display only, does not need labeling fields

3. Add new fields to mapper
    [LotoPointMapper](../../../src/main/java/com/dk_power/power_plant_java/mappers/LotoPointMapper.java)
    - Map isLabeled, isLockable in both convertToDto() and convertToEntity()
    - isProcessed, isVerified: verify already mapped, add if missing

## Sync Server

4. Add missing fields to sync server Entity
    [LotoPoint](../../../../sync-server/src/main/java/com/dk_power/sync_server/entity/domain/LotoPoint.java)
    - Add: private Boolean isLabeled = false;
    - Add: private Boolean isLockable = false;
    - Verify isProcessed and isVerified exist (may be inherited from base), add if missing

## Frontend Models

5. Add missing fields to frontend models:
    [Model](../../../frontend/src/app/models/loto/loto-point.model.ts)
        - Add: isLabeled, isLockable (isProcessed, isVerified: verify exist, add if missing)
    [IdModel](../../../frontend/src/app/models/loto/loto-point-id.model.ts)
        - Add: isLabeled, isLockable (isProcessed, isVerified: verify exist, add if missing)
    [Summary](../../../frontend/src/app/models/loto/loto-point-summary.model.ts)
        - isVerified already exists
        - Add: isLabeled, isLockable, isProcessed
    [Clipboard](../../../frontend/src/app/models/loto/loto-point-clipboard.model.ts)
        - Skip unless clipboard needs labeling status

## Frontend Mapper, Table, Form

6. Add missing fields to loto point mapper service (toTableColumns and toFormFields)
    [LotoPointMapperService](../../../frontend/src/app/features/loto-points/refactored/services/rf-loto-point-mapper.service.ts)
    - toTableColumns() (line 50): add column definitions for isLabeled, isLockable, isProcessed, isVerified
    - toFormFields() (line 318): add form field definitions for isLabeled, isLockable, isProcessed, isVerified (all as checkbox type)

7. Add comment column to loto point table (in toTableColumns allColumns map).
    [LotoPointMapperService](../../../frontend/src/app/features/loto-points/refactored/services/rf-loto-point-mapper.service.ts)
    [CommentCellComponent](../../../frontend/src/app/shared/comments-dialog/comment-cell.component.ts)
    - Add a 'comment' column using Column.template with CommentCellComponent
    - entityType="LotoPoint", entityId=row.id
    - Shows latest comment preview + count badge, opens CommentsDialog on click

8. Add comment field to loto point form (in toFormFields allFields map).
    [LotoPointMapperService](../../../frontend/src/app/features/loto-points/refactored/services/rf-loto-point-mapper.service.ts)
    [CommentInputComponent](../../../frontend/src/app/shared/reactive-form/refactored/input-fields/comment-input/comment-input.component.ts)
    - Add a 'comment' form field with type: 'comment'
    - commentContext: { entityType: 'LotoPoint', entityId: entity.id }
    - Shows latest comment preview, button opens CommentsDialog for full management

## Print/Engrave & Verify Integration

9. Add functionality to Print and Engrave dialog to set isLabeled=true after successful print/engrave.
    [EngraverManager](../../../frontend/src/app/shared/engraver-manager/engraver-modal.service.ts)
    [BradyManager](../../../frontend/src/app/shared/brady-printer-manager/brady-printer-modal.service.ts)
    - After successful print/engrave operation, update loto point with isLabeled=true

10. Implement context menu "Verified" option - sets isVerified=true on the selected loto point.
    [EngraverManager](../../../frontend/src/app/shared/engraver-manager/engraver-modal.service.ts)
    [BradyManager](../../../frontend/src/app/shared/brady-printer-manager/brady-printer-modal.service.ts)
    - Add "Mark as Verified" option to context menu
    - Sets isVerified=true, persists to server and sync

## Testing

### Test 5: Set labeling status fields on a new LOTO point (in loto-point-from-shape.spec.ts)
[loto-point-from-shape.spec.ts](../../../automation-test/tests/loto-points/loto-point-from-shape.spec.ts)

**Steps:**
1. Navigate to loto-builder, ensure test file exists, open file in viewer
2. Draw a shape on the image to trigger the LOTO point creation form
3. Fill required fields (tag number, description, specific location, equipment type, isolated/normal position, location)
4. Set Processing Status dropdown (value-select) - select "In Progress" or create if not present
5. Check all 4 labeling checkboxes: isLabeled, isLockable, isProcessed, isVerified
6. Submit the form
7. Navigate to LOTO Points page, search for the created point
8. Open the loto point and verify:
   - Processing Status dropdown has the selected value
   - All 4 checkboxes are checked (persisted after save)

### Test File: LOTO Point Comments (loto-point-comments.spec.ts)
[loto-point-comments.spec.ts](../../../automation-test/tests/loto-points/loto-point-comments.spec.ts)

#### Test 1: Add a single comment with needsAttention to one loto point
**Steps:**
1. Navigate to LOTO Points page
2. Click on the first loto point row to open its form
3. Open the CommentsDialog via comment-input button (or comment-cell in table)
4. Type a comment in the textarea
5. Check "Needs Attention" checkbox
6. Click "Add Comment"
7. Verify: comment appears in dialog list with "Attention" badge
8. Close dialog
9. Verify: comment badge shows count >= 1 in table cell

#### Test 2: Add comments to multiple loto points (up to 10)
**Steps:**
1. Navigate to LOTO Points page
2. For each loto point (up to 10 rows):
   - Open CommentsDialog via comment-cell click (or form comment-input fallback)
   - Type a unique comment with timestamp
   - Alternate needsAttention (true for even-indexed, false for odd-indexed)
   - Click "Add Comment", verify comment appears in dialog
   - Close dialog
3. Final verification: each commented row has a comment badge with count >= 1

