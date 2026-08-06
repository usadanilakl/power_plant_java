package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.sevice.ServiceFacade;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncable;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 3-way entity verification: local DB + hub server + SharePoint.
 * For SP-backed entity types, compares all three sources and provides
 * field-level diffs. For non-SP types, falls back to 2-way (local + hub).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EntityVerificationService {

    private final SyncComparisonService syncComparisonService;
    private final SyncConfig syncConfig;
    private final ServiceFacade serviceFacade;
    private final List<SharePointSyncable<?>> syncables;
    private final SyncLabelService syncLabelService;

    private Map<String, SharePointSyncable<?>> syncableMap;

    // Cached SP data per entity type (TTL 60s)
    private final Map<String, CachedSpData> spDataCache = new HashMap<>();

    private Map<String, SharePointSyncable<?>> getSyncableMap() {
        if (syncableMap == null) {
            syncableMap = syncables.stream()
                .collect(Collectors.toMap(SharePointSyncable::getEntityTypeName, s -> s));
        }
        return syncableMap;
    }

    public boolean isSpBacked(String entityType) {
        return getSyncableMap().containsKey(entityType);
    }

    /**
     * Verify entities of a given type across all available sources.
     * If entityIds is null/empty, verifies all entities of that type.
     */
    public VerificationResult verify(String entityType, List<Long> entityIds) {
        SharePointSyncable<?> syncable = getSyncableMap().get(entityType);
        boolean spBacked = syncable != null;

        // Step 1: Get local and hub ID sets
        Set<Long> fullLocalIds;
        Set<Long> fullHubIds;
        List<SyncComparisonService.StaleEntity> staleEntities;

        try {
            fullLocalIds = syncComparisonService.getLocalEntityIds(entityType);
            String syncServerUrl = syncConfig.getSyncServerUrl();
            fullHubIds = syncComparisonService.fetchServerEntityIds(entityType, syncServerUrl);

            // Find stale entities among common IDs
            Set<Long> commonIds = new LinkedHashSet<>(fullLocalIds);
            commonIds.retainAll(fullHubIds);
            SyncComparisonService.EntityComparisonResult twoWay = syncComparisonService.compareEntityType(entityType);
            staleEntities = twoWay.getStaleEntities();
        } catch (Exception e) {
            log.warn("[Verify] Hub comparison failed for {}: {}", entityType, e.getMessage());
            return VerificationResult.builder()
                .entityType(entityType)
                .spBacked(spBacked)
                .hubReachable(false)
                .spReachable(false)
                .totalChecked(-1)    // sentinel: verification incomplete
                .issueCount(-1)      // sentinel: not zero = don't show "all OK"
                .message("Hub unreachable: " + e.getMessage())
                .issues(Collections.emptyList())
                .build();
        }

        // Step 2: If SP-backed, fetch SP data and map to local IDs
        final SpFetchResult spResult;
        final boolean spReachable;
        if (spBacked) {
            SpFetchResult fetched = fetchSpData(syncable);
            spReachable = fetched != null && fetched.reachable;
            spResult = spReachable ? fetched : null;
        } else {
            spResult = null;
            spReachable = false;
        }
        Set<Long> spLocalIds = spResult != null ? spResult.localIdToSpId.keySet() : Collections.emptySet();

        // Build set of all known local/hub IDs
        Set<Long> allIds = new LinkedHashSet<>();
        allIds.addAll(fullLocalIds);
        allIds.addAll(fullHubIds);

        // Filter to requested IDs if specified
        if (entityIds != null && !entityIds.isEmpty()) {
            Set<Long> requestedSet = new LinkedHashSet<>(entityIds);
            allIds.retainAll(requestedSet);
        }

        // Step 3: Build per-entity verification status
        Map<Long, SyncComparisonService.StaleEntity> staleMap = staleEntities.stream()
            .collect(Collectors.toMap(SyncComparisonService.StaleEntity::getEntityId, s -> s, (a, b) -> a));

        List<EntityVerificationStatus> allEntities = new ArrayList<>();
        for (Long id : allIds) {
            boolean inLocal = fullLocalIds.contains(id);
            boolean inHub = fullHubIds.contains(id);
            boolean inSp = spResult != null && spLocalIds.contains(id);

            String localHubStatus = resolveLocalHubStatus(inLocal, inHub, staleMap.get(id));

            // FIX #2: when SP unreachable, inSharePoint = null (unknown), not false
            Boolean inSharePoint;
            String spStatus = null;
            Instant spModified = null;
            if (!spBacked) {
                inSharePoint = null;  // not SP-backed
            } else if (!spReachable) {
                inSharePoint = null;  // SP unreachable — unknown
                spStatus = "UNKNOWN";
            } else {
                inSharePoint = inSp;
                spStatus = inSp ? "PRESENT" : "MISSING_FROM_SP";
                if (inSp && spResult != null) {
                    spModified = spResult.localIdToSpModified.get(id);
                }
            }

            String overallStatus = determineOverallStatus(localHubStatus, spStatus, spBacked, spReachable);

            SyncComparisonService.StaleEntity stale = staleMap.get(id);

            allEntities.add(EntityVerificationStatus.builder()
                .entityId(id)
                .inLocal(inLocal)
                .inHub(inHub)
                .inSharePoint(inSharePoint)
                .localHubStatus(localHubStatus)
                .spStatus(spStatus)
                .overallStatus(overallStatus)
                .localModified(stale != null ? stale.getLocalModified() : null)
                .hubModified(stale != null ? stale.getServerModified() : null)
                .spModified(spModified)
                .build());
        }

        // FIX #1: Add SP_ONLY entities (exist in SharePoint but not in local or hub)
        if (spResult != null && spReachable && !spResult.unmatchedSpIds.isEmpty()) {
            for (String spId : spResult.unmatchedSpIds) {
                Instant spMod = null;
                Object dto = spResult.spIdToDto.get(spId);
                if (dto != null) {
                    try {
                        @SuppressWarnings("unchecked")
                        SharePointSyncable rawSyncable = syncable;
                        spMod = rawSyncable.getSpModifiedTime(dto);
                    } catch (Exception ignored) {}
                }

                allEntities.add(EntityVerificationStatus.builder()
                    .entityId(null)
                    .sharepointId(spId)
                    .inLocal(false)
                    .inHub(false)
                    .inSharePoint(true)
                    .localHubStatus("MISSING")
                    .spStatus("SP_ONLY")
                    .overallStatus("SP_ONLY")
                    .spModified(spMod)
                    .build());
            }
        }

        List<EntityVerificationStatus> issues = allEntities.stream()
            .filter(e -> !"OK".equals(e.getOverallStatus()))
            .collect(Collectors.toList());

        int totalChecked = allIds.size() + (spResult != null ? spResult.unmatchedSpIds.size() : 0);

        return VerificationResult.builder()
            .entityType(entityType)
            .spBacked(spBacked)
            .hubReachable(true)
            .spReachable(spReachable)
            .totalChecked(totalChecked)
            .okCount(allEntities.size() - issues.size())
            .issueCount(issues.size())
            .localCount(fullLocalIds.size())
            .hubCount(fullHubIds.size())
            .spCount(spResult != null ? spResult.totalSpCount : null)
            .spOnlyCount(spResult != null ? spResult.unmatchedSpIds.size() : null)
            .issues(issues)
            .message(issues.isEmpty() ? "All entities verified" : issues.size() + " issue(s) found")
            .build();
    }

    /**
     * 3-way field diff for a single entity.
     * Local values + hub values + SP values side by side, with match flags.
     */
    public ThreeWayFieldDiff threeWayFieldDiff(String entityType, Long entityId) {
        SharePointSyncable<?> syncable = getSyncableMap().get(entityType);
        boolean spBacked = syncable != null;

        // Get local entity data (all fields as string map)
        Map<String, String> localFields = syncComparisonService.getLocalEntityData(entityType, entityId);
        if (localFields == null) localFields = Collections.emptyMap();

        // Get hub entity data
        Map<String, String> hubFields;
        try {
            String syncServerUrl = syncConfig.getSyncServerUrl();
            hubFields = syncComparisonService.fetchServerEntityData(entityType, entityId, syncServerUrl);
            if (hubFields == null) hubFields = Collections.emptyMap();
        } catch (Exception e) {
            hubFields = Collections.emptyMap();
        }

        // Get SP data mapped to entity field names
        Map<String, String> spFields = new LinkedHashMap<>();
        Instant spModified = null;
        if (spBacked && syncable != null) {
            SpFetchResult spFetch = fetchSpData(syncable);
            if (spFetch != null && spFetch.reachable) {
                String spId = spFetch.localIdToSpId.get(entityId);
                if (spId != null) {
                    Map<String, String> spColumnValues = spFetch.spIdToFieldValues.get(spId);
                    spModified = spFetch.localIdToSpModified.get(entityId);
                    if (spColumnValues != null) {
                        // Reverse-map: SP column name -> entity field name
                        Map<String, String> fieldMapping = syncable.getFieldMapping();
                        Map<String, String> columnToField = new HashMap<>();
                        fieldMapping.forEach((field, column) -> columnToField.put(column, field));
                        spColumnValues.forEach((column, value) -> {
                            String fieldName = columnToField.get(column);
                            if (fieldName != null) {
                                spFields.put(fieldName, value);
                            }
                        });
                    }
                }
            }
        }

        // Build combined field list
        Set<String> allFieldNames = new LinkedHashSet<>();
        allFieldNames.addAll(localFields.keySet());
        allFieldNames.addAll(hubFields.keySet());
        allFieldNames.addAll(spFields.keySet());

        List<ThreeWayFieldEntry> fields = new ArrayList<>();
        for (String fieldName : allFieldNames) {
            String local = localFields.get(fieldName);
            String hub = hubFields.get(fieldName);
            String sp = spFields.containsKey(fieldName) ? spFields.get(fieldName) : null;
            boolean spMapped = spFields.containsKey(fieldName);

            boolean localHubMatch = Objects.equals(local, hub);
            boolean localSpMatch = !spMapped || Objects.equals(local, sp);
            boolean hubSpMatch = !spMapped || Objects.equals(hub, sp);
            boolean allMatch = localHubMatch && localSpMatch;

            fields.add(ThreeWayFieldEntry.builder()
                .fieldName(fieldName)
                .localValue(local)
                .hubValue(hub)
                .spValue(spMapped ? sp : null)
                .spMapped(spMapped)
                .allMatch(allMatch)
                .localHubMatch(localHubMatch)
                .localSpMatch(localSpMatch)
                .hubSpMatch(hubSpMatch)
                .build());
        }

        enrichRefLabels(entityType, fields);

        return ThreeWayFieldDiff.builder()
            .entityType(entityType)
            .entityId(entityId)
            .spBacked(spBacked)
            .spModified(spModified)
            .fields(fields)
            .mismatchCount((int) fields.stream().filter(f -> !f.isAllMatch()).count())
            .build();
    }

    /**
     * Attach human labels to relationship fields, so the compare drawer shows {@code isoPos: OPEN → CLOSED}
     * instead of {@code 4711 → 4712}, and {@code lotoPoints: 01-VCND100, 01-VCND101, +12 more} instead of a
     * JSON id array.
     *
     * <p>Purely additive — the {@code localValue}/{@code hubValue} strings are untouched, so nothing that
     * compares or hashes them changes behaviour.
     *
     * <p>Two deliberate choices:
     * <ul>
     *   <li><b>Only mismatching fields</b> are enriched. Matching fields are never rendered by the UI, and
     *       labeling them would cost hub round-trips for output nobody sees.</li>
     *   <li><b>The hub side is labeled by the HUB</b>, not from local rows with the same ids. A field that
     *       differs often references a row that is itself different (or absent) locally — labeling the hub
     *       column from local data would quietly show the wrong name in exactly the case the tool exists for.</li>
     * </ul>
     */
    private void enrichRefLabels(String entityType, List<ThreeWayFieldEntry> fields) {
        Map<String, String> refTypes;
        try {
            refTypes = syncComparisonService.refTypesFor(entityType);
        } catch (Exception e) {
            log.debug("[Verify] ref-type lookup failed for {}: {}", entityType, e.getMessage());
            return;
        }
        if (refTypes.isEmpty()) return;

        // Collect the ids each side references, grouped by target type (one batch per type, not per field).
        Map<String, Set<Long>> localIdsByType = new LinkedHashMap<>();
        Map<String, Set<Long>> hubIdsByType = new LinkedHashMap<>();
        for (ThreeWayFieldEntry f : fields) {
            String refType = refTypes.get(f.getFieldName());
            if (refType == null || f.isAllMatch()) continue;
            f.setRefType(refType);
            localIdsByType.computeIfAbsent(refType, k -> new LinkedHashSet<>())
                    .addAll(syncLabelService.extractIds(f.getLocalValue()));
            hubIdsByType.computeIfAbsent(refType, k -> new LinkedHashSet<>())
                    .addAll(syncLabelService.extractIds(f.getHubValue()));
        }
        if (localIdsByType.isEmpty() && hubIdsByType.isEmpty()) return;

        Map<String, Map<Long, String>> localLabels = new HashMap<>();
        localIdsByType.forEach((type, ids) -> localLabels.put(type, syncLabelService.labelsFor(type, ids)));

        Map<String, Map<Long, String>> hubLabels = new HashMap<>();
        String hubUrl = syncConfig.getSyncServerUrl();
        hubIdsByType.forEach((type, ids) -> {
            if (ids.isEmpty()) return;
            try {
                hubLabels.put(type, syncComparisonService.fetchServerEntityLabels(type, new ArrayList<>(ids), hubUrl));
            } catch (Exception e) {
                log.debug("[Verify] hub labels unavailable for {}: {}", type, e.getMessage());
            }
        });

        for (ThreeWayFieldEntry f : fields) {
            String refType = f.getRefType();
            if (refType == null) continue;
            f.setLocalLabel(syncLabelService.renderRefValue(
                    f.getLocalValue(), localLabels.getOrDefault(refType, Collections.emptyMap())));
            f.setHubLabel(syncLabelService.renderRefValue(
                    f.getHubValue(), hubLabels.getOrDefault(refType, Collections.emptyMap())));
        }
    }

    /**
     * Accept SP version of an entity: applies all SP field values to local entity,
     * then saves. Returns the number of fields applied.
     */
    @SuppressWarnings("unchecked")
    @Transactional
    public int acceptFromSharePoint(String entityType, Long entityId) {
        SharePointSyncable syncable = getSyncableMap().get(entityType);
        if (syncable == null) throw new IllegalArgumentException("Not SP-backed: " + entityType);

        SpFetchResult spResult = fetchSpData(syncable);
        if (spResult == null || !spResult.reachable) {
            throw new IllegalStateException("SharePoint not reachable");
        }

        String spId = spResult.localIdToSpId.get(entityId);
        if (spId == null) {
            throw new IllegalStateException("Entity " + entityId + " not found in SharePoint");
        }

        Object dto = spResult.spIdToDto.get(spId);
        if (dto == null) {
            throw new IllegalStateException("SP DTO not found for spId: " + spId);
        }

        SyncableService<?> service = serviceFacade.getService(entityType);
        if (service == null) throw new IllegalArgumentException("Unknown entity type: " + entityType);

        BaseIdEntity entity = (BaseIdEntity) service.getEntityById(entityId);
        if (entity == null) throw new IllegalStateException("Entity not found locally: " + entityId);

        Set<String> allFields = syncable.getFieldMapping().keySet();
        syncable.applySelectiveFields(entity, dto, allFields);

        // Save via raw-typed service to bypass generic capture issue
        @SuppressWarnings("unchecked")
        SyncableService rawService = service;
        rawService.save(entity);

        // Invalidate SP cache so next verify picks up fresh state
        spDataCache.remove(entityType);

        return allFields.size();
    }

    // ==================== Private Helpers ====================

    private String resolveLocalHubStatus(boolean inLocal, boolean inHub, SyncComparisonService.StaleEntity stale) {
        if (inLocal && inHub) {
            if (stale != null) return stale.isLocalNewer() ? "STALE_HUB" : "STALE_LOCAL";
            return "IN_SYNC";
        }
        if (inLocal) return "LOCAL_ONLY";
        if (inHub) return "HUB_ONLY";
        return "MISSING";
    }

    private String determineOverallStatus(String localHubStatus, String spStatus, boolean spBacked, boolean spReachable) {
        if ("IN_SYNC".equals(localHubStatus)) {
            if (!spBacked || !spReachable || "PRESENT".equals(spStatus)) return "OK";
            if ("MISSING_FROM_SP".equals(spStatus)) return "MISSING_FROM_SP";
        }
        if ("LOCAL_ONLY".equals(localHubStatus)) return "LOCAL_ONLY";
        if ("HUB_ONLY".equals(localHubStatus)) return "HUB_ONLY";
        if ("STALE_LOCAL".equals(localHubStatus)) return "STALE_LOCAL";
        if ("STALE_HUB".equals(localHubStatus)) return "STALE_HUB";
        return "MISMATCH";
    }

    /**
     * Fetch all SP items for a syncable type, map them to local entity IDs.
     * Cached for 60 seconds to avoid repeated SharePoint API calls.
     */
    @SuppressWarnings("unchecked")
    private SpFetchResult fetchSpData(SharePointSyncable<?> syncable) {
        String entityType = syncable.getEntityTypeName();
        CachedSpData cached = spDataCache.get(entityType);
        if (cached != null && !cached.isExpired()) return cached.result;

        try {
            SharePointSyncable rawSyncable = syncable;
            List<?> dtos = rawSyncable.fetchAllFromSharePoint();

            Map<Long, String> localIdToSpId = new LinkedHashMap<>();
            Map<Long, Instant> localIdToSpModified = new HashMap<>();
            Map<String, Map<String, String>> spIdToFieldValues = new HashMap<>();
            Map<String, Object> spIdToDto = new HashMap<>();
            Set<String> unmatchedSpIds = new LinkedHashSet<>();

            for (Object dto : dtos) {
                String spId = rawSyncable.getSharepointId(dto);
                if (spId == null) continue;

                spIdToDto.put(spId, dto);
                spIdToFieldValues.put(spId, rawSyncable.extractSpFieldValues(dto));

                Long localId = syncable.findLocalEntityId(spId);
                if (localId != null) {
                    localIdToSpId.put(localId, spId);
                    Instant modified = rawSyncable.getSpModifiedTime(dto);
                    if (modified != null) localIdToSpModified.put(localId, modified);
                } else {
                    unmatchedSpIds.add(spId);
                }
            }

            SpFetchResult result = new SpFetchResult(true, dtos.size(), localIdToSpId,
                localIdToSpModified, spIdToFieldValues, spIdToDto, unmatchedSpIds);
            spDataCache.put(entityType, new CachedSpData(result));
            return result;
        } catch (Exception e) {
            log.warn("[Verify] SP fetch failed for {}: {}", entityType, e.getMessage());
            return new SpFetchResult(false, 0, Collections.emptyMap(), Collections.emptyMap(),
                Collections.emptyMap(), Collections.emptyMap(), Collections.emptySet());
        }
    }

    // ==================== Internal Data Structures ====================

    @AllArgsConstructor
    private static class SpFetchResult {
        final boolean reachable;
        final int totalSpCount;
        final Map<Long, String> localIdToSpId;
        final Map<Long, Instant> localIdToSpModified;
        final Map<String, Map<String, String>> spIdToFieldValues;
        final Map<String, Object> spIdToDto;
        final Set<String> unmatchedSpIds;
    }

    private static class CachedSpData {
        final SpFetchResult result;
        final long fetchedAtMs;
        CachedSpData(SpFetchResult result) { this.result = result; this.fetchedAtMs = System.currentTimeMillis(); }
        boolean isExpired() { return System.currentTimeMillis() - fetchedAtMs > 60_000; }
    }

    // ==================== DTOs ====================

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class VerificationResult {
        private String entityType;
        private boolean spBacked;
        private boolean hubReachable;
        private boolean spReachable;
        private int totalChecked;
        private int okCount;
        private int issueCount;
        private int localCount;
        private int hubCount;
        private Integer spCount;
        private Integer spOnlyCount;
        private List<EntityVerificationStatus> issues;
        private String message;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class EntityVerificationStatus {
        private Long entityId;
        private String sharepointId;  // populated for SP_ONLY items that have no local ID
        private boolean inLocal;
        private boolean inHub;
        private Boolean inSharePoint; // null = SP unreachable or not SP-backed
        private String localHubStatus;
        private String spStatus;
        private String overallStatus;
        private Instant localModified;
        private Instant hubModified;
        private Instant spModified;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ThreeWayFieldDiff {
        private String entityType;
        private Long entityId;
        private boolean spBacked;
        private Instant spModified;
        private List<ThreeWayFieldEntry> fields;
        private int mismatchCount;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ThreeWayFieldEntry {
        private String fieldName;
        private String localValue;
        private String hubValue;
        private String spValue;
        private boolean spMapped;   // true if this field has a SP column mapping
        private boolean allMatch;
        private boolean localHubMatch;
        private boolean localSpMatch;
        private boolean hubSpMatch;
        // ---- presentation-only (see SyncLabelService). NEVER used for comparison or hashing: the raw
        // *Value fields stay the source of truth, these just let the UI print "OPEN" instead of "4711".
        /** Referenced entity type when this field is a relationship (e.g. "Value"), else null. */
        private String refType;
        /** Human rendering of localValue / hubValue when refType is set and the ids resolved, else null. */
        private String localLabel;
        private String hubLabel;
    }
}
