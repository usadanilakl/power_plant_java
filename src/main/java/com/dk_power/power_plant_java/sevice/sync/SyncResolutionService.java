package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Dependency-aware sync resolution.
 * Walks the entity relationship graph and pushes/pulls ALL related entities
 * in SYNC_ORDER to prevent FK constraint failures.
 */
@Service
@Slf4j
public class SyncResolutionService {

    private final ServiceFacade serviceFacade;
    private final SyncConfig syncConfig;
    private final SyncComparisonService syncComparisonService;
    private final FieldSyncService fieldSyncService;
    private final EntityTableRegistry entityTableRegistry;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final ConcurrentHashMap<Class<?>, List<RelationshipField>> REL_CACHE = new ConcurrentHashMap<>();
    private static final ConcurrentHashMap<Class<?>, List<Field>> FIELD_CACHE = new ConcurrentHashMap<>();
    private static final Set<String> EXCLUDED_FIELDS = Set.of(
        "id", "version", "dateCreated", "dateModified", "objectType", "serialVersionUID",
        "hibernateLazyInitializer", "handler"
    );

    public SyncResolutionService(ServiceFacade serviceFacade,
                                  SyncConfig syncConfig,
                                  SyncComparisonService syncComparisonService,
                                  FieldSyncService fieldSyncService,
                                  EntityTableRegistry entityTableRegistry,
                                  RestTemplate restTemplate,
                                  ObjectMapper objectMapper) {
        this.serviceFacade = serviceFacade;
        this.syncConfig = syncConfig;
        this.syncComparisonService = syncComparisonService;
        this.fieldSyncService = fieldSyncService;
        this.entityTableRegistry = entityTableRegistry;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Preview: collect the dependency graph and check what's missing on the target.
     * Does NOT execute any sync — just returns the plan.
     */
    @Transactional(readOnly = true)
    public PushPullPreview previewPush(String entityType, Long entityId) {
        return buildPreview(entityType, entityId, "push", computePushSet(entityType, entityId));
    }

    /**
     * The set of entities an "Accept Local" push will send to the hub:
     * dependencies are included only when missing on the hub (so we never clobber
     * unrelated hub data to satisfy FKs), but the TARGET entity is ALWAYS included —
     * even when the hub already has it — because the user explicitly chose to
     * overwrite the hub's (stale) copy. The force-overwrite happens via LWW:
     * {@link #buildCreateChangesFromEntity} stamps changes with now() and a
     * "-RESOLVE" machine id so the hub accepts them over its existing values.
     */
    private List<EntityRef> computePushSet(String entityType, Long entityId) {
        List<EntityRef> graph = collectDependencyGraph(entityType, entityId);
        List<EntityRef> pushSet = filterMissingOnHub(graph);

        boolean targetIncluded = pushSet.stream().anyMatch(
            r -> r.entityType.equals(entityType) && Objects.equals(r.entityId, entityId));
        if (!targetIncluded) {
            pushSet.add(new EntityRef(entityType, entityId));
        }
        return pushSet;
    }

    @Transactional(readOnly = true)
    public PushPullPreview previewPull(String entityType, Long entityId) {
        // For pull, we check what's missing locally from the hub's graph
        // Since we can't walk the hub's graph directly, we use the comparison service
        // to find what's on the hub but not locally for the requested type
        List<EntityRef> refs = new ArrayList<>();
        refs.add(new EntityRef(entityType, entityId));

        // Also check if the entity's dependencies are present locally
        SyncableService<?> svc = serviceFacade.getService(entityType);
        if (svc != null) {
            // Entity might not exist locally for pull — that's fine
            Object entity = svc.getEntityById(entityId);
            if (entity == null) {
                // Can't walk graph locally — just return the single entity
                return buildPreview(entityType, entityId, "pull", refs);
            }
        }

        List<EntityRef> graph = collectDependencyGraph(entityType, entityId);
        List<EntityRef> missingLocally = filterMissingLocally(graph);
        return buildPreview(entityType, entityId, "pull", missingLocally);
    }

    /**
     * Execute push: walk graph, build changes for missing entities, send to hub.
     */
    @Transactional(readOnly = true)
    public PushResult pushWithDependencies(String entityType, Long entityId) {
        List<EntityRef> toPush = computePushSet(entityType, entityId);

        if (toPush.isEmpty()) {
            return new PushResult(0, 0, Map.of(), "Nothing to push (entity not found locally)");
        }

        // Sort by SYNC_ORDER
        toPush.sort(Comparator.comparingInt(ref ->
            entityTableRegistry.getSyncOrder().indexOf(ref.entityType)));

        // Build FieldChange records for the target (force overwrite) + missing dependencies
        List<FieldChange> allChanges = new ArrayList<>();
        Map<String, Integer> countByType = new LinkedHashMap<>();

        for (EntityRef ref : toPush) {
            SyncableService<?> svc = serviceFacade.getService(ref.entityType);
            if (svc == null) continue;
            BaseIdEntity entity = (BaseIdEntity) svc.getEntityById(ref.entityId);
            if (entity == null) continue;

            List<FieldChange> changes = buildCreateChangesFromEntity(ref.entityType, ref.entityId, entity);
            allChanges.addAll(changes);
            countByType.merge(ref.entityType, 1, Integer::sum);
        }

        // Send all as a single batch to hub
        int sent = sendChangesToHub(allChanges);

        return new PushResult(toPush.size(), sent, countByType,
            "Pushed " + toPush.size() + " entities (" + sent + " field changes)");
    }

    /**
     * Execute pull: fetch the target from the hub AND every entity it references (transitively) that is
     * MISSING locally, then apply them together in SYNC_ORDER. This is what makes "Use Hub" actually resolve
     * a relationship field pointing at a locally-absent entity: the old version discovered dependencies only
     * from the LOCAL entity's fields, so a locally-missing reference was never found. Here the graph is SEEDED
     * from the HUB payload's relationship ids, so the referenced rows are created before the FK/join rows that
     * point at them, and the relationship fields carry their type so the apply dispatches through the M2O/M2M
     * branches (a bare scalar change never sets an FK). Bounded by a cap.
     */
    public PullResult pullWithDependencies(String entityType, Long entityId) {
        String url = syncConfig.getSyncServerUrl();
        if (url == null || url.isEmpty()) {
            return new PullResult(0, 0, Map.of(), "Sync server URL not configured");
        }

        Set<String> visited = new HashSet<>();
        java.util.Deque<EntityRef> queue = new java.util.ArrayDeque<>();
        queue.add(new EntityRef(entityType, entityId));
        Map<EntityRef, Map<String, String>> fetched = new LinkedHashMap<>();
        final int cap = 500;

        while (!queue.isEmpty() && fetched.size() < cap) {
            EntityRef ref = queue.poll();
            if (!visited.add(ref.entityType + "#" + ref.entityId)) continue;
            Map<String, String> hubData;
            try {
                hubData = syncComparisonService.fetchServerEntityData(ref.entityType, ref.entityId, url);
            } catch (Exception e) {
                log.debug("pull: hub fetch failed for {}#{}: {}", ref.entityType, ref.entityId, e.getMessage());
                continue;
            }
            if (hubData == null) continue;
            fetched.put(ref, hubData);
            // Follow this entity's relationship refs; enqueue only those MISSING locally (they block resolution).
            for (EntityRef child : refsFromHubData(ref.entityType, hubData)) {
                if (visited.contains(child.entityType + "#" + child.entityId)) continue;
                SyncableService<?> csvc = serviceFacade.getService(child.entityType);
                if (csvc == null || csvc.getEntityById(child.entityId) == null) {
                    queue.add(child);
                }
            }
        }

        if (!queue.isEmpty()) {
            // Cap hit — some referenced entities were never fetched. If one of those is a NOT-NULL reference of a
            // fetched row, that row simply won't apply (isolated below), so surface the truncation instead of a
            // silent partial pull.
            log.warn("pull: dependency graph for {}#{} hit the cap of {}; {} referenced entit(ies) not pulled — "
                    + "a NOT-NULL reference among them can leave its target unresolved", entityType, entityId, cap, queue.size());
        }
        if (fetched.isEmpty()) {
            return new PullResult(0, 0, Map.of(), "No data found on hub");
        }

        // Apply PER-ENTITY in SYNC_ORDER (referenced rows first, each in its OWN transaction) so one bad row —
        // a referenced entity created with a missing NOT-NULL scalar/FK, or a leaf past the cap — fails ALONE
        // instead of rolling the whole "Use Hub" back and reporting a hollow success. applyIncomingChanges returns
        // 0 (it does NOT throw) when its own tx rolls back, so a leaf failure just contributes 0 here; the frontend
        // re-scan after this call is the source of truth for whether the badge clears.
        List<EntityRef> ordered = new ArrayList<>(fetched.keySet());
        ordered.sort(Comparator.comparingInt(r -> entityTableRegistry.getSyncOrder().indexOf(r.entityType)));

        Map<String, Integer> countByType = new LinkedHashMap<>();
        int applied = 0, unresolved = 0;
        for (EntityRef ref : ordered) {
            SyncableService<?> svc = serviceFacade.getService(ref.entityType);
            boolean existsLocally = svc != null && svc.getEntityById(ref.entityId) != null;
            List<FieldChange> changes = buildHubChangesWithRelTypes(ref.entityType, ref.entityId, fetched.get(ref), existsLocally);
            if (changes.isEmpty()) continue;
            countByType.merge(ref.entityType, 1, Integer::sum);
            int n = fieldSyncService.applyIncomingChanges(changes); // own tx; returns 0 (not throws) on rollback
            applied += n;
            if (!existsLocally && n <= 0) { // a referenced CREATE that never landed (missing NOT-NULL / unfetched ref)
                unresolved++;
                log.warn("pull: {}#{} did not apply (constraint / unfetched reference?) — left for the next scan",
                        ref.entityType, ref.entityId);
            }
        }

        String msg = unresolved == 0
                ? "Pulled " + countByType.size() + " entity type(s) (" + applied + " change(s) applied)"
                : "Pulled " + countByType.size() + " type(s), " + applied + " change(s) applied; "
                        + unresolved + " reference(s) could not be created (see log)";
        return new PullResult(countByType.values().stream().mapToInt(Integer::intValue).sum(), applied, countByType, msg);
    }

    /** Relationship refs (type#id) parsed from a hub entity's serialized fields — the seed for the pull so a
     *  relationship pointing at a locally-missing entity gets that entity pulled. */
    private List<EntityRef> refsFromHubData(String entityType, Map<String, String> hubData) {
        List<EntityRef> refs = new ArrayList<>();
        Class<?> clazz = entityClassFor(entityType);
        if (clazz == null) return refs;
        for (RelationshipField rel : getRelationships(clazz)) {
            String raw = hubData.get(rel.field.getName());
            if (raw == null || raw.isBlank() || "null".equals(raw)) continue;
            Class<?> target = "ManyToOne".equals(rel.type) ? rel.field.getType() : collectionElementType(rel.field);
            if (target == null) continue;
            String refType = target.getSimpleName();
            if (!entityTableRegistry.isRegistered(refType)) continue;
            if ("ManyToOne".equals(rel.type)) {
                Long id = tryParseLong(raw.trim());
                if (id != null) refs.add(new EntityRef(refType, id));
            } else {
                for (Long id : parseIdList(raw)) refs.add(new EntityRef(refType, id));
            }
        }
        return refs;
    }

    /** Build FieldChanges from hub data, tagging relationship fields with their type so the apply dispatches
     *  through the M2O/M2M branches (a plain scalar change would never set an FK). */
    private List<FieldChange> buildHubChangesWithRelTypes(String entityType, Long entityId,
                                                          Map<String, String> hubData, boolean existsLocally) {
        Class<?> clazz = entityClassFor(entityType);
        Map<String, String> relTypes = new HashMap<>();
        if (clazz != null) for (RelationshipField rel : getRelationships(clazz)) relTypes.put(rel.field.getName(), rel.type);
        List<FieldChange> changes = new ArrayList<>();
        FieldChange.ChangeType ct = existsLocally ? FieldChange.ChangeType.UPDATE : FieldChange.ChangeType.CREATE;
        if (!existsLocally) {
            FieldChange marker = new FieldChange(entityType, entityId, "_entity_", null, "CREATED",
                "HUB", "Hub Server", FieldChange.ChangeType.CREATE);
            marker.setTimestamp(Instant.now());
            changes.add(marker);
        }
        for (Map.Entry<String, String> e : hubData.entrySet()) {
            FieldChange fc = new FieldChange(entityType, entityId, e.getKey(), null, e.getValue(),
                "HUB", "Hub Server", ct);
            fc.setTimestamp(Instant.now());
            String rt = relTypes.get(e.getKey());
            if (rt != null) fc.setRelationshipType(rt);
            changes.add(fc);
        }
        return changes;
    }

    private Class<?> entityClassFor(String entityType) {
        try {
            SyncableService<?> svc = serviceFacade.getService(entityType);
            Object proto = svc != null ? svc.getEntity() : null;
            return proto != null ? proto.getClass() : null;
        } catch (Exception e) { return null; }
    }

    private Class<?> collectionElementType(Field f) {
        java.lang.reflect.Type gt = f.getGenericType();
        if (gt instanceof java.lang.reflect.ParameterizedType pt) {
            java.lang.reflect.Type[] args = pt.getActualTypeArguments();
            if (args.length == 1 && args[0] instanceof Class<?> c) return c;
        }
        return null;
    }

    private Long tryParseLong(String s) {
        try { return Long.parseLong(s); } catch (Exception e) { return null; }
    }

    private List<Long> parseIdList(String raw) {
        try { return java.util.Arrays.asList(objectMapper.readValue(raw, Long[].class)); }
        catch (Exception e) { return List.of(); }
    }

    // ==================== Dependency Graph Walking ====================

    /**
     * Walk entity relationships to collect all related entities.
     * Uses cycle detection to prevent infinite recursion.
     */
    @Transactional(readOnly = true)
    public List<EntityRef> collectDependencyGraph(String entityType, Long entityId) {
        Set<String> visited = new HashSet<>(); // "EntityType#ID"
        List<EntityRef> result = new ArrayList<>();
        walkGraph(entityType, entityId, visited, result);
        return result;
    }

    private void walkGraph(String entityType, Long entityId, Set<String> visited, List<EntityRef> result) {
        String key = entityType + "#" + entityId;
        if (visited.contains(key)) return;
        visited.add(key);

        SyncableService<?> svc = serviceFacade.getService(entityType);
        if (svc == null) return;

        Object entity = svc.getEntityById(entityId);
        if (entity == null) return;

        result.add(new EntityRef(entityType, entityId));

        // Walk relationships
        for (RelationshipField rel : getRelationships(entity.getClass())) {
            try {
                Object value = rel.field.get(entity);
                if (value == null) continue;

                if (rel.type.equals("ManyToOne")) {
                    if (value instanceof BaseIdEntity bie && bie.getId() != null) {
                        String refType = bie.getClass().getSimpleName();
                        if (entityTableRegistry.isRegistered(refType)) {
                            walkGraph(refType, bie.getId(), visited, result);
                        }
                    }
                } else if (rel.type.equals("OneToMany") || rel.type.equals("ManyToMany")) {
                    if (value instanceof Collection<?> col) {
                        for (Object item : col) {
                            if (item instanceof BaseIdEntity bie && bie.getId() != null) {
                                String refType = bie.getClass().getSimpleName();
                                if (entityTableRegistry.isRegistered(refType)) {
                                    walkGraph(refType, bie.getId(), visited, result);
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.trace("Could not walk field {}: {}", rel.field.getName(), e.getMessage());
            }
        }
    }

    // ==================== Filtering ====================

    private List<EntityRef> filterMissingOnHub(List<EntityRef> graph) {
        List<EntityRef> missing = new ArrayList<>();
        for (EntityRef ref : graph) {
            try {
                Set<Long> hubIds = syncComparisonService.getCachedServerIds(ref.entityType);
                if (!hubIds.contains(ref.entityId)) {
                    missing.add(ref);
                }
            } catch (Exception e) {
                // Can't check — include it to be safe
                missing.add(ref);
            }
        }
        return missing;
    }

    private List<EntityRef> filterMissingLocally(List<EntityRef> graph) {
        List<EntityRef> missing = new ArrayList<>();
        for (EntityRef ref : graph) {
            SyncableService<?> svc = serviceFacade.getService(ref.entityType);
            if (svc == null || svc.getEntityById(ref.entityId) == null) {
                missing.add(ref);
            }
        }
        return missing;
    }

    // ==================== FieldChange Building ====================

    private List<FieldChange> buildCreateChangesFromEntity(String entityType, Long entityId, BaseIdEntity entity) {
        List<FieldChange> changes = new ArrayList<>();
        // Use machineId + "-RESOLVE" suffix so LWW tiebreaker works on the hub.
        // Without this, the hub saves the change (received), then applyIncomingChanges
        // compares incoming vs the just-saved DB record — same timestamp + same machineId
        // = tiebreaker returns false = change rejected.
        String machineId = syncConfig.getMachineId() + "-RESOLVE";
        String machineName = syncConfig.getMachineName();

        changes.add(new FieldChange(entityType, entityId, "_entity_", null, "CREATED",
            machineId, machineName, FieldChange.ChangeType.CREATE));

        for (Field field : getTrackableFields(entity.getClass())) {
            try {
                Object value = field.get(entity);
                if (value != null) {
                    String serialized = serializeValue(value);
                    if (serialized != null) {
                        FieldChange fc = new FieldChange(entityType, entityId, field.getName(),
                            null, serialized, machineId, machineName, FieldChange.ChangeType.CREATE);
                        // Set relationship type for proper application
                        if (field.isAnnotationPresent(ManyToOne.class)) fc.setRelationshipType("ManyToOne");
                        else if (field.isAnnotationPresent(ManyToMany.class)) fc.setRelationshipType("ManyToMany");
                        changes.add(fc);
                    }
                }
            } catch (Exception e) {
                log.trace("Could not serialize field {}: {}", field.getName(), e.getMessage());
            }
        }
        return changes;
    }

    private List<FieldChange> buildFieldChangesFromData(String entityType, Long entityId,
                                                         Map<String, String> fieldData, boolean existsLocally) {
        List<FieldChange> changes = new ArrayList<>();
        String hubMachineId = "HUB";
        String hubMachineName = "Hub Server";
        FieldChange.ChangeType changeType = existsLocally ? FieldChange.ChangeType.UPDATE : FieldChange.ChangeType.CREATE;

        if (!existsLocally) {
            FieldChange marker = new FieldChange(entityType, entityId, "_entity_", null, "CREATED",
                hubMachineId, hubMachineName, FieldChange.ChangeType.CREATE);
            marker.setTimestamp(Instant.now());
            changes.add(marker);
        }

        for (Map.Entry<String, String> entry : fieldData.entrySet()) {
            FieldChange fc = new FieldChange(entityType, entityId, entry.getKey(),
                null, entry.getValue(), hubMachineId, hubMachineName, changeType);
            fc.setTimestamp(Instant.now());
            changes.add(fc);
        }
        return changes;
    }

    // ==================== Hub Communication ====================

    private int sendChangesToHub(List<FieldChange> changes) {
        String syncServerUrl = syncConfig.getSyncServerUrl();
        String url = syncServerUrl + "/api/sync/exchange";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Machine-Id", syncConfig.getMachineId());
        headers.set("X-Machine-Name", syncConfig.getMachineName());
        headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("machineId", syncConfig.getMachineId());
        body.put("machineName", syncConfig.getMachineName());
        body.put("changes", changes);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
            return interpretHubExchangeResponse(response, changes.size());
        } catch (Exception e) {
            log.error("Failed to send {} changes to hub: {}", changes.size(), e.getMessage());
            return 0;
        }
    }

    /**
     * Interpret the hub's /api/sync/exchange response. The hub returns
     * {success, changesReceived, ...}; a 2xx HTTP status alone does NOT mean the
     * changes were accepted (the hub returns success=false in the body on failure,
     * e.g. migration in progress or batch too large). Returns the hub-reported
     * changesReceived on success, or 0 on any failure — so callers don't report
     * "pushed" for changes the hub rejected.
     */
    private int interpretHubExchangeResponse(ResponseEntity<Map> response, int sentCount) {
        if (response == null || !response.getStatusCode().is2xxSuccessful()) {
            log.warn("Hub exchange returned non-2xx status: {}",
                response != null ? response.getStatusCode() : "null");
            return 0;
        }
        Map<?, ?> respBody = response.getBody();
        if (respBody != null && Boolean.FALSE.equals(respBody.get("success"))) {
            log.warn("Hub rejected exchange: {}", respBody.get("errorMessage"));
            return 0;
        }
        Object received = respBody != null ? respBody.get("changesReceived") : null;
        if (received instanceof Number n) {
            return n.intValue();
        }
        return sentCount;
    }

    // ==================== Reflection Helpers ====================

    private String serializeValue(Object value) {
        if (value == null) return null;
        try {
            if (value instanceof BaseIdEntity bie) {
                Long id = bie.getId();
                return id != null ? String.valueOf(id) : null;
            }
            if (value instanceof Collection<?> col) {
                if (!col.isEmpty() && col.iterator().next() instanceof BaseIdEntity) {
                    List<Long> ids = new ArrayList<>();
                    for (Object item : col) {
                        if (item instanceof BaseIdEntity bie && bie.getId() != null) ids.add(bie.getId());
                    }
                    return objectMapper.writeValueAsString(ids);
                }
            }
            if (value instanceof Enum<?> e) return e.name();
            if (value instanceof String s) return s;
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return String.valueOf(value);
        }
    }

    private List<RelationshipField> getRelationships(Class<?> clazz) {
        return REL_CACHE.computeIfAbsent(clazz, c -> {
            List<RelationshipField> rels = new ArrayList<>();
            Set<String> seen = new HashSet<>();
            Class<?> current = c;
            while (current != null && current != Object.class) {
                for (Field f : current.getDeclaredFields()) {
                    if (!seen.add(f.getName())) continue;
                    f.setAccessible(true);
                    if (f.isAnnotationPresent(ManyToOne.class)) rels.add(new RelationshipField(f, "ManyToOne"));
                    else if (f.isAnnotationPresent(OneToMany.class)) rels.add(new RelationshipField(f, "OneToMany"));
                    else if (f.isAnnotationPresent(ManyToMany.class)) rels.add(new RelationshipField(f, "ManyToMany"));
                }
                current = current.getSuperclass();
            }
            return rels;
        });
    }

    private List<Field> getTrackableFields(Class<?> clazz) {
        return FIELD_CACHE.computeIfAbsent(clazz, c -> {
            List<Field> fields = new ArrayList<>();
            Set<String> seen = new HashSet<>();
            Class<?> current = c;
            while (current != null && current != Object.class) {
                for (Field f : current.getDeclaredFields()) {
                    if (!seen.add(f.getName())) continue;
                    if (shouldTrack(f)) {
                        f.setAccessible(true);
                        fields.add(f);
                    }
                }
                current = current.getSuperclass();
            }
            return fields;
        });
    }

    private boolean shouldTrack(Field field) {
        if (EXCLUDED_FIELDS.contains(field.getName())) return false;
        if (field.isAnnotationPresent(Transient.class)) return false;
        if (field.isAnnotationPresent(JsonIgnore.class) && !field.isAnnotationPresent(ManyToOne.class)) return false;
        if (Modifier.isStatic(field.getModifiers()) || Modifier.isFinal(field.getModifiers())) return false;
        if (field.isAnnotationPresent(OneToMany.class)) {
            OneToMany otm = field.getAnnotation(OneToMany.class);
            if (otm.mappedBy() != null && !otm.mappedBy().isEmpty()) return false;
        }
        return true;
    }

    private PushPullPreview buildPreview(String entityType, Long entityId, String direction, List<EntityRef> entities) {
        Map<String, Integer> countByType = new LinkedHashMap<>();
        for (EntityRef ref : entities) countByType.merge(ref.entityType, 1, Integer::sum);
        return PushPullPreview.builder()
            .entityType(entityType).entityId(entityId).direction(direction)
            .entities(entities).countByType(countByType).totalCount(entities.size())
            .build();
    }

    // ==================== DTOs ====================

    private record RelationshipField(Field field, String type) {}

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EntityRef {
        private String entityType;
        private Long entityId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PushPullPreview {
        private String entityType;
        private Long entityId;
        private String direction;
        private List<EntityRef> entities;
        private Map<String, Integer> countByType;
        private int totalCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PushResult {
        private int entitiesPushed;
        private int changesSent;
        private Map<String, Integer> countByType;
        private String message;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PullResult {
        private int entitiesPulled;
        private int changesApplied;
        private Map<String, Integer> countByType;
        private String message;
    }
}
