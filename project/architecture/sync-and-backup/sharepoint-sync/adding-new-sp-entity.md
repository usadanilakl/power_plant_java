# Adding a New SharePoint-Backed Entity

## Checklist

Adding a new SP-backed entity (e.g., HotWork, ConfinedSpace) requires 4 steps. The orchestrator auto-discovers the new `@Component`.

### 1. Create SharePoint Adapter

**File**: `sevice/sharepoint/adapters/XxxSharePointAdapter.java`

Handles column mapping between SP list and DTO. Follow the existing pattern:

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class XxxSharePointAdapter {
    private final SharepointAccessService spService;
    private final SharePointCertificateAccess certAccess;
    private final PowerAutomateV2Client v2Client;

    private static final String LIST_TITLE = "Your SP List Title";

    public List<XxxDto> getAll() {
        return spService.executeWithFallback(this::certGetAll, this::paGetAll, "getAll Xxx");
    }

    private List<XxxDto> certGetAll() {
        List<JsonNode> items = certAccess.getListItems(LIST_TITLE);
        return items.stream().map(this::mapFromSharePoint).collect(Collectors.toList());
    }

    private XxxDto mapFromSharePoint(JsonNode item) {
        XxxDto dto = new XxxDto();
        dto.setSharepointId(item.path("ID").asText(item.path("Id").asText(null)));
        // Map SP columns to DTO fields...
        dto.setSpModifiedTime(parseInstant(item.path("Modified").asText(null)));
        return dto;
    }

    // IMPORTANT: parse Modified for field-level merge
    private static Instant parseInstant(String raw) {
        if (raw == null || raw.isEmpty()) return null;
        try { return Instant.parse(raw); }
        catch (Exception e) { return null; }
    }
}
```

### 2. Create SharePointSyncable Implementation

**File**: `sevice/sharepoint/syncables/XxxSharePointSyncable.java`

Implements `SharePointSyncable<XxxDto>`. Follow the WR/JHA pattern:

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class XxxSharePointSyncable implements SharePointSyncable<XxxDto> {

    private final XxxSharePointAdapter adapter;
    private final XxxRepo repo;
    private final XxxMapper mapper;
    private final NgValueService valueService;
    private final XxxMergeService mergeService;
    private final SharePointFieldMergeService fieldMergeService;

    private static final String ENTITY_TYPE = "Xxx";
    private static final String LIST_TITLE = "Your SP List Title";

    private static final Map<String, String> FIELD_MAPPING = Map.ofEntries(
        Map.entry("entityField", "SpColumnName"),
        // ... all mapped fields
    );

    @Override public String getEntityTypeName() { return ENTITY_TYPE; }
    @Override public String getSharePointListTitle() { return LIST_TITLE; }
    @Override public List<XxxDto> fetchAllFromSharePoint() { return adapter.getAll(); }
    @Override public String getSharepointId(XxxDto dto) { return dto.getSharepointId(); }
    @Override public boolean supportsAutoClose() { return false; } // or true
    @Override public Map<String, String> getFieldMapping() { return FIELD_MAPPING; }
    @Override public Instant getSpModifiedTime(XxxDto dto) { return dto.getSpModifiedTime(); }

    @Override
    @Transactional
    public EntitySyncOutcome processRemoteItem(XxxDto remote, SyncResult result) {
        // Follow WR/JHA pattern: field-level merge via fieldMergeService
    }

    @Override
    public Map<String, String> extractSpFieldValues(XxxDto dto) {
        // Map SP column names to their string values from the DTO
    }

    @Override
    public void applySelectiveFields(Object entityObj, XxxDto dto, Set<String> fields) {
        // Set only the specified fields on the entity
    }

    // ... remaining interface methods
}
```

### 3. Create Merge Service

**File**: `sevice/sync/XxxMergeService.java`

For leaf entities (no owned FKs):

```java
@Service
@Slf4j
public class XxxMergeService extends SharePointMergeTemplate<Xxx> {
    public XxxMergeService(SyncContext syncContext) { super(syncContext); }

    @Override protected String tableName() { return "xxx"; }
    @Override protected String entityName() { return "Xxx"; }
    @Override protected Class<Xxx> entityClass() { return Xxx.class; }
    @Override protected String naturalKeyColumn() { return "sharepoint_id"; }
    @Override protected String jpaFieldName() { return "sharepointId"; }
    @Override protected String logPrefix() { return "[Xxx Merge]"; }
    @Override protected void markDeleted(Xxx entity) { entity.setDeleted(true); }
}
```

For entities with owned FKs, override `transferRelationships()` (see `WorkRequestMergeService`).

### 4. Register in DedupKeyResolver

**File**: `sevice/sync/DedupKeyResolver.java`

Add the natural key mapping:

```java
NATURAL_KEYS.put("Xxx", "sharepointId");
```

## DTO Requirements

The DTO class must have:

- `private String sharepointId;`
- `private java.time.Instant spModifiedTime;`

## Entity Requirements

The entity must:

- Extend `BaseIdEntity` (provides `deleted`, `id`, entity listeners)
- Have a `sharepointId` field
- Have `@Where(clause = "deleted = false")` annotation

## Repository Requirements

Add duplicate-tolerant query:

```java
Optional<Xxx> findFirstBySharepointIdOrderByIdAsc(String sharepointId);
```

## Verification

After implementation:

1. `mvn compile` — all new classes compile
2. Start app → orchestrator logs: `Registered N syncable entity types: WorkRequest, Jha, Xxx`
3. `POST /api/sharepoint-sync/sync/Xxx` → returns SyncResult
4. `GET /api/sharepoint-sync/status` → includes Xxx status
5. Check `sharepoint_snapshot` table → snapshots created for synced entities
