# Internal Messaging

DB-based internal messaging system for communication between operators (Java desktop app) and contractors/users (PWA). Separate from EmailCorrespondence — messages live in the database, not in email. Email is used only for notifications ("you have a new message").

## Why Not Expand EmailCorrespondence?

EmailCorrespondence is tightly coupled to email-as-transport: `graphMessageId`, `internetMessageId`, `conversationId` for Graph API matching, 3-tier reply detection, dedup by `graphMessageId`. An internal messaging system doesn't need any of that — messages go straight to the DB.

| EmailCorrespondence | Internal Messaging |
|---------------------|--------------------|
| Email is the transport | DB is the transport |
| Graph API polling for replies | Direct DB writes |
| `graphMessageId` dedup | `(entityType, entityId, initiatorId, responderId)` dedup |
| Direction: OUTBOUND/INBOUND | Sender/Receiver per message |
| Subject matching via regex | Explicit conversation → entity link |
| One-way (system sends, polls for reply) | Bidirectional (either party can message) |

## Architecture

Two entities: `Conversation` (the thread) and `Message` (individual messages within a thread).

Uses the same polymorphic reference pattern as EmailCorrespondence and Comment: `entityType + entityId`.

```
Conversation
  entityType       ("WorkRequest", "Instrument", ...)
  entityId         (123, 456, ...)
  initiatorId      (FK to users — who started the conversation)
  responderId      (FK to users — the other party)
  subject          (conversation topic)
  status           (OPEN | CLOSED)
  lastMessageAt    (denormalized — timestamp of most recent message, for sorting)
  initiatorUnreadCount   (denormalized — unread count for the initiator)
  responderUnreadCount   (denormalized — unread count for the responder)
  Inherited: id, createdBy, modifiedBy, dateCreated, dateModified, deleted

Message
  conversation     (ManyToOne FK to Conversation)
  senderId         (FK to users — who sent this message)
  content          (TEXT — message body)
  sentAt           (timestamp)
  isRead           (boolean — whether recipient has read it)
  Inherited: id, createdBy, modifiedBy, dateCreated, dateModified, deleted
```

### Key Design Decisions

**1-on-1 only**: Each conversation has exactly one initiator and one responder. No group chat — keeps schema simple and avoids per-user read-status join tables.

**Denormalized unread counts on Conversation**: `initiatorUnreadCount` and `responderUnreadCount` avoid counting across Message table for every badge render. When a message is sent, the other party's count increments. When they open the conversation, it resets to 0.

**No cascade annotation**: Soft-deleting a Conversation cascades to Messages via explicit service logic (not JPA cascade), so `FieldChangeEntityListener` fires on each message — ensuring deletions sync to other machines.

### Three-Tier UI

| Component | Location | Purpose |
|-----------|----------|---------|
| `MessagingPageComponent` | `/log/messaging` | Admin table of all conversations |
| `ConversationDialogComponent` | Global in `app.component.html` | Conversation list + message thread for one entity |
| `MessageCellComponent` | Entity table columns | Unread badge, opens dialog on click |

---

## Backend

### Entities

[Conversation.java](../../../src/main/java/com/dk_power/power_plant_java/entities/messaging/Conversation.java)
- Extends `BaseAuditEntity`
- `@EntityListeners(FieldChangeEntityListener.class)` (inherited from `BaseIdEntity`)
- `@Where(clause = "deleted IS NOT TRUE")`
- `Status` enum: `OPEN` / `CLOSED`
- Polymorphic: `entityType` + `entityId` link to any domain entity

[Message.java](../../../src/main/java/com/dk_power/power_plant_java/entities/messaging/Message.java)
- Extends `BaseAuditEntity`
- `@ManyToOne(fetch = FetchType.LAZY, optional = false)` to Conversation
- Table name: `conversation_message` (avoids collision with SQL reserved word)

### Repositories

[ConversationRepo.java](../../../src/main/java/com/dk_power/power_plant_java/repository/messaging/ConversationRepo.java)
- `findVisibleByEntityAndUserOrderByLastMessageAtDesc(entityType, entityId, userId)` — conversations for entity where user is participant
- `findVisibleByUserOrderByLastMessageAtDesc(userId)` — all user's conversations
- `findVisibleByIdAndUser(conversationId, userId)` — access control check
- `sumUnreadForEntityAndUser(entityType, entityId, userId)` — aggregate unread for badge
- `findDuplicateConversationGroups()` — dedup detection
- `findByDedupKeyOrderByIdAsc(entityType, entityId, initiatorId, responderId)` — dedup resolution

[MessageRepo.java](../../../src/main/java/com/dk_power/power_plant_java/repository/messaging/MessageRepo.java)
- `findByConversationIdOrderBySentAtAsc(conversationId)` — chronological thread
- `markIncomingMessagesAsRead(conversationId, userId)` — bulk `@Modifying` update
- `findDuplicateMessageGroups()` — dedup detection
- `findByConversationIdAndSenderIdAndSentAt(conversationId, senderId, sentAt)` — dedup resolution

### DTOs + Mappers

[ConversationDto.java](../../../src/main/java/com/dk_power/power_plant_java/dto/messaging/ConversationDto.java)
[ConversationMapper.java](../../../src/main/java/com/dk_power/power_plant_java/mappers/messaging/ConversationMapper.java)
- Resolves `initiatorName` and `responderName` from `UserRepo`
- Computes `currentUserUnreadCount` based on which participant the current user is
- `initialMessageContent` — transient field used only during `startConversation` (not persisted on entity)

[MessageDto.java](../../../src/main/java/com/dk_power/power_plant_java/dto/messaging/MessageDto.java)
[MessageMapper.java](../../../src/main/java/com/dk_power/power_plant_java/mappers/messaging/MessageMapper.java)
- Resolves `senderName` from `UserRepo`
- `convertToEntity` loads Conversation by ID from repo

### Services

[MessagingUserContextService.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/messaging/MessagingUserContextService.java)
- `getCurrentUser()` / `getCurrentUserRequired()` — from Spring Security context
- `requireAdmin()` — checks for ROLE_ADMIN

[NgConversationService.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/angular/messaging/NgConversationService.java)
- `startConversation(dto)` — creates Conversation + first Message atomically. Validates: entityType, entityId, responderId != self, subject, initialMessageContent all required. Sets `responderUnreadCount = 1`.
- `markRead(conversationId)` — marks individual messages as read via `@Modifying` query, resets the current user's unread counter on Conversation
- `closeConversation(conversationId)` — sets status to CLOSED
- `softDeleteConversation(conversationId)` — cascades to all messages (explicit loop, not JPA cascade)
- `getAccessibleConversation(conversationId, userId)` — guards all operations; throws if user is not initiator or responder
- `searchConversations(criteria, page, pageSize)` — admin-only (calls `requireAdmin()`)

[NgMessageService.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/angular/messaging/NgMessageService.java)
- `sendMessage(dto)` — validates conversation is OPEN, checks access, increments other party's unread count, updates `lastMessageAt`
- `getMessagesForConversation(conversationId)` — checks access first, returns chronological thread

### Controllers

[NgConversationController.java](../../../src/main/java/com/dk_power/power_plant_java/controller/angular/messaging/NgConversationController.java)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/ng/conversations/{entityType}/{entityId}` | GET | Conversations for an entity (current user only) |
| `/ng/conversations/my` | GET | All conversations for current user |
| `/ng/conversations` | POST | Start conversation (body: ConversationDto with responderId, subject, initialMessageContent) |
| `/ng/conversations/{id}/mark-read` | POST | Mark conversation read for current user |
| `/ng/conversations/{id}/close` | POST | Close conversation |
| `/ng/conversations/{id}` | DELETE | Soft-delete conversation + messages |
| `/ng/conversations/{entityType}/{entityId}/unread-count` | GET | Unread count for badge |
| `/ng/conversations/search` | POST | Admin search with criteria (requires ROLE_ADMIN) |

[NgMessageController.java](../../../src/main/java/com/dk_power/power_plant_java/controller/angular/messaging/NgMessageController.java)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/ng/messages/conversation/{conversationId}` | GET | All messages in conversation (access-checked) |
| `/ng/messages` | POST | Send message (body: MessageDto with conversationId, content) |

### Access Control

All endpoints require authentication (inherited from `/ng/**` security rule). Additionally:
- Every conversation action calls `getAccessibleConversation()` which verifies the current user is initiator OR responder
- `sendMessage` validates conversation status is OPEN
- `searchConversations` requires ROLE_ADMIN
- `startConversation` prevents self-messaging (`responderId != currentUserId`)

---

## Frontend

### Models

[conversation.model.ts](../../../frontend/src/app/models/messaging/conversation.model.ts)
- `ConversationModel` interface + `ConversationDto` class
- `normalizeDateTime()` handles Java `LocalDateTime` array serialization `[year, month, day, hour, minute, second, nano]`
- `toJson()` sends only create/update fields (excludes computed: `initiatorName`, `responderName`, `currentUserUnreadCount`)
- `fromJson()` reconstructs all fields including normalized dates

[message.model.ts](../../../frontend/src/app/models/messaging/message.model.ts)
- `MessageModel` interface + `MessageDto` class
- `toJson()` sends only: `id`, `conversationId`, `content`
- Same `normalizeDateTime()` for `sentAt`, `dateCreated`, `dateModified`

### Services

[conversation.service.ts](../../../frontend/src/app/services/messaging/conversation.service.ts)
- All 10 endpoints mapped: `getForEntity`, `getMyConversations`, `startConversation`, `markRead`, `closeConversation`, `deleteConversation`, `getUnreadCount`, `search`

[message.service.ts](../../../frontend/src/app/services/messaging/message.service.ts)
- `getForConversation(conversationId)`, `sendMessage(dto)`

### Dialog Service

[conversation-dialog.service.ts](../../../frontend/src/app/shared/messaging/conversation-dialog.service.ts)
- Signals: `_isVisible`, `_entityType`, `_entityId`, `_selectedConversationId`
- `open(entityType, entityId, conversationId?)` — opens dialog, optionally jumping to a specific conversation
- `openConversation(id)` / `backToList()` — navigate within dialog
- SSE subscriptions to both `'Conversation'` and `'Message'` entity types
- `conversationChanged$` Subject with `debounceTime(300)` — notifies cell components and dialog to refresh

### Dialog Component

[conversation-dialog.component.ts](../../../frontend/src/app/shared/messaging/conversation-dialog.component.ts)
- Registered globally in `app.component.html`
- Two views:
  - **List view**: all conversations for the entity, with unread badges, status indicators, participant names
  - **Thread view**: chronological messages with sender names, timestamps, own-message styling (right-aligned blue)
- Reply input: Enter sends, Shift+Enter for newline, disabled when conversation is CLOSED
- Auto-marks conversation as read on open (calls `markRead`)
- SSE auto-refresh: reloads conversation list when `conversationChanged$` fires while dialog is visible
- Current user ID resolved from `AuthService.currentUser$` for own-message detection

### Cell Component

[message-cell.component.ts](../../../frontend/src/app/shared/messaging/message-cell.component.ts)
- `@Input() entityType`, `@Input() entityId`
- Green "N new" badge if unread > 0; blue count badge if total > 0; "—" if empty
- Subscribes to `conversationChanged$` for real-time SSE refresh
- Click opens `ConversationDialogService.open(entityType, entityId)`

### Messaging Admin Page

[messaging-page.component.ts](../../../frontend/src/app/features/log/messaging-page/messaging-page.component.ts)
- Route: `/log/messaging` (sub-route of Log page)
- Admin table of all conversations (uses `search` endpoint which requires ROLE_ADMIN)
- Filters: entity type, status (OPEN/CLOSED), free text search
- Sortable columns: Subject, Entity Type, Initiator, Responder, Status, Last Message
- Row click opens dialog for that entity's conversations (pre-selecting the clicked conversation)

### Table Integration

[rf-work-request-table](../../../frontend/src/app/features/permit-builder/work-request/refactored/rf-work-request-table/)
- `MessageCellComponent` imported alongside `CorrespondenceCellComponent`
- "Messages" column (width 100) added after "Responses" column
- Template: `<app-message-cell [entityType]="'WorkRequest'" [entityId]="item.id">`

### Router Menu

[router-menu.model.ts](../../../frontend/src/app/models/ui/router-menu.model.ts)
- Log group items: System Log, Correspondence, **Messages**, Instruments

---

## Sync

Change tracking is automatic via `BaseIdEntity`'s `@EntityListeners(FieldChangeEntityListener.class)`.

### Client-Side Registration

| File | Change |
|------|--------|
| [EntityTableRegistry.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/EntityTableRegistry.java) | `"Conversation" -> "conversation"`, `"Message" -> "conversation_message"` in table map; both in SYNC_ORDER (Tier 4, after EmailCorrespondence) |
| [ServiceFacade.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/ServiceFacade.java) | `NgConversationService` + `NgMessageService` injected; both in `serviceMap` |
| [FullSyncToServerService.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FullSyncToServerService.java) | Both repos injected; added to `ENTITY_SYNC_ORDER`, `countAllEntities()`, `getRepositoryForType()` |
| [DedupKeyResolver.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/DedupKeyResolver.java) | Conversation natural key: `(entityType, entityId, initiatorId, responderId)` |

### Deduplication

**Problem**: Two clients independently create a conversation for the same entity between the same users before sync.

[ConversationMergeService.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/ConversationMergeService.java)
- Dedup key: `(entityType, entityId, initiatorId, responderId)`
- Keeps lowest-ID record as canonical
- **Reassigns messages** from duplicate to canonical conversation before soft-deleting the duplicate
- Aggregates unread counts from duplicate into canonical
- Updates `lastMessageAt` to the most recent

[MessageMergeService.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/MessageMergeService.java)
- Dedup key: `(conversationId, senderId, sentAt, content)`
- Groups by partial key in-memory, then deduplicates by content
- Message is a leaf entity — no FK transfers needed

Both merge services:
- Called in [StartupMergeRunner.java](../../../src/main/java/com/dk_power/power_plant_java/config/StartupMergeRunner.java) at startup
- Called in [FieldSyncService.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FieldSyncService.java) in both `afterCommit` blocks
- Use `@Transactional(propagation = REQUIRES_NEW)` for atomicity
- Temporarily clear SyncContext so dedup changes generate FieldChange records and propagate to peers

### Sync Server Registration (deferred)

Mirror entities need to be added to the sync server at `C:\Users\usada\my_projects\sync-server`:
- Create `Conversation.java` and `Message.java` mirror entities
- Add to `ServerEntitySyncService`: `SUPPORTED_TYPES`, `createEntity()`, `getRepository()`, `getTableName()`
- Create repositories

---

## Integrating with a New Entity Type

No backend changes needed. Messaging is already generic via `entityType + entityId`.

**Frontend only:**

1. Add a `MessageCellComponent` column in the entity's table:
```html
<ng-template #messageCellTemplate let-item>
  <app-message-cell
    [entityType]="'MyEntity'"
    [entityId]="item.id">
  </app-message-cell>
</ng-template>
```

2. Register the template as a column:
```typescript
messageCellTemplate = viewChild<TemplateRef<any>>('messageCellTemplate');

// In effect():
const msgTmpl = this.messageCellTemplate();
if (msgTmpl) {
  cols.push({ id: 'messages', header: 'Messages', width: 100, template: msgTmpl });
}
```

3. Import `MessageCellComponent` in the table component's `imports` array.

---

## Future Work

- **PWA Controller**: `PwaConversationController` at `/api/pwa/conversations` for PWA access with JWT auth
- **PWA UI**: Conversations page in user profile, conversation detail with reply, new conversation flow
- **Email Notifications**: `MessageNotificationService` — sends notification email via existing `EmailFacadeService` when a message is received
- **Sync Server**: Mirror entities for Conversation and Message

---

## Verification

1. Start app — Hibernate creates `conversation` and `conversation_message` tables
2. POST `/ng/conversations` with body `{ entityType: "WorkRequest", entityId: 1, responderId: 2, subject: "Test", initialMessageContent: "Hello" }` — conversation + message created
3. GET `/ng/conversations/WorkRequest/1` — returns the conversation with `currentUserUnreadCount`
4. POST `/ng/messages` with body `{ conversationId: 1, content: "Reply" }` — message created, other party's unread count increments
5. POST `/ng/conversations/1/mark-read` — unread count resets, individual messages marked as read
6. POST `/ng/conversations/1/close` — status changes to CLOSED
7. POST `/ng/messages` to closed conversation — returns 400 error
8. DELETE `/ng/conversations/1` — conversation + all messages soft-deleted
9. Open WorkRequest table — "Messages" column shows unread badge
10. Click badge — dialog opens with conversation list, click conversation → thread view with reply input
11. Navigate to `/log/messaging` — admin table shows all conversations with filters
12. Two clients: both create conversation for same entity/users → after sync, merge service keeps one, reassigns messages
