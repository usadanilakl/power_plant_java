package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.dto.sync.FieldChangeDto;
import com.dk_power.power_plant_java.dto.sync.SyncAuditComparisonDto;
import com.dk_power.power_plant_java.dto.sync.SyncAuditComparisonDto.EntityTypeSummary;
import com.dk_power.power_plant_java.dto.sync.SyncAuditComparisonDto.FieldDiffEntry;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.sevice.ServiceFacade;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SyncAuditPageService {

    private final ServiceFacade serviceFacade;
    private final FieldChangeRepository fieldChangeRepository;
    private final EntityTableRegistry entityTableRegistry;
    private final SyncConfig syncConfig;
    private final RestTemplate restTemplate;
    private final SyncComparisonService syncComparisonService;

    private static final int MAX_CHANGES = 200;

    public List<EntityTypeSummary> getAuditableEntityTypes() {
        List<Object[]> changeCounts = fieldChangeRepository.countByEntityType();
        Map<String, Long> changeCountMap = new HashMap<>();
        for (Object[] row : changeCounts) {
            String type = Objects.toString(row[0], null);
            long count = row[1] instanceof Number n ? n.longValue() : 0L;
            if (type != null) changeCountMap.put(type, count);
        }

        List<EntityTypeSummary> summaries = new ArrayList<>();
        for (String entityType : entityTableRegistry.getSyncOrder()) {
            SyncableService<?> service = serviceFacade.getService(entityType);
            if (service == null) continue;

            long localCount;
            try {
                localCount = service.getAll().size();
            } catch (Exception e) {
                log.debug("Could not count entities for {}: {}", entityType, e.getMessage());
                localCount = 0;
            }

            long changeCount = changeCountMap.getOrDefault(entityType, 0L);
            summaries.add(new EntityTypeSummary(entityType, localCount, changeCount));
        }
        return summaries;
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getEntitiesForTable(String entityType) {
        if (!entityTableRegistry.isRegistered(entityType)) {
            throw new IllegalArgumentException("Unknown entity type: " + entityType);
        }
        SyncableService<?> service = serviceFacade.getService(entityType);
        if (service == null) {
            throw new IllegalArgumentException("No service registered for: " + entityType);
        }

        List<?> entities = service.getAll();
        List<Map<String, Object>> result = new ArrayList<>(entities.size());
        for (Object entity : entities) {
            Map<String, String> serialized = syncComparisonService.getLocalEntityData(
                entityType, ((BaseIdEntity) entity).getId());
            if (serialized != null) {
                Map<String, Object> row = new LinkedHashMap<>(serialized);
                row.put("id", ((BaseIdEntity) entity).getId());
                result.add(row);
            }
        }
        return result;
    }

    public SyncAuditComparisonDto getComparison(String entityType, Long entityId) {
        if (!entityTableRegistry.isRegistered(entityType)) {
            throw new IllegalArgumentException("Unknown entity type: " + entityType);
        }

        SyncAuditComparisonDto.SyncAuditComparisonDtoBuilder builder = SyncAuditComparisonDto.builder()
            .entityType(entityType)
            .entityId(entityId);

        // Local entity data
        Map<String, String> localData = syncComparisonService.getLocalEntityData(entityType, entityId);
        builder.localExists(localData != null);
        builder.localEntity(localData != null ? localData : Collections.emptyMap());

        // Local field changes
        List<FieldChange> localChanges = fieldChangeRepository
            .findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId);
        builder.localChanges(localChanges.stream()
            .limit(MAX_CHANGES)
            .map(FieldChangeDto::from)
            .toList());

        // Server data
        String syncServerUrl = syncConfig.getSyncServerUrl();
        if (syncServerUrl == null || syncServerUrl.isEmpty() || !syncConfig.isServerSyncConfigured()) {
            builder.serverReachable(false);
            builder.serverExists(false);
            builder.serverEntity(Collections.emptyMap());
            builder.serverChanges(Collections.emptyList());
            builder.diffs(Collections.emptyList());
            return builder.build();
        }

        try {
            // Fetch server entity data
            Map<String, String> serverData = syncComparisonService.fetchServerEntityData(
                entityType, entityId, syncServerUrl);
            builder.serverReachable(true);
            builder.serverExists(serverData != null);
            builder.serverEntity(serverData != null ? serverData : Collections.emptyMap());

            // Fetch server field changes
            List<FieldChangeDto> serverChanges = fetchServerFieldChanges(entityType, entityId, syncServerUrl);
            builder.serverChanges(serverChanges);

            // Compute diffs
            if (localData != null && serverData != null) {
                builder.diffs(computeDiffs(localData, serverData));
            } else {
                builder.diffs(Collections.emptyList());
            }
        } catch (Exception e) {
            log.warn("Could not reach hub for comparison {}/#{}: {}", entityType, entityId, e.getMessage());
            builder.serverReachable(false);
            builder.serverExists(false);
            builder.serverEntity(Collections.emptyMap());
            builder.serverChanges(Collections.emptyList());
            builder.diffs(Collections.emptyList());
        }

        return builder.build();
    }

    private List<FieldChangeDto> fetchServerFieldChanges(String entityType, Long entityId, String syncServerUrl) {
        String url = syncServerUrl + "/api/field-sync/changes/" + entityType + "/" + entityId;
        HttpHeaders headers = buildHeaders();

        try {
            ResponseEntity<List<FieldChange>> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers),
                new ParameterizedTypeReference<>() {});
            List<FieldChange> changes = response.getBody();
            if (changes == null) return Collections.emptyList();
            return changes.stream()
                .limit(MAX_CHANGES)
                .map(FieldChangeDto::from)
                .toList();
        } catch (Exception e) {
            log.debug("Could not fetch server field changes for {}/#{}: {}", entityType, entityId, e.getMessage());
            return Collections.emptyList();
        }
    }

    private List<FieldDiffEntry> computeDiffs(Map<String, String> localData, Map<String, String> serverData) {
        Set<String> allFields = new LinkedHashSet<>();
        allFields.addAll(localData.keySet());
        allFields.addAll(serverData.keySet());

        List<FieldDiffEntry> diffs = new ArrayList<>();
        for (String field : allFields) {
            String localValue = localData.get(field);
            String serverValue = serverData.get(field);
            if (!Objects.equals(localValue, serverValue)) {
                diffs.add(new FieldDiffEntry(field, localValue, serverValue));
            }
        }
        return diffs;
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Machine-Id", syncConfig.getMachineId());
        headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));
        return headers;
    }
}
