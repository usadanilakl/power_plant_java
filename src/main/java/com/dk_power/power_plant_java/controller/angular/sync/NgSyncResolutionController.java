package com.dk_power.power_plant_java.controller.angular.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.sync.DriftPeer;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.sevice.sync.DriftDetectionService;
import com.dk_power.power_plant_java.sevice.ServiceFacade;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import com.dk_power.power_plant_java.sevice.sync.EntityVerificationService;
import com.dk_power.power_plant_java.sevice.sync.FieldSyncService;
import com.dk_power.power_plant_java.sevice.sync.SyncResolutionService;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Transient;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Angular-facing controller for resolving sync mismatches.
 * Provides per-entity and per-type resolution (accept local/remote).
 */
@RestController
@RequestMapping("/ng/sync/resolve")
@RequiredArgsConstructor
@Slf4j
public class NgSyncResolutionController {

    private final FieldSyncService fieldSyncService;
    private final ServiceFacade serviceFacade;
    private final SyncConfig syncConfig;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final EntityVerificationService entityVerificationService;
    private final SyncResolutionService syncResolutionService;
    private final DriftDetectionService driftDetectionService;

    private static final Set<String> EXCLUDED_FIELDS = Set.of(
        "id", "version", "dateCreated", "dateModified", "objectType", "serialVersionUID",
        "hibernateLazyInitializer", "handler"
    );
    private static final ConcurrentHashMap<Class<?>, List<Field>> FIELD_CACHE = new ConcurrentHashMap<>();

    /**
     * Accept the server's version of a single entity.
     * Fetches entity data from hub and applies it locally.
     * Works for both existing entities (UPDATE) and server-only entities (CREATE).
     */
    @PostMapping("/accept-remote/{entityType}/{entityId}")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> acceptRemote(
            @PathVariable String entityType,
            @PathVariable Long entityId) {
        try {
            String syncServerUrl = syncConfig.getSyncServerUrl();
            Map<String, String> serverData = fetchServerEntityData(entityType, entityId, syncServerUrl);
            if (serverData == null) {
                return ResponseEntity.ok(new NgApiResponse<>(null, "Entity not found on server"));
            }

            // Check if entity exists locally to decide CREATE vs UPDATE
            SyncableService<?> service = serviceFacade.getService(entityType);
            boolean existsLocally = service != null && service.getEntityById(entityId) != null;

            List<FieldChange> changes = buildFieldChangesFromData(
                entityType, entityId, serverData, existsLocally);

            if (changes.isEmpty()) {
                return ResponseEntity.ok(new NgApiResponse<>(
                    Map.of("applied", 0), "No fields to apply"));
            }

            int applied = fieldSyncService.applyIncomingChanges(changes);

            return ResponseEntity.ok(new NgApiResponse<>(
                Map.of("applied", applied, "entityType", entityType, "entityId", entityId,
                    "mode", existsLocally ? "UPDATE" : "CREATE"),
                "Accepted remote version: " + applied + " fields applied"));
        } catch (Exception e) {
            log.error("Accept remote failed for {}#{}: {}", entityType, entityId, e.getMessage(), e);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    /**
     * Accept the local version of a single entity.
     * Builds fresh CREATE changes from the entity's current state and sends to hub.
     * Works for both local-only entities and stale entities.
     */
    @PostMapping("/accept-local/{entityType}/{entityId}")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> acceptLocal(
            @PathVariable String entityType,
            @PathVariable Long entityId) {
        try {
            SyncableService<?> service = serviceFacade.getService(entityType);
            if (service == null) {
                return ResponseEntity.ok(new NgApiResponse<>(null, "Unknown entity type: " + entityType));
            }

            BaseIdEntity entity = (BaseIdEntity) service.getEntityById(entityId);
            if (entity == null) {
                return ResponseEntity.ok(new NgApiResponse<>(null, "Entity not found locally"));
            }

            // Build fresh CREATE changes from the entity's current state.
            // This ensures even entities whose FieldChange records are already synced
            // will have their full state sent to the hub.
            List<FieldChange> freshChanges = buildCreateChangesFromEntity(entityType, entityId, entity);

            if (freshChanges.isEmpty()) {
                return ResponseEntity.ok(new NgApiResponse<>(
                    Map.of("sent", 0), "No fields to send"));
            }

            String syncServerUrl = syncConfig.getSyncServerUrl();
            int sent = sendChangesToHub(freshChanges, syncServerUrl);

            return ResponseEntity.ok(new NgApiResponse<>(
                Map.of("sent", sent, "entityType", entityType, "entityId", entityId),
                "Pushed local entity: " + sent + " field changes sent to hub"));
        } catch (Exception e) {
            log.error("Accept local failed for {}#{}: {}", entityType, entityId, e.getMessage(), e);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    /**
     * Accept a SINGLE field (hub's value or local's) — the field-level reconcile the content-hash drift
     * tooling needs. Unlike accept-local/accept-remote (which replay the WHOLE entity and can clobber a
     * concurrent edit to a different field of the same row), this emits exactly one field's change:
     * <ul>
     *   <li>{@code source=hub}: overwrite the local field with the hub's current value (one UPDATE, applied
     *       locally);</li>
     *   <li>{@code source=local}: push the local field's value up to the hub (one UPDATE stamped with the
     *       {@code -RESOLVE} machine id so the hub's LWW accepts it over its existing value).</li>
     * </ul>
     * On success the row's HUB drift records are marked RECONCILED so the badge clears immediately.
     */
    @PostMapping("/accept-field/{entityType}/{entityId}/{fieldName}")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> acceptField(
            @PathVariable String entityType, @PathVariable Long entityId, @PathVariable String fieldName,
            @RequestParam(name = "source", defaultValue = "hub") String source) {
        try {
            SyncableService<?> service = serviceFacade.getService(entityType);
            if (service == null) {
                return ResponseEntity.ok(new NgApiResponse<>(null, "Unknown entity type: " + entityType));
            }
            BaseIdEntity entity = (BaseIdEntity) service.getEntityById(entityId);
            if (entity == null) {
                return ResponseEntity.ok(new NgApiResponse<>(null, "Entity not found locally"));
            }

            if ("hub".equalsIgnoreCase(source)) {
                Map<String, String> hubData = fetchServerEntityData(entityType, entityId, syncConfig.getSyncServerUrl());
                if (hubData == null || !hubData.containsKey(fieldName)) {
                    return ResponseEntity.ok(new NgApiResponse<>(null, "Field not present on hub: " + fieldName));
                }
                // HashMap (not Map.of) so a hub-null value — i.e. "accept hub" means CLEAR the field — is allowed.
                Map<String, String> single = new HashMap<>();
                single.put(fieldName, hubData.get(fieldName));
                List<FieldChange> changes = buildFieldChangesFromData(entityType, entityId, single, true);
                // A relationship field (@ManyToOne/@ManyToMany/@OneToMany) is serialized as an id / id-list;
                // without relationshipType the apply path treats it as a scalar and dead-letters it. The
                // content-hash oracle DOES flag relationship drift, so this field can reach here — stamp it.
                changes.forEach(c -> c.setRelationshipType(relationshipTypeFor(entity.getClass(), c.getFieldName())));
                int applied = fieldSyncService.applyIncomingChanges(changes);
                if (applied <= 0) {
                    // Nothing landed (LWW-rejected / dead-lettered / deferred) — DO NOT clear the badge.
                    return ResponseEntity.ok(new NgApiResponse<>(
                            Map.of("applied", 0, "field", fieldName, "source", "hub"),
                            "Hub value did not apply — drift left flagged for " + fieldName));
                }
                // Re-evaluate the row against the oracle (closes it ONLY if the WHOLE row now matches the
                // hub — accepting one field of a multi-field-drifted row must not clear the others' drift).
                driftDetectionService.detectHubForType(entityType);
                return ResponseEntity.ok(new NgApiResponse<>(
                        Map.of("applied", applied, "field", fieldName, "source", "hub"),
                        "Accepted hub value for " + fieldName));
            }

            // source=local
            FieldChange change = buildLocalFieldChange(entityType, entityId, entity, fieldName);
            if (change == null) {
                return ResponseEntity.ok(new NgApiResponse<>(null, "Not a syncable field: " + fieldName));
            }
            int sent = sendChangesToHub(List.of(change), syncConfig.getSyncServerUrl());
            if (sent <= 0) {
                // Hub offline / rejected — the value did NOT land, so the drift is unresolved. Keep it flagged.
                return ResponseEntity.ok(new NgApiResponse<>(
                        Map.of("sent", 0, "field", fieldName, "source", "local"),
                        "Hub did not accept the change — drift left flagged for " + fieldName));
            }
            // The hub applies the push asynchronously, so we do NOT eagerly reconcile here — the next scan
            // clears the badge once the hub has actually converged (avoids a premature "resolved").
            return ResponseEntity.ok(new NgApiResponse<>(
                    Map.of("sent", sent, "field", fieldName, "source", "local"),
                    "Pushed local value for " + fieldName + " — will reconcile once the hub applies it"));
        } catch (Exception e) {
            log.error("Accept field {}#{}.{} failed: {}", entityType, entityId, fieldName, e.getMessage(), e);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    /** Build ONE UPDATE FieldChange from the local entity's current value for {@code fieldName} (or null). */
    private FieldChange buildLocalFieldChange(String entityType, Long entityId, BaseIdEntity entity, String fieldName) {
        for (Field f : getTrackableFields(entity.getClass())) {
            if (!f.getName().equals(fieldName)) continue;
            try {
                FieldChange fc = new FieldChange(
                        entityType, entityId, fieldName, null, serializeValue(f.get(entity)),
                        syncConfig.getMachineId() + "-RESOLVE", syncConfig.getMachineName(),
                        FieldChange.ChangeType.UPDATE);
                // A relationship field must carry its type or the hub apply treats the id/id-list as a scalar.
                fc.setRelationshipType(relationshipTypeFor(entity.getClass(), fieldName));
                fc.setTimestamp(Instant.now());
                return fc;
            } catch (Exception e) {
                log.trace("buildLocalFieldChange {}.{}: {}", entityType, fieldName, e.getMessage());
                return null;
            }
        }
        return null; // not a trackable field
    }

    /** JPA relationship kind for a field ("ManyToOne"/"ManyToMany"/"OneToMany"), or null for a scalar —
     *  mirrors how FieldChangeTracker tags real changes so a synthesized change dispatches the same way. */
    private String relationshipTypeFor(Class<?> entityClass, String fieldName) {
        for (Field f : getTrackableFields(entityClass)) {
            if (!f.getName().equals(fieldName)) continue;
            if (f.isAnnotationPresent(ManyToOne.class)) return "ManyToOne";
            if (f.isAnnotationPresent(ManyToMany.class)) return "ManyToMany";
            if (f.isAnnotationPresent(OneToMany.class)) return "OneToMany";
            return null;
        }
        return null;
    }

    /**
     * Resync a specific entity type from a given date.
     */
    @PostMapping("/resync-type/{entityType}")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> resyncType(
            @PathVariable String entityType,
            @RequestParam(required = false) String since) {
        try {
            String syncServerUrl = syncConfig.getSyncServerUrl();
            if (syncServerUrl == null || syncServerUrl.isEmpty()) {
                return ResponseEntity.ok(new NgApiResponse<>(null, "Sync server URL not configured"));
            }

            LocalDate sinceDate = since != null ? LocalDate.parse(since) : LocalDate.now().minusDays(7);

            List<FieldChange> changes = fetchChangesFromHub(entityType, sinceDate, syncServerUrl);
            if (changes.isEmpty()) {
                return ResponseEntity.ok(new NgApiResponse<>(
                    Map.of("applied", 0), "No changes found on hub for " + entityType + " since " + sinceDate));
            }

            int applied = fieldSyncService.applyIncomingChanges(changes);

            return ResponseEntity.ok(new NgApiResponse<>(
                Map.of("applied", applied, "entityType", entityType, "since", sinceDate.toString(),
                    "totalReceived", changes.size()),
                "Resync complete: " + applied + " changes applied for " + entityType));
        } catch (Exception e) {
            log.error("Resync type failed for {}: {}", entityType, e.getMessage(), e);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    /**
     * Bulk resolution: accept local or remote for multiple entities of the same type.
     */
    @PostMapping("/bulk")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> bulkResolve(
            @RequestBody BulkResolveRequest request) {
        try {
            if (request.getEntityIds() == null || request.getEntityIds().isEmpty()) {
                return ResponseEntity.ok(new NgApiResponse<>(null, "No entity IDs provided"));
            }

            int totalResolved = 0;
            List<String> errors = new ArrayList<>();
            String syncServerUrl = syncConfig.getSyncServerUrl();

            for (Long entityId : request.getEntityIds()) {
                try {
                    if ("ACCEPT_REMOTE".equals(request.getResolution())) {
                        Map<String, String> serverData = fetchServerEntityData(
                            request.getEntityType(), entityId, syncServerUrl);
                        if (serverData != null) {
                            SyncableService<?> svc = serviceFacade.getService(request.getEntityType());
                            boolean existsLocally = svc != null && svc.getEntityById(entityId) != null;
                            List<FieldChange> changes = buildFieldChangesFromData(
                                request.getEntityType(), entityId, serverData, existsLocally);
                            fieldSyncService.applyIncomingChanges(changes);
                            totalResolved++;
                        }
                    } else if ("ACCEPT_LOCAL".equals(request.getResolution())) {
                        SyncableService<?> svc = serviceFacade.getService(request.getEntityType());
                        if (svc != null) {
                            BaseIdEntity entity = (BaseIdEntity) svc.getEntityById(entityId);
                            if (entity != null) {
                                List<FieldChange> freshChanges = buildCreateChangesFromEntity(
                                    request.getEntityType(), entityId, entity);
                                sendChangesToHub(freshChanges, syncServerUrl);
                                totalResolved++;
                            }
                        }
                    }
                } catch (Exception e) {
                    errors.add(request.getEntityType() + "#" + entityId + ": " + e.getMessage());
                    log.warn("Bulk resolve failed for {}#{}: {}", request.getEntityType(), entityId, e.getMessage());
                }
            }

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("resolved", totalResolved);
            result.put("total", request.getEntityIds().size());
            result.put("entityType", request.getEntityType());
            result.put("resolution", request.getResolution());
            if (!errors.isEmpty()) result.put("errors", errors);

            return ResponseEntity.ok(new NgApiResponse<>(result,
                "Bulk resolve: " + totalResolved + "/" + request.getEntityIds().size()));
        } catch (Exception e) {
            log.error("Bulk resolve failed: {}", e.getMessage(), e);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    // ==================== Dependency-Aware Push/Pull ====================

    /**
     * Preview: show what entities will be pushed/pulled (with dependencies).
     */
    @GetMapping("/preview/{entityType}/{entityId}")
    public ResponseEntity<NgApiResponse<SyncResolutionService.PushPullPreview>> preview(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @RequestParam(defaultValue = "push") String direction) {
        try {
            SyncResolutionService.PushPullPreview preview = "pull".equals(direction)
                ? syncResolutionService.previewPull(entityType, entityId)
                : syncResolutionService.previewPush(entityType, entityId);
            return ResponseEntity.ok(new NgApiResponse<>(preview,
                preview.getTotalCount() + " entities to " + direction));
        } catch (Exception e) {
            log.error("Preview failed for {}#{}: {}", entityType, entityId, e.getMessage(), e);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Preview failed: " + e.getMessage()));
        }
    }

    /**
     * Execute push with dependency walking.
     * Pushes the entity + all missing dependencies to hub in SYNC_ORDER.
     */
    @PostMapping("/execute-push/{entityType}/{entityId}")
    public ResponseEntity<NgApiResponse<SyncResolutionService.PushResult>> executePush(
            @PathVariable String entityType,
            @PathVariable Long entityId) {
        try {
            SyncResolutionService.PushResult result = syncResolutionService.pushWithDependencies(entityType, entityId);
            return ResponseEntity.ok(new NgApiResponse<>(result, result.getMessage()));
        } catch (Exception e) {
            log.error("Push failed for {}#{}: {}", entityType, entityId, e.getMessage(), e);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Push failed: " + e.getMessage()));
        }
    }

    /**
     * Execute pull with dependency walking.
     * Pulls the entity + all related entities from hub and applies locally.
     */
    @PostMapping("/execute-pull/{entityType}/{entityId}")
    public ResponseEntity<NgApiResponse<SyncResolutionService.PullResult>> executePull(
            @PathVariable String entityType,
            @PathVariable Long entityId) {
        try {
            SyncResolutionService.PullResult result = syncResolutionService.pullWithDependencies(entityType, entityId);
            return ResponseEntity.ok(new NgApiResponse<>(result, result.getMessage()));
        } catch (Exception e) {
            log.error("Pull failed for {}#{}: {}", entityType, entityId, e.getMessage(), e);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Pull failed: " + e.getMessage()));
        }
    }

    // ==================== SharePoint Resolution ====================

    /**
     * Accept the SharePoint version of a single entity.
     * Applies all SP field values to the local entity.
     */
    @PostMapping("/accept-sp/{entityType}/{entityId}")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> acceptSharePoint(
            @PathVariable String entityType,
            @PathVariable Long entityId) {
        try {
            int applied = entityVerificationService.acceptFromSharePoint(entityType, entityId);
            return ResponseEntity.ok(new NgApiResponse<>(
                Map.of("applied", applied, "entityType", entityType, "entityId", entityId),
                "Accepted SharePoint version: " + applied + " fields applied"));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.ok(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            log.error("Accept SP failed for {}#{}: {}", entityType, entityId, e.getMessage(), e);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    // ==================== Private helpers ====================

    /**
     * Build FieldChange records from server entity data.
     * If entity doesn't exist locally, creates a CREATE marker + CREATE field changes
     * so FieldSyncService will create the entity. Otherwise uses UPDATE.
     */
    private List<FieldChange> buildFieldChangesFromData(String entityType, Long entityId,
                                                         Map<String, String> fieldData,
                                                         boolean existsLocally) {
        List<FieldChange> changes = new ArrayList<>();
        String hubMachineId = "HUB";
        String hubMachineName = "Hub Server";
        FieldChange.ChangeType changeType = existsLocally ? FieldChange.ChangeType.UPDATE : FieldChange.ChangeType.CREATE;

        if (!existsLocally) {
            // Add CREATE marker so FieldSyncService knows to create the entity
            FieldChange createMarker = new FieldChange(
                entityType, entityId, "_entity_",
                null, "CREATED",
                hubMachineId, hubMachineName,
                FieldChange.ChangeType.CREATE
            );
            createMarker.setTimestamp(Instant.now());
            changes.add(createMarker);
        }

        for (Map.Entry<String, String> entry : fieldData.entrySet()) {
            FieldChange change = new FieldChange(
                entityType, entityId, entry.getKey(),
                null, entry.getValue(),
                hubMachineId, hubMachineName,
                changeType
            );
            change.setTimestamp(Instant.now());
            changes.add(change);
        }
        return changes;
    }

    /**
     * Build fresh CREATE FieldChange records from the entity's current field values.
     * Used for accept-local: sends the full entity state to hub as new changes.
     */
    private List<FieldChange> buildCreateChangesFromEntity(String entityType, Long entityId,
                                                            BaseIdEntity entity) {
        List<FieldChange> changes = new ArrayList<>();
        // Use "-RESOLVE" suffix so hub's LWW tiebreaker doesn't reject these
        String machineId = syncConfig.getMachineId() + "-RESOLVE";
        String machineName = syncConfig.getMachineName();

        // CREATE marker
        FieldChange createMarker = new FieldChange(
            entityType, entityId, "_entity_",
            null, "CREATED",
            machineId, machineName,
            FieldChange.ChangeType.CREATE
        );
        changes.add(createMarker);

        // Serialize each field
        for (Field field : getTrackableFields(entity.getClass())) {
            try {
                Object value = field.get(entity);
                if (value != null) {
                    String serialized = serializeValue(value);
                    if (serialized != null) {
                        FieldChange fieldChange = new FieldChange(
                            entityType, entityId, field.getName(),
                            null, serialized,
                            machineId, machineName,
                            FieldChange.ChangeType.CREATE
                        );
                        changes.add(fieldChange);
                    }
                }
            } catch (Exception e) {
                log.trace("Could not serialize field {}: {}", field.getName(), e.getMessage());
            }
        }

        return changes;
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
        if (Modifier.isStatic(field.getModifiers())) return false;
        if (Modifier.isFinal(field.getModifiers())) return false;
        if (field.isAnnotationPresent(OneToMany.class)) {
            OneToMany otm = field.getAnnotation(OneToMany.class);
            if (otm.mappedBy() != null && !otm.mappedBy().isEmpty()) return false;
        }
        return true;
    }

    private Map<String, String> fetchServerEntityData(String entityType, Long entityId, String syncServerUrl) {
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

    private List<FieldChange> fetchChangesFromHub(String entityType, LocalDate since, String syncServerUrl) {
        String url = syncServerUrl + "/api/sync/changes/by-type/" + entityType
            + "?since=" + since.atStartOfDay().toInstant(java.time.ZoneOffset.UTC).toString();
        HttpHeaders headers = buildHeaders();
        try {
            ResponseEntity<List<FieldChange>> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers),
                new ParameterizedTypeReference<>() {});
            List<FieldChange> changes = response.getBody();
            return changes != null ? changes : Collections.emptyList();
        } catch (Exception e) {
            log.warn("Could not fetch changes from hub for {}: {}", entityType, e.getMessage());
            return Collections.emptyList();
        }
    }

    private int sendChangesToHub(List<FieldChange> changes, String syncServerUrl) {
        String url = syncServerUrl + "/api/sync/exchange";
        HttpHeaders headers = buildHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("machineId", syncConfig.getMachineId());
        body.put("machineName", syncConfig.getMachineName());
        body.put("changes", changes);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
            // A 2xx status alone doesn't mean acceptance — the hub returns
            // success=false in the body on failure (migration in progress, batch
            // too large, etc.). Don't report "pushed" for rejected changes.
            if (!response.getStatusCode().is2xxSuccessful()) {
                log.warn("Hub exchange returned non-2xx status: {}", response.getStatusCode());
                return 0;
            }
            Map<?, ?> respBody = response.getBody();
            if (respBody != null && Boolean.FALSE.equals(respBody.get("success"))) {
                log.warn("Hub rejected exchange: {}", respBody.get("errorMessage"));
                return 0;
            }
            Object received = respBody != null ? respBody.get("changesReceived") : null;
            return received instanceof Number n ? n.intValue() : changes.size();
        } catch (Exception e) {
            log.warn("Could not send changes to hub: {}", e.getMessage());
            return 0;
        }
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Machine-Id", syncConfig.getMachineId());
        headers.set("X-Machine-Name", syncConfig.getMachineName());
        headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));
        return headers;
    }

    @Data
    public static class BulkResolveRequest {
        private String entityType;
        private String resolution;  // "ACCEPT_LOCAL" or "ACCEPT_REMOTE"
        private List<Long> entityIds;
    }
}
