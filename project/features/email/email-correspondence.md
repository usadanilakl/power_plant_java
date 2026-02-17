# Email Correspondence

Generic, system-wide email correspondence tracking. Records every email sent from the system and every reply received from external users, linked to the entity that originated the communication.

## Functionality

1. Every outbound email sent by the system (e.g., "Request More Details" from WorkRequest) automatically creates an OUTBOUND `EmailCorrespondence` record linked to the source entity.
2. The system polls the operations inbox (operations@jpowerusa.com) on a schedule, matches incoming replies to entities, and creates INBOUND records.
3. Users can view the full email thread for any entity via a dialog (right-click → "View Correspondence") or via the dedicated Correspondence page.
4. Unread inbound replies surface as a badge on entity tables and in the Log nav.
5. Real-time updates via SSE — when a new reply arrives on any client, all open dialogs and cell components refresh automatically.
6. Fully generic — adding correspondence to a new entity type requires zero backend changes.

## Architecture

Uses the same polymorphic reference pattern as Comment: `entityType + entityId`.
No FK from parent entity to EmailCorrespondence. All lookups are query-based.

```
EmailCorrespondence
  entityType  ("WorkRequest", "LotoPoint", ...)
  entityId    (123, 456, ...)
  direction   (OUTBOUND | INBOUND)
  subject     (email subject line)
  bodyContent (full email body, TEXT column)
  sender      (from address)
  recipient   (to address)
  sentDateTime
  internetMessageId   (Message-ID header — used for reply matching)
  conversationId      (Graph conversation thread ID — used for thread matching)
  graphMessageId      (Graph message ID — used for deduplication + marking read)
  isRead      (false for new INBOUND, true for all OUTBOUND)
  needsAttention
  correspondenceType  (ManyToOne → Value, e.g. "Request Details", "Notification", "General")
  Inherited: id, createdBy, modifiedBy, dateCreated, dateModified, deleted
```

### Email Response Matching (3-layer strategy)

When an incoming email is polled, `EmailResponseMatcherService` matches it to an entity:

1. **In-Reply-To header** → look up `internetMessageId` in `EmailCorrespondenceRepo` — most reliable
2. **Conversation ID** → match `conversationId` on any existing record in the same thread
3. **Subject pattern** → regex `(?:Work Request|WR)\s*#(\d+)` extracts entity ID from subject

### Three-Tier UI

| Component | Location | Purpose |
|-----------|----------|---------|
| `CorrespondencePageComponent` | `/log/correspondence` | Full table across all entities |
| `CorrespondenceDialogComponent` | Global in `app.component.html` | Email thread for one entity |
| `CorrespondenceCellComponent` | Entity table columns | Unread badge, opens dialog on click |

---

## Backend

### Entity
[EmailCorrespondence.java](../../../src/main/java/com/dk_power/power_plant_java/entities/base_entities/EmailCorrespondence.java)
- Extends `BaseAuditEntity`, implements `Referenceable`
- `@EntityListeners(FieldChangeEntityListener.class)` (inherited from `BaseIdEntity`)
- `@Where(clause = "deleted=false")`, `@Audited`
- `Direction` enum: `OUTBOUND` / `INBOUND`
- `correspondenceType` → `@ManyToOne Value` — categorization via Value/Category system

### Repository
[EmailCorrespondenceRepo.java](../../../src/main/java/com/dk_power/power_plant_java/repository/base_repositories/EmailCorrespondenceRepo.java)
- `findByEntityTypeAndEntityIdOrderBySentDateTimeDesc(entityType, entityId)` — primary fetch
- `findByInternetMessageId(internetMessageId)` — reply matching
- `findByConversationId(conversationId)` — thread matching
- `findByGraphMessageId(graphMessageId)` — duplicate prevention
- `countUnreadForEntity(entityType, entityId)` — JPQL count for badges
- `findDuplicateGraphMessageIds()` — dedup detection
- `findByGraphMessageIdOrderByIdAsc(graphMessageId)` — dedup resolution

### DTO + Mapper
[EmailCorrespondenceDto.java](../../../src/main/java/com/dk_power/power_plant_java/dto/base_dtos/EmailCorrespondenceDto.java)
[EmailCorrespondenceMapper.java](../../../src/main/java/com/dk_power/power_plant_java/mappers/EmailCorrespondenceMapper.java)
- Mapper defaults to "General" correspondenceType if none provided

### Service
[NgEmailCorrespondenceService.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/angular/NgEmailCorrespondenceService.java)
- `getCorrespondenceForEntity(entityType, entityId)` — polymorphic query
- `markAsRead(correspondenceId)` — sets `isRead = true`
- `saveOutbound(entityType, entityId, subject, body, recipient, typeName)` — called when system sends email

### Email Reading (Graph API)
[ApiEmailService.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/email/ApiEmailService.java)
- `getMessagesSince(userEmail, since, pageSize)` — reads inbox since a date via Microsoft Graph
- Endpoint: `GET /v1.0/users/{email}/messages?$filter=receivedDateTime ge {date}Z`
- Requires `Mail.Read` Azure AD permission (in addition to existing `Mail.Send`)

### Matching + Polling
[EmailResponseMatcherService.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/email/EmailResponseMatcherService.java)
- Three-strategy matching (see Architecture section)

[EmailPollingService.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/email/EmailPollingService.java)
- `@Scheduled(fixedDelayString = "${email.poll.interval:600000}")` — every 10 minutes
- Skips already-processed messages (by `graphMessageId`)
- `triggerManualPoll()` exposed via REST for manual trigger

### Controller
[NgEmailCorrespondenceController.java](../../../src/main/java/com/dk_power/power_plant_java/controller/angular/NgEmailCorrespondenceController.java)
- `GET /ng/email-correspondence/{entityType}/{entityId}` — all correspondence for entity
- `POST /ng/email-correspondence/search` — paginated search for page
- `POST /ng/email-correspondence/{id}/mark-read` — mark as read
- `POST /ng/email-correspondence/poll` — manual inbox poll trigger
- `GET /ng/email-correspondence/{entityType}/{entityId}/unread-count` — count for badge

### Configuration
```properties
# application.properties
email.poll.interval=600000    # 10 minutes (ms)
spring.task.scheduling.enabled=true

# application-secrets.properties (gitignored)
email.graph.from=operations@jpowerusa.com
```

---

## Frontend

### Model
[email-correspondence.model.ts](../../../frontend/src/app/models/base/email-correspondence.model.ts)
- `EmailCorrespondenceModel` interface + `EmailCorrespondenceDto` class
- `direction: 'OUTBOUND' | 'INBOUND'`
- `toJson()` / `static fromJson()` following Comment pattern

### Service
[email-correspondence.service.ts](../../../frontend/src/app/services/email-correspondence.service.ts)
- `getForEntity(entityType, entityId)` → `GET /ng/email-correspondence/{entityType}/{entityId}`
- `search(criteria, page, pageSize)` → `POST /ng/email-correspondence/search`
- `markAsRead(id)` → `POST /ng/email-correspondence/{id}/mark-read`
- `triggerPoll()` → `POST /ng/email-correspondence/poll`

### Dialog Service
[correspondence-dialog.service.ts](../../../frontend/src/app/shared/correspondence-dialog/correspondence-dialog.service.ts)
- Signals: `_isVisible`, `_entityType`, `_entityId`
- `open(entityType, entityId)` / `close()`
- SSE subscription to `SyncUpdateService.getEntityTypeUpdates$('EmailCorrespondence')`
- `correspondenceChanged$` Subject with `debounceTime(300)` — notifies consumers of new/updated correspondence

### Dialog Component
[correspondence-dialog.component.ts](../../../frontend/src/app/shared/correspondence-dialog/correspondence-dialog.component.ts)
- Registered globally in `app.component.html` alongside `<app-comments-dialog />`
- Loads correspondence when `dialogService.isVisible()` becomes true
- Auto-marks INBOUND records as read on open
- `stripHtml()` helper strips HTML from email body for clean display
- Direction badge (Sent/Received), type badge, unread indicator

### Cell Component
[correspondence-cell.component.ts](../../../frontend/src/app/shared/correspondence-dialog/correspondence-cell.component.ts)
- `@Input() entityType`, `@Input() entityId`
- Green "N new" badge if unread count > 0; blue count badge if total > 0; "—" if empty
- `ngOnChanges()` triggers `loadCounts()`
- Subscribes to `correspondenceDialogService.correspondenceChanged$` for real-time refresh

### Correspondence Page
[correspondence-page.component.ts](../../../frontend/src/app/features/log/correspondence-page/correspondence-page.component.ts)
- Route: `/log/correspondence` (sub-route of Log page)
- Toolbar: search input, direction filter (All/Sent/Received), entity type filter, unread count, Refresh, "Check Inbox" buttons
- Sortable table: Date, Direction, Entity Type, Entity ID, Subject, From, To, Status
- Row click opens `CorrespondenceDialogComponent` for that entity
- "Check Inbox" calls `triggerPoll()` for on-demand polling

### Router Menu
[router-menu.model.ts](../../../frontend/src/app/models/ui/router-menu.model.ts)
- Log group items: `[{ route: '/log/table', label: 'System Log' }, { route: '/log/correspondence', label: 'Correspondence' }]`

---

## Sync

Change tracking is automatic via `BaseIdEntity`'s `@EntityListeners(FieldChangeEntityListener.class)`.
Both client-side and sync server require explicit registration.

### Client-Side Registration

| File | Change |
|------|--------|
| [EntityTableRegistry.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/EntityTableRegistry.java) | `"EmailCorrespondence" -> "email_correspondence"` in table map; `"EmailCorrespondence"` in SYNC_ORDER after `"Comment"` |
| [ServiceFacade.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/ServiceFacade.java) | `NgEmailCorrespondenceService` injected; `serviceMap.put("EmailCorrespondence", ...)` |
| [FullSyncToServerService.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FullSyncToServerService.java) | `EmailCorrespondenceRepo` injected; added to `ENTITY_SYNC_ORDER`, `countAllEntities()`, `getRepositoryForType()` |

### Deduplication

[EmailCorrespondenceMergeService.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/EmailCorrespondenceMergeService.java)

**Problem**: Multiple clients may both have `EmailPollingService` running simultaneously. Each independently polls the same inbox and creates an INBOUND record for the same email, resulting in duplicates after sync.

**Strategy**: Deduplicate by `graphMessageId` (unique Graph API message ID). After every sync batch, `FieldSyncService.afterCommit()` calls `mergeIfDuplicatesExist()`:
- Query for graphMessageIds appearing more than once
- Keep the lowest-ID record (deterministic — all clients pick the same canonical)
- Soft-delete duplicates (with SyncContext cleared so deletions generate FieldChange records and propagate to peers)

**No FK transfers needed**: EmailCorrespondence is a leaf entity — no other entity holds a FK into it.

Wired into [FieldSyncService.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FieldSyncService.java) alongside `categoryValueMergeService`, `workRequestMergeService`, `jhaMergeService`.

### Sync Server Registration
[ServerEntitySyncService.java](../../../../sync-server/src/main/java/com/dk_power/sync_server/service/ServerEntitySyncService.java)
- `"EmailCorrespondence"` added to `SUPPORTED_TYPES`
- `EmailCorrespondenceRepository` injected
- Cases added to `createEntity()`, `getRepository()`, `getTableName()` switches

[EmailCorrespondence.java (sync-server mirror)](../../../../sync-server/src/main/java/com/dk_power/sync_server/entity/domain/EmailCorrespondence.java)
[EmailCorrespondenceRepository.java](../../../../sync-server/src/main/java/com/dk_power/sync_server/repository/domain/EmailCorrespondenceRepository.java)

### Hub-Peer

No additional changes needed. The hub runs the same `power_plant_java` binary with `sync.role=hub`. Since `ServiceFacade` and `FieldSyncService` are already updated, hub support is automatic. Hibernate creates the `email_correspondence` table on startup.

---

## Integrating with a New Entity Type

No backend changes needed. EmailCorrespondence is already generic.

**Frontend only:**

1. Add a `CorrespondenceCellComponent` column in the entity's table mapper:
```typescript
{
  id: 'correspondence',
  header: 'Responses',
  width: 120,
  component: CorrespondenceCellComponent,
  componentInputs: (item) => ({ entityType: 'MyEntity', entityId: item.id })
}
```

2. Add a context menu action:
```typescript
{
  id: 'correspondence',
  label: 'View Correspondence',
  icon: '📬',
  action: (item) => {
    this.correspondenceDialogService.open('MyEntity', item.id);
    this.closeContextMenu();
  }
}
```

3. When sending an email from the entity service, call:
```java
emailCorrespondenceService.saveOutbound("MyEntity", entityId, subject, body, recipient, "Notification");
```

---

## WorkRequest Integration

When "Request More Details" is triggered from the WorkRequest context menu:

1. `NgWorkRequestService.requestMoreDetails()` sends the email via `EmailFacadeService`
2. Immediately after, calls `emailCorrespondenceService.saveOutbound("WorkRequest", id, subject, body, email, "Request Details")`
3. WorkRequest status is updated to "Pending More Info"
4. When the submitter replies, `EmailPollingService` polls the inbox, `EmailResponseMatcherService` matches the reply (via In-Reply-To or conversationId), and saves it as an INBOUND record
5. `CorrespondenceCellComponent` in the WorkRequest table shows the unread count badge

See also: [work-request-lifecycle.md](../permits/work-request/work-request-lifecycle.md)

---

## Verification

1. Start the app — Hibernate creates `email_correspondence` table, no startup errors
2. Right-click a WorkRequest → "Request More Details" — check DB: one OUTBOUND record appears
3. POST `/ng/email-correspondence/poll` — verify INBOUND records created from inbox
4. Open WorkRequest table — "Responses" column shows unread count badge
5. Right-click WorkRequest → "View Correspondence" — dialog shows full thread
6. Navigate to `/log/correspondence` — all records visible with filters
7. Check Sync Dashboard — EmailCorrespondence appears in entity counts
8. Two clients: both poll simultaneously → after sync, only one INBOUND record remains (dedup)
