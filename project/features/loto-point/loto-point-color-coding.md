# Functionality:
User can visually identify the state of each loto point via color-coded cells in the table.

The following states are tracked:

1. **Incomplete Data** - cell-level amber highlight on required fields that are missing:
    - tagNumber (String) - required
    - description (String) - required
    - specificLocation (String) - required
    - isoPos (Value) - required (checked via isoPos.id)
    - normPos (Value) - required (checked via normPos.id)

2. **Processing Status** - new `processingStatus` field of type Value (uses Value/Category system).
    Default values (seeded via DefaultValueGeneratorService):
    - Not Processed (alias: NP) - gray background
    - In Progress (alias: IP) - blue background
    - Verified (alias: VRF) - green background
    Existing isProcessed and isVerified boolean fields are kept on the entity but deprecated (not shown in UI).

3. **Labeled Status** - isLabeled boolean: green when labeled, amber when not labeled.

4. **Lockable Status** - isLockable boolean: green when lockable, amber when not lockable.

5. **Action Needed** (future) - derived from Comment.needsAttention flag.
    A loto point "needs attention" when it has any unresolved comment with needsAttention=true.
    This is NOT a field on LotoPoint. It lives on the Comment entity.
    See [comment.md](../base/comment.md) for the Comment system architecture.

Color palette uses muted, professional tones via CSS variables (supports light/dark theme).

Acceptance Criteria:
1. Table cells for tagNumber, description, specificLocation, isoPos, normPos show amber highlight when value is missing.
2. Single "Status" column shows processingStatus value with color: gray (NP), blue (IP), green (VRF).
3. isLabeled column shows green when true, amber when false.
4. isLockable column shows green when true, amber when false.
5. Form has value-select dropdown for Processing Status, checkboxes for isLabeled/isLockable.
6. Colors adapt correctly when dark theme is toggled.
7. (Future) Loto points with unresolved needsAttention comments show coral/red indicator.

# Implementation

## Frontend Theme

1. Add status CSS variables to theme file (both light and dark themes):
    [theme-styles.css](../../../frontend/src/theme-styles.css)
    - Add to `:root` (light theme):
        - `--status-incomplete: #fff3e0;` (warm amber)
        - `--status-not-processed: #eceff1;` (cool gray)
        - `--status-in-progress: #e3f2fd;` (soft blue)
        - `--status-complete: #e8f5e9;` (sage green)
        - `--status-attention: #fce4ec;` (soft coral - future use)
    - Add to `.dark-theme`:
        - `--status-incomplete: #4e342e;`
        - `--status-not-processed: #37474f;`
        - `--status-in-progress: #1a237e;`
        - `--status-complete: #1b5e20;`
        - `--status-attention: #b71c1c;`

## Backend

2. Add processingStatus field to LotoPoint entity:
    [LotoPoint.java](../../../src/main/java/com/dk_power/power_plant_java/entities/loto/LotoPoint.java)
    - Add: `@ManyToOne @JoinColumn(name = "processing_status_id") private Value processingStatus;`
    - Keep existing isProcessed and isVerified (deprecated, not removed)

3. Add processingStatus to DTOs:
    [LotoPointDto](../../../src/main/java/com/dk_power/power_plant_java/dto/permits/loto_point/LotoPointDto.java)
    - Add: `private ValueDto processingStatus;`
    [LotoPointIdDto](../../../src/main/java/com/dk_power/power_plant_java/dto/permits/loto_point/LotoPointIdDto.java)
    - Add: processingStatus ID field (same pattern as isoPos/normPos)

4. Add processingStatus mapping to LotoPointMapper:
    [LotoPointMapper](../../../src/main/java/com/dk_power/power_plant_java/mappers/LotoPointMapper.java)
    - Map processingStatus in both convertToDto() and convertToEntity(), same pattern as isoPos/normPos

5. Seed default Processing Status values:
    [DefaultValueGeneratorService](../../../src/main/java/com/dk_power/power_plant_java/sevice/angular/DefaultValueGeneratorService.java)
    - Add generateProcessingStatusValues() method:
        - ngValueService.createValue("Processing Status", "Not Processed", "NP")
        - ngValueService.createValue("Processing Status", "In Progress", "IP")
        - ngValueService.createValue("Processing Status", "Verified", "VRF")
    - Call from generateAllValues()

## Frontend Models

6. Add processingStatus to frontend models:
    [loto-point.model.ts](../../../frontend/src/app/models/loto/loto-point.model.ts)
    - Add: `processingStatus: ValueDto | null;`
    [loto-point-id.model.ts](../../../frontend/src/app/models/loto/loto-point-id.model.ts)
    - Add: `processingStatus: number | null;`
    [toIdModel()](../../../frontend/src/app/models/loto/loto-point.model.ts)
    - Add: `processingStatus: this.processingStatus?.id || null`

## Frontend Mapper & Table

7. Add processingStatus table column to allColumns:
    [rf-loto-point-mapper.service.ts](../../../frontend/src/app/features/loto-points/refactored/services/rf-loto-point-mapper.service.ts)
    - Standard Value column with conditionalStyling based on alias (NP→gray, IP→blue, VRF→green)

8. Add processingStatus form field to allFields:
    [rf-loto-point-mapper.service.ts](../../../frontend/src/app/features/loto-points/refactored/services/rf-loto-point-mapper.service.ts)
    - type: 'value-select', categoryAlias: 'processingStatus'

9. Update default field arrays:
    [rf-loto-point-mapper.service.ts](../../../frontend/src/app/features/loto-points/refactored/services/rf-loto-point-mapper.service.ts)
    - toTableColumns() defaults: replace 'isVerified' with 'processingStatus', add 'isLabeled', 'isLockable'
    - toFormFields() defaults: add 'processingStatus', 'isLabeled', 'isLockable'

10. Remove old isProcessed/isVerified from UI:
    [rf-loto-point-mapper.service.ts](../../../frontend/src/app/features/loto-points/refactored/services/rf-loto-point-mapper.service.ts)
    - Remove isProcessed and isVerified entries from allColumns and allFields

## Sync Server

11. Add processingStatus to sync server entity:
    [LotoPoint (sync)](../../../../sync-server/src/main/java/com/dk_power/sync_server/entity/domain/LotoPoint.java)
    - Add processingStatus field (Value reference or Long ID)

## Action Needed - Future Implementation Plan

Requires cross-entity data: Comment.needsAttention must be surfaced on LotoPoint rows.

Recommended approach:

### Backend
12. Add computed field `hasAttentionComment` to LotoPointDto:
    [LotoPointDto](../../../src/main/java/com/dk_power/power_plant_java/dto/permits/loto_point/LotoPointDto.java)
    - Add: `private Boolean hasAttentionComment = false;`

13. Add query to CommentRepo:
    [CommentRepo](../../../src/main/java/com/dk_power/power_plant_java/repository/base_repositories/CommentRepo.java)
    - Add batch query: `List<Long> findEntityIdsByEntityTypeAndNeedsAttentionTrueAndIsResolvedFalse(String entityType)`

14. Populate hasAttentionComment in NgLotoPointService when building DTOs:
    [NgLotoPointService](../../../src/main/java/com/dk_power/power_plant_java/sevice/angular/loto/NgLotoPointService.java)
    - Use batch query to avoid N+1: fetch all attention entityIds for "LotoPoint" type, set flag on matching DTOs

### Frontend
15. Add hasAttentionComment to frontend model:
    [loto-point.model.ts](../../../frontend/src/app/models/loto/loto-point.model.ts)
    - Add: `hasAttentionComment: boolean | null;`

16. Add "Attention" column or integrate into Status column:
    [rf-loto-point-mapper.service.ts](../../../frontend/src/app/features/loto-points/refactored/services/rf-loto-point-mapper.service.ts)
    - Option A: Separate "Attention" column with coral background when true
    - Option B: Override Status column color to coral when hasAttentionComment=true (attention takes priority)
