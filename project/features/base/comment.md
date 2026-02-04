# Functionality

1. User is able to leave note for each entity.
2. User is able to see history of notes
3. User is able to group notes by type

Acceptance Criteria:
1. User creates a new note for an Entity - it is persisted to backend db, sync server, local state.
2. User can view all notes of related entity.
3. User can create new note types

# Architecture

Uses polymorphic reference pattern (entityType + entityId) — same approach as TaskReference.
A single Comment entity stores comments for all entity types.
Comment types use the existing Value/Category system.

Comment Entity Fields:
    - content (TEXT) - the comment body
    - entityId (Long) - ID of the referenced entity
    - entityType (String) - class name of the referenced entity (e.g. "LotoPoint", "Equipment")
    - commentType (ManyToOne -> Value) - category of the comment (e.g. "Correction Needed", "Note", "QA")
    - needsAttention (Boolean) - flags comment for follow-up
    - isResolved (Boolean) - marks comment as resolved
    - Inherited from BaseAuditEntity: id, createdBy, modifiedBy, dateCreated, dateModified, objectType, deleted

# Implementation

Full flow:

### Creating a Comment
1. User clicks comment button in form (`CommentInputComponent`) or table cell (`CommentCellComponent`)
2. Component calls `CommentsDialogService.open(entityType, entityId)` which sets visibility signal to true
3. `CommentsDialogComponent` (mounted globally in `app.component.html`) renders via `@if (dialogService.isVisible())`
4. The dialog subscribes to `onOpen$` and calls `loadComments()` to fetch existing comments
5. User types content, optionally checks "Needs Attention", clicks "Add Comment"
6. `CommentDto.toJson()` produces `{ id: null, content, entityType, entityId, needsAttention, isResolved }`
   - `commentType` is omitted when its id is 0/null to avoid Jackson ObjectId conflicts
7. `CommentService.createComment()` sends `POST /ng/comments` with the JSON body
8. `NgCommentController.create()` → `NgCommentService` → `CommentMapper` converts DTO to entity → `CommentRepo.save()` persists to DB
9. Response returns the saved `CommentDto` with auto-generated id, createdBy (from SecurityContext), timestamps
10. Frontend prepends the new comment to the `comments()` signal array — UI updates immediately

### Fetching Comments
1. `CommentCellComponent` / `CommentInputComponent` call `loadPreview()` on `ngOnChanges`
2. `CommentService.getCommentsForEntity(entityType, entityId)` → `GET /ng/comments/{entityType}/{entityId}`
3. Backend queries `CommentRepo.findByEntityTypeAndEntityId()`, returns ordered list
4. Frontend maps response to `CommentDto[]`, sets `latestComment()` and `commentCount()` signals
5. Cell/input renders preview text + badge count

### Key Design Points
- **Fully decoupled**: Entity services/repos have zero knowledge of comments. No FK, no join, no comment field on entities.
- **Polymorphic reference**: `entityType + entityId` is the link. Any entity can have comments.
- **Frontend-driven**: Comment components independently fetch from the Comment API — entity API responses don't include comments.
- **Single global dialog**: One `<app-comments-dialog>` in `app.component.html` serves all entities via `CommentsDialogService`.

## Backend

1. Create Comment entity (extends BaseAuditEntity, implements Referenceable)
    [BaseAuditEntity](../../../src/main/java/com/dk_power/power_plant_java/entities/base_entities/BaseAuditEntity.java)
    [Referenceable](../../../src/main/java/com/dk_power/power_plant_java/entities/Referenceable.java)
    [TaskReference - pattern reference](../../../src/main/java/com/dk_power/power_plant_java/entities/scheduler/TaskReference.java)
2. Create CommentDto (extends BaseDto)
    [BaseDto](../../../src/main/java/com/dk_power/power_plant_java/dto/base_dtos/BaseDto.java)
3. Create CommentMapper (implements BaseMapper)
    [BaseMapper](../../../src/main/java/com/dk_power/power_plant_java/mappers/BaseMapper.java)
4. Create CommentRepo (extends BaseRepository)
    [BaseRepository](../../../src/main/java/com/dk_power/power_plant_java/repository/base_repositories/BaseRepository.java)
    - Add: findByEntityTypeAndEntityId(String entityType, Long entityId)
    - Add: findByEntityTypeAndEntityIdOrderByDateCreatedDesc(String entityType, Long entityId)
5. Create NgCommentService (implements NgCrudService)
    [NgCrudService](../../../src/main/java/com/dk_power/power_plant_java/sevice/angular/base/NgCrudService.java)
    - getCommentsForEntity(entityType, entityId)
    - createComment(entityType, entityId, content, commentTypeId)
6. Create NgCommentController
    [NgLotoPointController - pattern reference](../../../src/main/java/com/dk_power/power_plant_java/controller/angular/loto/NgLotoPointController.java)
    - GET /ng/comments/{entityType}/{entityId}
    - POST /ng/comments
    - PUT /ng/comments/{id}
    - DELETE /ng/comments/{id}
7. Create "CommentType" category in Value/Category system for comment types and add General (GEN) value [](../../../src/main/java/com/dk_power/power_plant_java/sevice/angular/DefaultValueGeneratorService.java)

## Frontend

8. Create Comment model (extends BaseDto)
    [BaseModel](../../../frontend/src/app/models/base/base.model.ts)
9. Create CommentService
10. Create shared CommentsDialogComponent - dialog that shows full comment list with add/edit/resolve
    [shared/](../../../frontend/src/app/shared/)
    - Inputs: entityType (string), entityId (number)
    - Displays full comment history with timestamps, authors, types
    - Provides add/edit/resolve comment functionality
    - Provides a way to select new comment type (using [](../../../frontend/src/app/features/values/refactored/components/rf-value-select/rf-value-select.component.ts))
    - Provides a way to filter existing comments by type (within entity comments)
    - Provides a way to search for comments (within entity entity comments)
10.1 Create Comment (Log) page — see [log.md](log.md)
11. Create comment-input for reactive form (new input type, follows existing input pattern)
    [input-fields/](../../../frontend/src/app/shared/reactive-form/refactored/input-fields/)
    [form-builder.service.ts](../../../frontend/src/app/shared/reactive-form/refactored/services/form-builder.service.ts)
    - Shows latest comment preview (read-only)
    - Button opens CommentsDialogComponent for full management
    - Receives entityType and entityId from form context
12. Create comment table cell type for shared table
    [table.types.ts](../../../frontend/src/app/shared/table/refactored/models/table.types.ts)
    [table.component.ts](../../../frontend/src/app/shared/table/refactored/table.component.ts)
    - Shows latest comment preview in cell
    - Button in cell opens CommentsDialogComponent
    - Visual indicator (icon/badge) when comments exist

## Sync

Client-side change tracking is automatic via BaseIdEntity's @EntityListeners(FieldChangeEntityListener.class).
Both client-side and sync server require explicit registration of the new Comment entity.

### Client-side sync registration

13. Register Comment in EntityTableRegistry:
    [EntityTableRegistry](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/EntityTableRegistry.java)
    - Add Map.entry("Comment", "comment") to ENTITY_TYPE_TO_TABLE
    - Add "Comment" to SYNC_ORDER (after Value, since Comment has ManyToOne to Value)
14. Register Comment in ServiceFacade:
    [ServiceFacade](../../../src/main/java/com/dk_power/power_plant_java/sevice/ServiceFacade.java)
    - Add NgCommentService to constructor
    - Add serviceMap.put(Comment.class.getSimpleName(), ngCommentService)
15. Register Comment in FullSyncToServerService:
    [FullSyncToServerService](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FullSyncToServerService.java)
    - Add CommentRepo to constructor
    - Add "Comment" case to getRepositoryForType() switch

### Sync server registration

16. Create Comment entity on sync server (mirror of backend Comment, extends BaseAuditEntity)
    [Sync server domain entities](../../../../sync-server/src/main/java/com/dk_power/sync_server/entity/domain/)
    [LotoPoint - pattern reference](../../../../sync-server/src/main/java/com/dk_power/sync_server/entity/domain/LotoPoint.java)
17. Create CommentRepository on sync server
    [Sync server repositories](../../../../sync-server/src/main/java/com/dk_power/sync_server/repository/domain/)
18. Register Comment in ServerEntitySyncService:
    [ServerEntitySyncService](../../../../sync-server/src/main/java/com/dk_power/sync_server/service/ServerEntitySyncService.java)
    - Add "Comment" to SUPPORTED_TYPES set
    - Add CommentRepository to constructor injection
    - Add "Comment" case to createEntity() switch
    - Add "Comment" case to getRepository() switch

## Real-Time Updates

Comments are a separate entity from their parent entities (LotoPoint, Equipment, etc.).
When a comment is created/updated/deleted, the parent entity's SSE event does NOT fire — only a `Comment` SSE event fires.
This means comment cells and the log page need their own update mechanism.

### How it works

`CommentsDialogService` acts as the central hub for comment change notifications:

1. **Local mutations** (same client): After any comment create/edit/delete/resolve in `CommentsDialogComponent`,
   `dialogService.emitCommentChanged(entityType, entityId)` is called with the parent entity reference.
   This allows targeted reload — only the matching `CommentCellComponent` refreshes.

2. **Cross-client updates** (SSE): `CommentsDialogService` subscribes to `SyncUpdateService.getEntityTypeUpdates$('Comment')`.
   When a Comment SSE event arrives, it extracts parent entity info (`entityType`, `entityId` fields) from the
   `changes` array when available (CREATE events). For UPDATE/DELETE events where parent info isn't in changes,
   it broadcasts `null` to reload all visible cells.

3. **Consumers**:
   - `CommentCellComponent` subscribes to `commentChanged$` and calls `loadPreview()` when matching or on broadcast.
   - `LogTableComponent` subscribes to `commentChanged$` and reloads its paginated data.

All subscriptions are debounced (300ms) to batch rapid changes and use `takeUntilDestroyed` for cleanup.
