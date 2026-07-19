package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.sevice.ServiceFacade;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Desktop-side service for comparing local entities against the hub.
 * Provides entity-type-level comparison (which IDs differ) and
 * entity-level comparison (which fields differ for a specific entity).
 */
@Service
@Slf4j
public class SyncComparisonService {

    private final SyncConfig syncConfig;
    private final JdbcTemplate jdbcTemplate;
    private final EntityTableRegistry entityTableRegistry;
    private final ServiceFacade serviceFacade;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final ConcurrentHashMap<Class<?>, List<FieldInfo>> FIELD_CACHE = new ConcurrentHashMap<>();
    private static final Set<String> EXCLUDED_FIELDS = Set.of(
        "id", "version", "dateCreated", "dateModified", "objectType", "serialVersionUID",
        "hibernateLazyInitializer", "handler"
    );

    public SyncComparisonService(SyncConfig syncConfig,
                                  JdbcTemplate jdbcTemplate,
                                  EntityTableRegistry entityTableRegistry,
                                  ServiceFacade serviceFacade,
                                  RestTemplate restTemplate,
                                  ObjectMapper objectMapper) {
        this.syncConfig = syncConfig;
        this.jdbcTemplate = jdbcTemplate;
        this.entityTableRegistry = entityTableRegistry;
        this.serviceFacade = serviceFacade;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    // ==================== Cached server IDs for quick checks ====================
    private final Map<String, CachedIds> serverIdCache = new ConcurrentHashMap<>();

    private static class CachedIds {
        final Set<Long> ids;
        final long fetchedAtMs;
        CachedIds(Set<Long> ids) { this.ids = ids; this.fetchedAtMs = System.currentTimeMillis(); }
        boolean isExpired() { return System.currentTimeMillis() - fetchedAtMs > 30_000; }
    }

    public Set<Long> getCachedServerIds(String entityType) {
        CachedIds cached = serverIdCache.get(entityType);
        if (cached != null && !cached.isExpired()) return cached.ids;
        String syncServerUrl = syncConfig.getSyncServerUrl();
        if (syncServerUrl == null || syncServerUrl.isEmpty()) return Collections.emptySet();
        Set<Long> ids = fetchServerEntityIds(entityType, syncServerUrl);
        serverIdCache.put(entityType, new CachedIds(ids));
        return ids;
    }

    /**
     * Quick sync status check for a single entity.
     */
    @Transactional(readOnly = true)
    public EntitySyncStatus checkEntitySync(String entityType, Long entityId) {
        if (!entityTableRegistry.isRegistered(entityType)) {
            throw new IllegalArgumentException("Unknown entity type: " + entityType);
        }
        EntitySyncStatus status = new EntitySyncStatus();
        status.setEntityType(entityType);
        status.setEntityId(entityId);

        SyncableService<?> service = serviceFacade.getService(entityType);
        Object localEntity = service != null ? service.getEntityById(entityId) : null;
        status.setExistsLocally(localEntity != null);

        try {
            Set<Long> serverIds = getCachedServerIds(entityType);
            status.setExistsOnServer(serverIds.contains(entityId));
        } catch (Exception e) {
            status.setExistsOnServer(false);
            status.setStatus("UNKNOWN");
            return status;
        }

        if (!status.isExistsLocally() && !status.isExistsOnServer()) { status.setStatus("NOT_FOUND"); return status; }
        if (status.isExistsLocally() && !status.isExistsOnServer()) {
            status.setStatus("LOCAL_ONLY");
            if (localEntity instanceof com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity bie && bie.getDateModified() != null)
                status.setLocalModified(bie.getDateModified().atZone(java.time.ZoneId.systemDefault()).toInstant());
            return status;
        }
        if (!status.isExistsLocally()) { status.setStatus("SERVER_ONLY"); return status; }

        // Both exist — compare timestamps
        try {
            String syncServerUrl = syncConfig.getSyncServerUrl();
            Map<Long, Instant> serverTs = fetchServerTimestamps(entityType, List.of(entityId), syncServerUrl);
            Instant serverTime = serverTs.get(entityId);
            status.setServerModified(serverTime);

            if (localEntity instanceof com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity bie) {
                Instant localTime = bie.getDateModified() != null ? bie.getDateModified().atZone(java.time.ZoneId.systemDefault()).toInstant() : null;
                status.setLocalModified(localTime);
                if (localTime != null && serverTime != null) {
                    long diff = Math.abs(localTime.getEpochSecond() - serverTime.getEpochSecond());
                    if (diff <= 5) { status.setTimestampsMatch(true); status.setStatus("IN_SYNC"); }
                    else if (localTime.isAfter(serverTime)) status.setStatus("STALE_SERVER");
                    else status.setStatus("STALE_LOCAL");
                } else { status.setTimestampsMatch(true); status.setStatus("IN_SYNC"); }
            }
        } catch (Exception e) {
            status.setTimestampsMatch(true);
            status.setStatus("IN_SYNC");
        }
        return status;
    }

    @Transactional(readOnly = true)
    public List<EntitySyncStatus> checkEntitiesSync(String entityType, List<Long> entityIds) {
        List<EntitySyncStatus> results = new ArrayList<>();
        for (Long id : entityIds) {
            try { results.add(checkEntitySync(entityType, id)); }
            catch (Exception e) {
                EntitySyncStatus err = new EntitySyncStatus();
                err.setEntityType(entityType); err.setEntityId(id); err.setStatus("UNKNOWN");
                results.add(err);
            }
        }
        return results;
    }

    /**
     * Compare local vs hub entity IDs for a given entity type.
     * Returns which IDs are local-only, server-only, and common.
     */
    public EntityComparisonResult compareEntityType(String entityType) {
        if (!entityTableRegistry.isRegistered(entityType)) {
            throw new IllegalArgumentException("Unknown entity type: " + entityType);
        }

        String syncServerUrl = syncConfig.getSyncServerUrl();
        if (syncServerUrl == null || syncServerUrl.isEmpty()) {
            throw new IllegalStateException("Sync server URL not configured");
        }

        // Get local IDs
        Set<Long> localIds = getLocalEntityIds(entityType);

        // Get server IDs
        Set<Long> serverIds = fetchServerEntityIds(entityType, syncServerUrl);

        // Compute differences
        Set<Long> localOnly = new LinkedHashSet<>(localIds);
        localOnly.removeAll(serverIds);

        Set<Long> serverOnly = new LinkedHashSet<>(serverIds);
        serverOnly.removeAll(localIds);

        Set<Long> common = new LinkedHashSet<>(localIds);
        common.retainAll(serverIds);

        // For common IDs, check timestamp differences (stale records)
        List<StaleEntity> staleEntities = Collections.emptyList();
        if (!common.isEmpty() && common.size() <= 5000) {
            staleEntities = findStaleEntities(entityType, new ArrayList<>(common), syncServerUrl);
        }

        return EntityComparisonResult.builder()
            .entityType(entityType)
            .localCount(localIds.size())
            .serverCount(serverIds.size())
            .localOnly(new ArrayList<>(localOnly))
            .serverOnly(new ArrayList<>(serverOnly))
            .commonCount(common.size())
            .staleEntities(staleEntities)
            .build();
    }

    /**
     * Compare a single entity field-by-field: local vs hub.
     */
    @Transactional(readOnly = true)
    public EntityFieldDiff compareEntity(String entityType, Long entityId) {
        String syncServerUrl = syncConfig.getSyncServerUrl();
        if (syncServerUrl == null || syncServerUrl.isEmpty()) {
            throw new IllegalStateException("Sync server URL not configured");
        }

        // Fetch server entity data
        Map<String, String> serverData = fetchServerEntityData(entityType, entityId, syncServerUrl);
        if (serverData == null) {
            throw new IllegalStateException("Entity not found on server: " + entityType + "#" + entityId);
        }

        // Get local entity data
        Map<String, String> localData = getLocalEntityData(entityType, entityId);
        if (localData == null) {
            throw new IllegalStateException("Entity not found locally: " + entityType + "#" + entityId);
        }

        // Compare field-by-field
        Set<String> allFields = new LinkedHashSet<>();
        allFields.addAll(localData.keySet());
        allFields.addAll(serverData.keySet());

        List<FieldDiffEntry> diffs = new ArrayList<>();
        for (String fieldName : allFields) {
            String localValue = localData.get(fieldName);
            String serverValue = serverData.get(fieldName);

            if (!Objects.equals(localValue, serverValue)) {
                diffs.add(FieldDiffEntry.builder()
                    .fieldName(fieldName)
                    .localValue(localValue)
                    .serverValue(serverValue)
                    .build());
            }
        }

        return EntityFieldDiff.builder()
            .entityType(entityType)
            .entityId(entityId)
            .diffs(diffs)
            .build();
    }

    // NOTE: the timestamp-based getAllEntityTypeSummaries()/scanAllTypesForDrift() one-pass scan was
    // removed with the old Compare panel; compareEntityType() (still used by 3-way verify) stays, and the
    // Drift Center now scans via compareEntityTypeByContent() below (content-hash, not ids/timestamps).

    // ==================== Content-hash drift (Inc 0b harness) ====================

    /**
     * Content hashes (id -> rowHash) for every local non-deleted entity of a type — computed the
     * SAME way as the hub ({@code serviceFacade.getService(type).getAll()} + {@code serializeEntityFields}
     * + {@link SyncContentHasher}) so identical state hashes identically.
     */
    @Transactional(readOnly = true)
    public Map<Long, String> computeLocalContentHashes(String entityType) {
        SyncableService<?> service = serviceFacade.getService(entityType);
        if (service == null) return Collections.emptyMap();
        Map<Long, String> out = new HashMap<>();
        for (Object o : service.getAll()) {
            if (!(o instanceof BaseIdEntity be) || be.getId() == null) continue;
            out.put(be.getId(), SyncContentHasher.hashRow(serializeEntityFields(be)));
        }
        return out;
    }

    /**
     * Compare a type's CONTENT (not just ids/timestamps) against the hub. Cheap path: compare the
     * per-type digest; only on mismatch fetch the hub's full id->hash map and diff. Report-only.
     */
    @Transactional(readOnly = true)
    public ContentDriftSummary compareEntityTypeByContent(String entityType) {
        String url = syncConfig.getSyncServerUrl();
        if (url == null || url.isEmpty()) {
            return ContentDriftSummary.builder().entityType(entityType).error("no sync server configured").build();
        }
        Map<Long, String> local = computeLocalContentHashes(entityType);
        String localDigest = SyncContentHasher.typeDigest(local);

        Object serverDigest = null;
        try {
            Map<String, Object> summary = fetchServerContentHashSummary(entityType, url);
            serverDigest = summary != null ? summary.get("typeDigest") : null;
        } catch (Exception e) {
            return ContentDriftSummary.builder().entityType(entityType).error("hub probe failed: " + e.getMessage()).build();
        }
        if (localDigest.equals(serverDigest)) {
            return ContentDriftSummary.builder().entityType(entityType)
                .localCount(local.size()).serverCount(local.size()).inSync(true).build();
        }

        Map<Long, String> server = fetchServerContentHashes(entityType, url);
        List<Long> differing = new ArrayList<>();
        List<Long> missingLocally = new ArrayList<>(); // on hub, absent locally
        List<Long> missingOnHub = new ArrayList<>();    // local, absent on hub
        for (Map.Entry<Long, String> e : local.entrySet()) {
            String s = server.get(e.getKey());
            if (s == null) missingOnHub.add(e.getKey());
            else if (!s.equals(e.getValue())) differing.add(e.getKey());
        }
        for (Long id : server.keySet()) if (!local.containsKey(id)) missingLocally.add(id);
        return ContentDriftSummary.builder()
            .entityType(entityType).localCount(local.size()).serverCount(server.size())
            .differing(differing).missingLocally(missingLocally).missingOnHub(missingOnHub)
            .inSync(differing.isEmpty() && missingLocally.isEmpty() && missingOnHub.isEmpty())
            .build();
    }

    /** Content-drift dry run across every synced type. On-demand only (1-2 hub calls per type). */
    public List<ContentDriftSummary> scanAllTypesForContentDrift() {
        List<ContentDriftSummary> result = new ArrayList<>();
        for (String entityType : entityTableRegistry.getSyncOrder()) {
            try {
                ContentDriftSummary s = compareEntityTypeByContent(entityType);
                if (!s.isInSync() || s.getError() != null) result.add(s);
            } catch (Exception e) {
                log.warn("Content drift scan failed for {}: {}", entityType, e.getMessage());
                result.add(ContentDriftSummary.builder().entityType(entityType).error(e.getMessage()).build());
            }
        }
        return result;
    }

    private Map<String, Object> fetchServerContentHashSummary(String entityType, String syncServerUrl) {
        ResponseEntity<Map<String, Object>> r = restTemplate.exchange(
            syncServerUrl + "/api/sync/entity-content-hash-summary/" + entityType,
            HttpMethod.GET, new HttpEntity<>(buildHeaders()), new ParameterizedTypeReference<>() {});
        return r.getBody();
    }

    private Map<Long, String> fetchServerContentHashes(String entityType, String syncServerUrl) {
        ResponseEntity<Map<Long, String>> r = restTemplate.exchange(
            syncServerUrl + "/api/sync/entity-content-hashes/" + entityType,
            HttpMethod.GET, new HttpEntity<>(buildHeaders()), new ParameterizedTypeReference<>() {});
        return r.getBody() != null ? r.getBody() : Collections.emptyMap();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContentDriftSummary {
        private String entityType;
        private int localCount;
        private int serverCount;
        @Builder.Default private List<Long> differing = new ArrayList<>();
        @Builder.Default private List<Long> missingLocally = new ArrayList<>();
        @Builder.Default private List<Long> missingOnHub = new ArrayList<>();
        private boolean inSync;
        private String error;
    }

    // ==================== Private helpers ====================

    public Set<Long> getLocalEntityIds(String entityType) {
        String tableName = entityTableRegistry.getTableName(entityType);
        List<Long> ids;
        try {
            ids = jdbcTemplate.queryForList(
                "SELECT id FROM " + tableName + " WHERE deleted = false", Long.class);
        } catch (Exception e) {
            ids = jdbcTemplate.queryForList("SELECT id FROM " + tableName, Long.class);
        }
        return new LinkedHashSet<>(ids);
    }

    @SuppressWarnings("unchecked")
    public Set<Long> fetchServerEntityIds(String entityType, String syncServerUrl) {
        String url = syncServerUrl + "/api/sync/entity-ids/" + entityType;
        HttpHeaders headers = buildHeaders();

        ResponseEntity<Set<Long>> response = restTemplate.exchange(
            url, HttpMethod.GET, new HttpEntity<>(headers),
            new ParameterizedTypeReference<>() {});

        Set<Long> ids = response.getBody();
        return ids != null ? ids : Collections.emptySet();
    }

    @SuppressWarnings("unchecked")
    public Map<String, String> fetchServerEntityData(String entityType, Long entityId, String syncServerUrl) {
        String url = syncServerUrl + "/api/sync/entity/" + entityType + "/" + entityId;
        HttpHeaders headers = buildHeaders();

        try {
            ResponseEntity<Map<String, String>> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers),
                new ParameterizedTypeReference<>() {});
            return response.getBody();
        } catch (Exception e) {
            log.debug("Could not fetch entity data from server: {}", e.getMessage());
            return null;
        }
    }

    private List<StaleEntity> findStaleEntities(String entityType, List<Long> commonIds, String syncServerUrl) {
        try {
            // Get server timestamps
            String url = syncServerUrl + "/api/sync/entity-timestamps/" + entityType;
            HttpHeaders headers = buildHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<Map<Long, String>> response = restTemplate.exchange(
                url, HttpMethod.POST, new HttpEntity<>(commonIds, headers),
                new ParameterizedTypeReference<>() {});

            Map<Long, String> serverTimestamps = response.getBody();
            if (serverTimestamps == null) return Collections.emptyList();

            // Get local timestamps
            String tableName = entityTableRegistry.getTableName(entityType);
            Map<Long, Instant> localTimestamps = new HashMap<>();

            int batchSize = 500;
            for (int i = 0; i < commonIds.size(); i += batchSize) {
                List<Long> batch = commonIds.subList(i, Math.min(i + batchSize, commonIds.size()));
                String placeholders = String.join(",", Collections.nCopies(batch.size(), "?"));
                String sql = "SELECT id, date_modified FROM " + tableName + " WHERE id IN (" + placeholders + ")";

                jdbcTemplate.query(sql, batch.toArray(), rs -> {
                    long id = rs.getLong("id");
                    java.sql.Timestamp ts = rs.getTimestamp("date_modified");
                    if (ts != null) localTimestamps.put(id, ts.toInstant());
                });
            }

            // Compare timestamps
            List<StaleEntity> stale = new ArrayList<>();
            for (Map.Entry<Long, String> entry : serverTimestamps.entrySet()) {
                Long id = entry.getKey();
                Instant serverTime = Instant.parse(entry.getValue());
                Instant localTime = localTimestamps.get(id);

                if (localTime != null && !localTime.equals(serverTime)) {
                    long diffSeconds = Math.abs(localTime.getEpochSecond() - serverTime.getEpochSecond());
                    if (diffSeconds > 5) { // ignore sub-5s differences (clock skew)
                        stale.add(StaleEntity.builder()
                            .entityId(id)
                            .localModified(localTime)
                            .serverModified(serverTime)
                            .localNewer(localTime.isAfter(serverTime))
                            .build());
                    }
                }
            }
            return stale;
        } catch (Exception e) {
            log.debug("Could not compare timestamps for {}: {}", entityType, e.getMessage());
            return Collections.emptyList();
        }
    }

    public Map<String, String> getLocalEntityData(String entityType, Long entityId) {
        SyncableService<?> service = serviceFacade.getService(entityType);
        if (service == null) return null;

        BaseIdEntity entity = (BaseIdEntity) service.getEntityById(entityId);
        if (entity == null) return null;

        return serializeEntityFields(entity);
    }

    private Map<String, String> serializeEntityFields(BaseIdEntity entity) {
        Map<String, String> fieldMap = new LinkedHashMap<>();
        for (FieldInfo fi : getFields(entity.getClass())) {
            try {
                Object value = fi.field.get(entity);
                fieldMap.put(fi.name, serializeValue(value));
            } catch (Exception e) {
                log.trace("Could not read field {}: {}", fi.name, e.getMessage());
            }
        }
        return fieldMap;
    }

    private String serializeValue(Object value) {
        if (value == null) return null;
        try {
            if (value instanceof BaseIdEntity) {
                Long id = ((BaseIdEntity) value).getId();
                return id != null ? String.valueOf(id) : null;
            }
            if (value instanceof Collection) {
                Collection<?> col = (Collection<?>) value;
                if (!col.isEmpty() && col.iterator().next() instanceof BaseIdEntity) {
                    List<Long> ids = new ArrayList<>();
                    for (Object item : col) {
                        Long id = ((BaseIdEntity) item).getId();
                        if (id != null) ids.add(id);
                    }
                    return objectMapper.writeValueAsString(ids);
                }
            }
            if (value instanceof Enum) return ((Enum<?>) value).name();
            if (value instanceof String) return (String) value;
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return String.valueOf(value);
        }
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Machine-Id", syncConfig.getMachineId());
        headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));
        return headers;
    }

    private List<FieldInfo> getFields(Class<?> clazz) {
        return FIELD_CACHE.computeIfAbsent(clazz, this::buildFieldList);
    }

    private List<FieldInfo> buildFieldList(Class<?> clazz) {
        List<FieldInfo> fields = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        Class<?> current = clazz;
        while (current != null && current != Object.class) {
            for (Field field : current.getDeclaredFields()) {
                if (!seen.add(field.getName())) continue;
                if (shouldTrack(field)) {
                    field.setAccessible(true);
                    fields.add(new FieldInfo(field, field.getName()));
                }
            }
            current = current.getSuperclass();
        }
        return fields;
    }

    private boolean shouldTrack(Field field) {
        if (EXCLUDED_FIELDS.contains(field.getName())) return false;
        if (field.isAnnotationPresent(Transient.class)) return false;
        if (field.isAnnotationPresent(JsonIgnore.class) && !field.isAnnotationPresent(ManyToOne.class)) return false;
        if (Modifier.isStatic(field.getModifiers())) return false;
        if (Modifier.isFinal(field.getModifiers())) return false;
        if (field.isAnnotationPresent(OneToMany.class)) {
            OneToMany otm = field.getAnnotation(OneToMany.class);
            if (otm.mappedBy() != null && !otm.mappedBy().isEmpty()) return false;
        }
        return true;
    }

    private record FieldInfo(Field field, String name) {}

    private Map<Long, Instant> fetchServerTimestamps(String entityType, List<Long> entityIds, String syncServerUrl) {
        String url = syncServerUrl + "/api/sync/entity-timestamps/" + entityType;
        HttpHeaders headers = buildHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<Map<Long, String>> response = restTemplate.exchange(
            url, HttpMethod.POST, new HttpEntity<>(entityIds, headers),
            new ParameterizedTypeReference<>() {});
        Map<Long, String> raw = response.getBody();
        if (raw == null) return Collections.emptyMap();
        Map<Long, Instant> result = new HashMap<>();
        for (Map.Entry<Long, String> entry : raw.entrySet()) {
            try { result.put(entry.getKey(), Instant.parse(entry.getValue())); }
            catch (Exception ignored) {}
        }
        return result;
    }

    // ==================== DTOs ====================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EntityComparisonResult {
        private String entityType;
        private int localCount;
        private int serverCount;
        private List<Long> localOnly;
        private List<Long> serverOnly;
        private int commonCount;
        private List<StaleEntity> staleEntities;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StaleEntity {
        private Long entityId;
        private Instant localModified;
        private Instant serverModified;
        private boolean localNewer;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EntityFieldDiff {
        private String entityType;
        private Long entityId;
        private List<FieldDiffEntry> diffs;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FieldDiffEntry {
        private String fieldName;
        private String localValue;
        private String serverValue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EntitySyncStatus {
        private String entityType;
        private Long entityId;
        private boolean existsLocally;
        private boolean existsOnServer;
        private boolean timestampsMatch;
        private Instant localModified;
        private Instant serverModified;
        private String status;
    }
}
