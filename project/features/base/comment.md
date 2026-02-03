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
7. Create "CommentType" category in Value/Category system for comment types

## Frontend

8. Create Comment model (extends BaseDto)
    [BaseModel](../../../frontend/src/app/models/base/base.model.ts)
9. Create CommentService
10. Create shared CommentsDialogComponent - dialog that shows full comment list with add/edit/resolve
    [shared/](../../../frontend/src/app/shared/)
    - Inputs: entityType (string), entityId (number)
    - Displays full comment history with timestamps, authors, types
    - Provides add/edit/resolve comment functionality
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
