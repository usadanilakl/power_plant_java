package com.dk_power.power_plant_java.sevice.angular.admin;

import com.dk_power.power_plant_java.dto.admin.SyncAuditCurrentRowDto;
import com.dk_power.power_plant_java.dto.admin.SyncAuditEntityReportDto;
import com.dk_power.power_plant_java.dto.admin.SyncAuditFieldChangeDto;
import com.dk_power.power_plant_java.dto.admin.SyncAuditIncidentReportRequestDto;
import com.dk_power.power_plant_java.dto.admin.SyncAuditMachineCompareEntityDto;
import com.dk_power.power_plant_java.dto.admin.SyncAuditMachineCompareReportDto;
import com.dk_power.power_plant_java.dto.admin.SyncAuditMachineSummaryDto;
import com.dk_power.power_plant_java.dto.admin.SyncAuditRecentEntityDto;
import com.dk_power.power_plant_java.dto.admin.SyncAuditReconstructedFieldDiffDto;
import com.dk_power.power_plant_java.dto.admin.SyncAuditReconstructionDto;
import com.dk_power.power_plant_java.dto.admin.SyncAuditRelatedEntityDto;
import com.dk_power.power_plant_java.dto.admin.SyncAuditSignalDto;
import com.dk_power.power_plant_java.dto.admin.SyncAuditTypeSummaryDto;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.sevice.sync.EntityTableRegistry;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Tuple;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SyncAuditService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final FieldChangeRepository fieldChangeRepository;
    private final EntityTableRegistry entityTableRegistry;
    private final EntityManager entityManager;

    // Point-in-time reconstruction replays FieldChange HISTORY. When log compaction is active the hub
    // keeps only the latest change per field, so intermediate/past values are gone — the reconstruction
    // then reflects current values, not the state at the requested time. Surface that so an operator
    // never mistakes a compacted reconstruction for a true historical snapshot. (Both flags: compaction
    // is inert without the durable apply-state — see FieldChangeCompactor.)
    @org.springframework.beans.factory.annotation.Value("${sync.hub.log-compaction-enabled:false}")
    private boolean logCompactionEnabled;
    @org.springframework.beans.factory.annotation.Value("${sync.hub.durable-apply-state-enabled:false}")
    private boolean durableApplyStateEnabled;
    private final JdbcTemplate jdbcTemplate;

    public List<SyncAuditTypeSummaryDto> getTypeSummaries() {
        List<Object[]> rows = fieldChangeRepository.countByEntityType();
        List<SyncAuditTypeSummaryDto> summaries = new ArrayList<>();

        for (Object[] row : rows) {
            String entityType = Objects.toString(row[0], null);
            long changeCount = row[1] instanceof Number number ? number.longValue() : 0L;
            long entityCount = countDistinctEntitiesForType(entityType);
            String latestChangeAt = formatInstant(findLatestChangeForType(entityType));

            summaries.add(new SyncAuditTypeSummaryDto(
                entityType,
                changeCount,
                entityCount,
                latestChangeAt,
                entityTableRegistry.isRegistered(entityType)
            ));
        }

        return summaries;
    }

    public List<SyncAuditRecentEntityDto> getRecentEntities(String entityType,
                                                            int limit,
                                                            String machineId,
                                                            String fieldName,
                                                            String changeType,
                                                            String from,
                                                            String to) {
        validateEntityType(entityType);
        int safeLimit = Math.max(1, Math.min(limit, 100));
        Instant fromInstant = parseFilterInstant(from);
        Instant toInstant = parseFilterInstant(to);

        QueryParts queryParts = buildRecentEntitiesQuery(entityType, machineId, fieldName, changeType, fromInstant, toInstant);
        var query = entityManager.createQuery(queryParts.query(), Tuple.class);
        queryParts.parameters().forEach(query::setParameter);
        List<Tuple> rows = query
            .setMaxResults(safeLimit)
            .getResultList();

        List<SyncAuditRecentEntityDto> recent = new ArrayList<>();
        for (Tuple row : rows) {
            Long entityId = ((Number) row.get("entityId")).longValue();
            List<FieldChange> timeline = findChanges(entityType, entityId, machineId, fieldName, changeType, fromInstant, toInstant);
            if (timeline.isEmpty()) {
                continue;
            }

            FieldChange latest = timeline.get(0);
            SyncAuditCurrentRowDto currentRow = inspectCurrentRow(entityType, entityId);
            SyncAuditSignalDto signals = buildSignals(timeline, currentRow, true);
            List<String> warnings = detectWarnings(entityType, timeline, currentRow, signals);

            recent.add(new SyncAuditRecentEntityDto(
                entityId,
                ((Number) row.get("changeCount")).longValue(),
                formatInstant(row.get("firstTs", Instant.class)),
                formatInstant(row.get("lastTs", Instant.class)),
                latest.getChangeType().name(),
                latest.getFieldName(),
                latest.getOriginMachineId(),
                latest.getOriginMachineName(),
                signals,
                warnings
            ));
        }

        return recent;
    }

    public SyncAuditEntityReportDto getEntityReport(String entityType,
                                                    Long entityId,
                                                    int limit,
                                                    String machineId,
                                                    String fieldName,
                                                    String changeType,
                                                    String from,
                                                    String to) {
        validateEntityType(entityType);
        if (entityId == null) {
            throw new IllegalArgumentException("entityId is required");
        }

        int safeLimit = Math.max(1, Math.min(limit, 1000));
        Instant fromInstant = parseFilterInstant(from);
        Instant toInstant = parseFilterInstant(to);
        List<FieldChange> allChanges = fieldChangeRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId);
        if (allChanges.isEmpty()) {
            throw new IllegalArgumentException("No field changes found for " + entityType + " #" + entityId);
        }

        List<FieldChange> filteredChanges = findChanges(entityType, entityId, machineId, fieldName, changeType, fromInstant, toInstant);
        List<FieldChange> timelineDesc = filteredChanges.stream()
            .limit(safeLimit)
            .collect(Collectors.toList());

        SyncAuditCurrentRowDto currentRow = inspectCurrentRow(entityType, entityId);
        SyncAuditSignalDto signals = buildSignals(allChanges, currentRow, !filteredChanges.equals(allChanges));
        List<String> warnings = detectWarnings(entityType, allChanges, currentRow, signals);

        Map<String, Long> changeTypeCounts = allChanges.stream()
            .collect(Collectors.groupingBy(change -> change.getChangeType().name(), LinkedHashMap::new, Collectors.counting()));

        List<String> machines = allChanges.stream()
            .map(FieldChange::getOriginMachineId)
            .filter(Objects::nonNull)
            .distinct()
            .toList();

        List<String> touchedFields = allChanges.stream()
            .map(FieldChange::getFieldName)
            .filter(Objects::nonNull)
            .distinct()
            .sorted()
            .toList();

        List<SyncAuditFieldChangeDto> timeline = timelineDesc.stream()
            .map(this::toDto)
            .toList();

        List<SyncAuditRelatedEntityDto> relatedEntities = buildRelatedEntities(entityType, entityId, currentRow);
        List<SyncAuditMachineSummaryDto> machineSummaries = buildMachineSummaries(allChanges);

        FieldChange oldest = allChanges.get(allChanges.size() - 1);
        FieldChange newest = allChanges.get(0);

        return new SyncAuditEntityReportDto(
            entityType,
            entityId,
            allChanges.size(),
            timeline.size(),
            formatInstant(oldest.getTimestamp()),
            formatInstant(newest.getTimestamp()),
            changeTypeCounts,
            machines,
            touchedFields,
            machineSummaries,
            warnings,
            signals,
            currentRow,
            relatedEntities,
            timeline
        );
    }

    public SyncAuditMachineCompareReportDto compareMachines(String entityType,
                                                            String leftMachineId,
                                                            String rightMachineId,
                                                            int limit,
                                                            String fieldName,
                                                            String changeType,
                                                            String from,
                                                            String to) {
        validateEntityType(entityType);
        if (leftMachineId == null || leftMachineId.isBlank() || rightMachineId == null || rightMachineId.isBlank()) {
            throw new IllegalArgumentException("Both machine IDs are required");
        }

        int safeLimit = Math.max(1, Math.min(limit, 500));
        Instant fromInstant = parseFilterInstant(from);
        Instant toInstant = parseFilterInstant(to);

        Map<Long, List<FieldChange>> leftByEntity = groupByEntity(findChanges(entityType, null, leftMachineId, fieldName, changeType, fromInstant, toInstant));
        Map<Long, List<FieldChange>> rightByEntity = groupByEntity(findChanges(entityType, null, rightMachineId, fieldName, changeType, fromInstant, toInstant));

        Set<Long> entityIds = new TreeSet<>();
        entityIds.addAll(leftByEntity.keySet());
        entityIds.addAll(rightByEntity.keySet());

        List<SyncAuditMachineCompareEntityDto> entities = new ArrayList<>();
        int leftOnly = 0;
        int rightOnly = 0;
        int both = 0;
        int divergent = 0;

        for (Long entityId : entityIds) {
            List<FieldChange> leftChanges = leftByEntity.getOrDefault(entityId, List.of());
            List<FieldChange> rightChanges = rightByEntity.getOrDefault(entityId, List.of());

            String status;
            if (leftChanges.isEmpty()) {
                status = "RIGHT_ONLY";
                rightOnly++;
            } else if (rightChanges.isEmpty()) {
                status = "LEFT_ONLY";
                leftOnly++;
            } else {
                both++;
                FieldChange leftLatest = leftChanges.get(0);
                FieldChange rightLatest = rightChanges.get(0);
                boolean sameCount = leftChanges.size() == rightChanges.size();
                boolean sameLatestField = Objects.equals(leftLatest.getFieldName(), rightLatest.getFieldName());
                boolean sameLatestType = Objects.equals(leftLatest.getChangeType(), rightLatest.getChangeType());
                boolean sameLatestTime = Objects.equals(leftLatest.getTimestamp(), rightLatest.getTimestamp());
                if (sameCount && sameLatestField && sameLatestType && sameLatestTime) {
                    status = "MATCHED";
                } else {
                    status = "DIVERGENT";
                    divergent++;
                }
            }

            entities.add(new SyncAuditMachineCompareEntityDto(
                entityId,
                leftChanges.size(),
                rightChanges.size(),
                leftChanges.isEmpty() ? null : formatInstant(leftChanges.get(0).getTimestamp()),
                rightChanges.isEmpty() ? null : formatInstant(rightChanges.get(0).getTimestamp()),
                status
            ));
        }

        List<SyncAuditMachineCompareEntityDto> limited = entities.stream()
            .sorted(Comparator.comparing((SyncAuditMachineCompareEntityDto dto) -> statusRank(dto.status()))
                .thenComparing(SyncAuditMachineCompareEntityDto::entityId))
            .limit(safeLimit)
            .toList();

        return new SyncAuditMachineCompareReportDto(
            entityType,
            leftMachineId,
            rightMachineId,
            entityIds.size(),
            leftOnly,
            rightOnly,
            both,
            divergent,
            limited
        );
    }

    public String exportEntityReportAsJson(String entityType,
                                           Long entityId,
                                           int limit,
                                           String machineId,
                                           String fieldName,
                                           String changeType,
                                           String from,
                                           String to) {
        SyncAuditEntityReportDto report = getEntityReport(entityType, entityId, limit, machineId, fieldName, changeType, from, to);
        StringBuilder json = new StringBuilder();
        json.append("{\n");
        json.append("  \"entityType\": \"").append(escapeJson(report.entityType())).append("\",\n");
        json.append("  \"entityId\": ").append(report.entityId()).append(",\n");
        json.append("  \"totalChanges\": ").append(report.totalChanges()).append(",\n");
        json.append("  \"visibleTimelineChanges\": ").append(report.visibleTimelineChanges()).append(",\n");
        json.append("  \"warnings\": ").append(toJsonArray(report.warnings())).append(",\n");
        json.append("  \"machines\": ").append(toJsonArray(report.machines())).append(",\n");
        json.append("  \"touchedFields\": ").append(toJsonArray(report.touchedFields())).append(",\n");
        json.append("  \"timeline\": [\n");
        for (int i = 0; i < report.timeline().size(); i++) {
            SyncAuditFieldChangeDto change = report.timeline().get(i);
            json.append("    {")
                .append("\"timestamp\": ").append(toJsonString(change.timestamp())).append(", ")
                .append("\"changeType\": ").append(toJsonString(change.changeType())).append(", ")
                .append("\"fieldName\": ").append(toJsonString(change.fieldName())).append(", ")
                .append("\"originMachineId\": ").append(toJsonString(change.originMachineId())).append(", ")
                .append("\"oldValue\": ").append(toJsonString(change.oldValue())).append(", ")
                .append("\"newValue\": ").append(toJsonString(change.newValue())).append("}");
            if (i < report.timeline().size() - 1) {
                json.append(",");
            }
            json.append("\n");
        }
        json.append("  ]\n");
        json.append("}\n");
        return json.toString();
    }

    public SyncAuditReconstructionDto reconstructEntityAtTime(String entityType, Long entityId, String asOf) {
        validateEntityType(entityType);
        if (entityId == null) {
            throw new IllegalArgumentException("entityId is required");
        }
        Instant asOfInstant = parseFilterInstant(asOf);
        if (asOfInstant == null) {
            throw new IllegalArgumentException("Valid asOf timestamp is required");
        }

        List<FieldChange> changes = findChanges(entityType, entityId, null, null, null, null, asOfInstant);
        if (changes.isEmpty()) {
            throw new IllegalArgumentException("No field changes found for " + entityType + " #" + entityId + " up to " + asOf);
        }

        List<FieldChange> ordered = new ArrayList<>(changes);
        Collections.reverse(ordered);

        Map<String, String> reconstructedFields = new LinkedHashMap<>();
        Set<String> machines = new LinkedHashSet<>();
        for (FieldChange change : ordered) {
            machines.add(change.getOriginMachineId());
            if (change.getChangeType() == FieldChange.ChangeType.DELETE) {
                reconstructedFields.put("deleted", "true");
            }
            if (change.getFieldName() != null) {
                reconstructedFields.put(change.getFieldName(), change.getNewValue());
            }
        }

        SyncAuditCurrentRowDto currentRow = inspectCurrentRow(entityType, entityId);
        List<SyncAuditReconstructedFieldDiffDto> diffs = buildReconstructionDiffs(currentRow, reconstructedFields);
        List<String> warnings = new ArrayList<>();
        if (!currentRow.rowExists()) {
            warnings.add("Current row is missing, so reconstruction is based entirely on historical field changes.");
        }
        if (Boolean.TRUE.equals(currentRow.deleted())) {
            warnings.add("Current row is soft-deleted.");
        }
        if (reconstructedFields.containsKey("deleted") && "true".equalsIgnoreCase(reconstructedFields.get("deleted"))) {
            warnings.add("Reconstructed state indicates the entity had been deleted by this timestamp.");
        }
        if (logCompactionEnabled && durableApplyStateEnabled) {
            warnings.add("Log compaction is active: the hub keeps only the latest change per field, so "
                + "superseded/intermediate values are pruned. This reconstruction may reflect current "
                + "values rather than the state at the requested time; pre-compaction point-in-time "
                + "history is not available.");
        }

        return new SyncAuditReconstructionDto(
            entityType,
            entityId,
            asOfInstant.toString(),
            ordered.size(),
            machines.stream().filter(Objects::nonNull).toList(),
            reconstructedFields,
            diffs,
            warnings
        );
    }

    public String exportIncidentReportAsJson(SyncAuditIncidentReportRequestDto request) {
        SyncAuditEntityReportDto entityReport = getEntityReport(
            request.entityType(),
            request.entityId(),
            request.limit(),
            request.machineId(),
            request.fieldName(),
            request.changeType(),
            request.from(),
            request.to()
        );

        SyncAuditMachineCompareReportDto compareReport = null;
        if (request.leftMachineId() != null && !request.leftMachineId().isBlank()
            && request.rightMachineId() != null && !request.rightMachineId().isBlank()) {
            compareReport = compareMachines(
                request.entityType(),
                request.leftMachineId(),
                request.rightMachineId(),
                request.compareLimit(),
                request.fieldName(),
                request.changeType(),
                request.from(),
                request.to()
            );
        }

        SyncAuditReconstructionDto reconstruction = null;
        if (request.asOf() != null && !request.asOf().isBlank()) {
            reconstruction = reconstructEntityAtTime(request.entityType(), request.entityId(), request.asOf());
        }

        StringBuilder json = new StringBuilder();
        json.append("{\n");
        json.append("  \"entityReport\": ").append(exportEntityReportAsJson(
            request.entityType(),
            request.entityId(),
            request.limit(),
            request.machineId(),
            request.fieldName(),
            request.changeType(),
            request.from(),
            request.to()
        ).trim());

        if (compareReport != null) {
            json.append(",\n  \"machineComparison\": {\n");
            json.append("    \"entityType\": ").append(toJsonString(compareReport.entityType())).append(",\n");
            json.append("    \"leftMachineId\": ").append(toJsonString(compareReport.leftMachineId())).append(",\n");
            json.append("    \"rightMachineId\": ").append(toJsonString(compareReport.rightMachineId())).append(",\n");
            json.append("    \"totalCompared\": ").append(compareReport.totalCompared()).append(",\n");
            json.append("    \"divergentCount\": ").append(compareReport.divergentCount()).append("\n");
            json.append("  }");
        }

        if (reconstruction != null) {
            json.append(",\n  \"reconstruction\": {\n");
            json.append("    \"asOf\": ").append(toJsonString(reconstruction.asOf())).append(",\n");
            json.append("    \"appliedChangeCount\": ").append(reconstruction.appliedChangeCount()).append(",\n");
            json.append("    \"warnings\": ").append(toJsonArray(reconstruction.warnings())).append("\n");
            json.append("  }");
        }

        json.append("\n}\n");
        return json.toString();
    }

    private void validateEntityType(String entityType) {
        if (entityType == null || entityType.isBlank()) {
            throw new IllegalArgumentException("entityType is required");
        }
    }

    private SyncAuditFieldChangeDto toDto(FieldChange change) {
        return new SyncAuditFieldChangeDto(
            change.getId() != null ? change.getId().toString() : null,
            formatInstant(change.getTimestamp()),
            formatInstant(change.getReceivedAt()),
            change.getChangeType() != null ? change.getChangeType().name() : null,
            change.getFieldName(),
            change.getRelationshipType(),
            change.getOldValue(),
            change.getNewValue(),
            change.getOriginMachineId(),
            change.getOriginMachineName(),
            change.getSyncedToMachines()
        );
    }

    private long countDistinctEntitiesForType(String entityType) {
        Long count = entityManager.createQuery(
                "SELECT COUNT(DISTINCT fc.entityId) FROM FieldChange fc WHERE fc.entityType = :entityType",
                Long.class)
            .setParameter("entityType", entityType)
            .getSingleResult();
        return count != null ? count : 0L;
    }

    private Instant findLatestChangeForType(String entityType) {
        List<Instant> results = entityManager.createQuery(
                "SELECT MAX(fc.timestamp) FROM FieldChange fc WHERE fc.entityType = :entityType",
                Instant.class)
            .setParameter("entityType", entityType)
            .getResultList();
        return results.isEmpty() ? null : results.get(0);
    }

    private SyncAuditCurrentRowDto inspectCurrentRow(String entityType, Long entityId) {
        String tableName = entityTableRegistry.getTableName(entityType);

        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT * FROM " + tableName + " WHERE id = ?",
                entityId
            );

            if (rows.isEmpty()) {
                return new SyncAuditCurrentRowDto(tableName, false, null, null, null, null, null);
            }

            Map<String, Object> rawRow = normalizeRow(rows.get(0));

            return new SyncAuditCurrentRowDto(
                tableName,
                true,
                asBoolean(rawRow.get("deleted")),
                stringifyValue(rawRow.get("date_created")),
                stringifyValue(rawRow.get("date_modified")),
                asLong(rawRow.get("version")),
                rawRow
            );
        } catch (Exception e) {
            log.warn("Could not inspect current row for {} #{} in table {}: {}", entityType, entityId, tableName, e.getMessage());
            return new SyncAuditCurrentRowDto(tableName, false, null, null, null, null, Map.of("error", e.getMessage()));
        }
    }

    private Map<String, Object> normalizeRow(Map<String, Object> row) {
        Map<String, Object> normalized = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : row.entrySet()) {
            normalized.put(entry.getKey(), normalizeValue(entry.getValue()));
        }
        return normalized;
    }

    private Object normalizeValue(Object value) {
        if (value instanceof Timestamp ts) {
            return ts.toInstant().atOffset(ZoneOffset.UTC).toString();
        }
        if (value instanceof LocalDateTime localDateTime) {
            return DATE_TIME_FORMATTER.format(localDateTime);
        }
        if (value instanceof byte[] bytes) {
            return "[binary " + bytes.length + " bytes]";
        }
        return value;
    }

    private List<String> detectWarnings(String entityType,
                                        List<FieldChange> allChangesDesc,
                                        SyncAuditCurrentRowDto currentRow,
                                        SyncAuditSignalDto signals) {
        List<String> warnings = new ArrayList<>();
        if (signals.currentRowMissing()) {
            warnings.add("Current row is missing from table " + currentRow.tableName() + ".");
        }
        if (signals.currentSoftDeleted()) {
            warnings.add("Current row exists but is soft-deleted.");
        }
        if (signals.multipleCreates()) {
            warnings.add("Multiple CREATE field changes were recorded for this entity; it may have been recreated or re-imported.");
        }
        if (signals.deleteThenRecreate()) {
            warnings.add("A CREATE change happened after a DELETE change; the entity may have been revived or recreated.");
        }
        if (signals.relationshipDetachDetected()) {
            warnings.add("Relationship detach changes were recorded for this entity.");
        }
        if (signals.currentCreatedAfterHistory()) {
            warnings.add("Current row dateCreated is later than the earliest tracked change, which can indicate recreate/import from another snapshot.");
        }
        if (signals.identicalCreatedModified()) {
            warnings.add("Current row dateCreated and dateModified are identical despite multiple tracked changes.");
        }
        if (signals.timelineFiltered()) {
            warnings.add("Timeline filters are active; the visible timeline is a subset of the full history.");
        }
        if (!entityTableRegistry.isRegistered(entityType)) {
            warnings.add("Entity type is not registered in EntityTableRegistry; current-row inspection may be incomplete.");
        }

        return warnings;
    }

    private boolean isNullish(String value) {
        if (value == null) {
            return true;
        }
        String normalized = value.trim();
        return normalized.isEmpty() || "null".equalsIgnoreCase(normalized) || "\"\"".equals(normalized);
    }

    private String formatInstant(Instant instant) {
        return instant != null ? instant.toString() : null;
    }

    private String stringifyValue(Object value) {
        Object normalized = normalizeValue(value);
        return normalized != null ? normalized.toString() : null;
    }

    private Instant parseInstant(String value) {
        try {
            return Instant.parse(value);
        } catch (Exception ignored) {
        }
        try {
            return LocalDateTime.parse(value, DATE_TIME_FORMATTER).toInstant(ZoneOffset.UTC);
        } catch (Exception ignored) {
        }
        return null;
    }

    private Instant parseFilterInstant(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return parseInstant(value);
    }

    private List<FieldChange> findChanges(String entityType,
                                          Long entityId,
                                          String machineId,
                                          String fieldName,
                                          String changeType,
                                          Instant from,
                                          Instant to) {
        StringBuilder jpql = new StringBuilder("SELECT fc FROM FieldChange fc WHERE fc.entityType = :entityType");
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("entityType", entityType);

        if (entityId != null) {
            jpql.append(" AND fc.entityId = :entityId");
            params.put("entityId", entityId);
        }
        if (machineId != null && !machineId.isBlank()) {
            jpql.append(" AND fc.originMachineId = :machineId");
            params.put("machineId", machineId.trim());
        }
        if (fieldName != null && !fieldName.isBlank()) {
            jpql.append(" AND fc.fieldName = :fieldName");
            params.put("fieldName", fieldName.trim());
        }
        if (changeType != null && !changeType.isBlank()) {
            jpql.append(" AND fc.changeType = :changeType");
            params.put("changeType", FieldChange.ChangeType.valueOf(changeType.trim().toUpperCase(Locale.ROOT)));
        }
        if (from != null) {
            jpql.append(" AND fc.timestamp >= :fromTs");
            params.put("fromTs", from);
        }
        if (to != null) {
            jpql.append(" AND fc.timestamp <= :toTs");
            params.put("toTs", to);
        }
        jpql.append(" ORDER BY fc.timestamp DESC");

        var query = entityManager.createQuery(jpql.toString(), FieldChange.class);
        params.forEach(query::setParameter);
        return query.getResultList();
    }

    private QueryParts buildRecentEntitiesQuery(String entityType,
                                                String machineId,
                                                String fieldName,
                                                String changeType,
                                                Instant from,
                                                Instant to) {
        StringBuilder jpql = new StringBuilder(
            "SELECT fc.entityId as entityId, COUNT(fc) as changeCount, MIN(fc.timestamp) as firstTs, MAX(fc.timestamp) as lastTs " +
                "FROM FieldChange fc WHERE fc.entityType = :entityType");
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("entityType", entityType);

        if (machineId != null && !machineId.isBlank()) {
            jpql.append(" AND fc.originMachineId = :machineId");
            params.put("machineId", machineId.trim());
        }
        if (fieldName != null && !fieldName.isBlank()) {
            jpql.append(" AND fc.fieldName = :fieldName");
            params.put("fieldName", fieldName.trim());
        }
        if (changeType != null && !changeType.isBlank()) {
            jpql.append(" AND fc.changeType = :changeType");
            params.put("changeType", FieldChange.ChangeType.valueOf(changeType.trim().toUpperCase(Locale.ROOT)));
        }
        if (from != null) {
            jpql.append(" AND fc.timestamp >= :fromTs");
            params.put("fromTs", from);
        }
        if (to != null) {
            jpql.append(" AND fc.timestamp <= :toTs");
            params.put("toTs", to);
        }

        jpql.append(" GROUP BY fc.entityId ORDER BY MAX(fc.timestamp) DESC");
        return new QueryParts(jpql.toString(), params);
    }

    private SyncAuditSignalDto buildSignals(List<FieldChange> changesDesc,
                                            SyncAuditCurrentRowDto currentRow,
                                            boolean timelineFiltered) {
        List<FieldChange> ordered = new ArrayList<>(changesDesc);
        Collections.reverse(ordered);

        long createCount = ordered.stream().filter(change -> change.getChangeType() == FieldChange.ChangeType.CREATE).count();
        long deleteCount = ordered.stream().filter(change -> change.getChangeType() == FieldChange.ChangeType.DELETE).count();

        Instant latestDelete = ordered.stream()
            .filter(change -> change.getChangeType() == FieldChange.ChangeType.DELETE)
            .map(FieldChange::getTimestamp)
            .max(Comparator.naturalOrder())
            .orElse(null);
        Instant latestCreate = ordered.stream()
            .filter(change -> change.getChangeType() == FieldChange.ChangeType.CREATE)
            .map(FieldChange::getTimestamp)
            .max(Comparator.naturalOrder())
            .orElse(null);

        boolean relationshipDetachDetected = ordered.stream()
            .anyMatch(change -> change.getRelationshipType() != null && isNullish(change.getNewValue()));

        boolean currentCreatedAfterHistory = false;
        if (currentRow.dateCreated() != null && !ordered.isEmpty()) {
            Instant currentCreated = parseInstant(currentRow.dateCreated());
            Instant earliestChange = ordered.get(0).getTimestamp();
            currentCreatedAfterHistory = currentCreated != null
                && earliestChange != null
                && currentCreated.isAfter(earliestChange.plusSeconds(1));
        }

        return new SyncAuditSignalDto(
            !currentRow.rowExists(),
            Boolean.TRUE.equals(currentRow.deleted()),
            createCount > 1,
            deleteCount > 0 && latestDelete != null && latestCreate != null && latestCreate.isAfter(latestDelete),
            relationshipDetachDetected,
            currentCreatedAfterHistory,
            currentRow.dateCreated() != null && Objects.equals(currentRow.dateCreated(), currentRow.dateModified()) && ordered.size() > 1,
            timelineFiltered
        );
    }

    private List<SyncAuditRelatedEntityDto> buildRelatedEntities(String entityType, Long entityId, SyncAuditCurrentRowDto currentRow) {
        List<SyncAuditRelatedEntityDto> related = new ArrayList<>();
        Map<String, Object> row = currentRow.rawRow();
        if (row == null) {
            return related;
        }

        switch (entityType) {
            case "JobLog" -> jdbcTemplate.queryForList(
                    "SELECT id FROM daily_permit_package WHERE job_log_id = ? ORDER BY id",
                    entityId)
                .forEach(packageRow -> related.add(new SyncAuditRelatedEntityDto(
                    "packages",
                    "DailyPermitPackage",
                    asLong(packageRow.get("id"))
                )));
            case "DailyPermitPackage" -> {
                Long jobLogId = asLong(row.get("job_log_id"));
                if (jobLogId != null) {
                    related.add(new SyncAuditRelatedEntityDto("jobLog", "JobLog", jobLogId));
                }
                addChildren(related, "workRequests", "WorkRequest", "work_request", entityId);
                addChildren(related, "safeWorks", "SafeWork", "safe_work", entityId);
                addChildren(related, "hotWorks", "HotWork", "hot_work", entityId);
                addChildren(related, "confinedSpaces", "ConfinedSpace", "confined_space", entityId);
                addChildren(related, "energizedWorkPermits", "EnergizedWorkPermit", "energized_work_permit", entityId);
                addChildren(related, "excavationPermits", "ExcavationPermit", "excavation_permit", entityId);
                addChildren(related, "ventingPermits", "VentingPermit", "venting_permit", entityId);
            }
            case "WorkRequest", "SafeWork", "HotWork", "ConfinedSpace", "EnergizedWorkPermit", "ExcavationPermit", "VentingPermit" -> {
                Long packageId = asLong(row.get("daily_permit_package_id"));
                if (packageId != null) {
                    related.add(new SyncAuditRelatedEntityDto("dailyPermitPackage", "DailyPermitPackage", packageId));
                    try {
                        List<Map<String, Object>> packageRows = jdbcTemplate.queryForList(
                            "SELECT job_log_id FROM daily_permit_package WHERE id = ?",
                            packageId
                        );
                        if (!packageRows.isEmpty()) {
                            Long jobId = asLong(packageRows.get(0).get("job_log_id"));
                            if (jobId != null) {
                                related.add(new SyncAuditRelatedEntityDto("jobLog", "JobLog", jobId));
                            }
                        }
                    } catch (Exception ignored) {
                    }
                }
            }
            default -> {
            }
        }

        return related;
    }

    private void addChildren(List<SyncAuditRelatedEntityDto> related,
                             String relation,
                             String entityType,
                             String tableName,
                             Long packageId) {
        jdbcTemplate.queryForList(
                "SELECT id FROM " + tableName + " WHERE daily_permit_package_id = ? ORDER BY id",
                packageId)
            .forEach(childRow -> related.add(new SyncAuditRelatedEntityDto(
                relation,
                entityType,
                asLong(childRow.get("id"))
            )));
    }

    private List<SyncAuditMachineSummaryDto> buildMachineSummaries(List<FieldChange> allChanges) {
        return allChanges.stream()
            .collect(Collectors.groupingBy(
                change -> (change.getOriginMachineId() == null ? "" : change.getOriginMachineId()) + "|" +
                    (change.getOriginMachineName() == null ? "" : change.getOriginMachineName()),
                LinkedHashMap::new,
                Collectors.toList()
            ))
            .entrySet()
            .stream()
            .map(entry -> {
                List<FieldChange> changes = entry.getValue();
                FieldChange earliest = changes.stream()
                    .min(Comparator.comparing(FieldChange::getTimestamp))
                    .orElse(null);
                FieldChange latest = changes.stream()
                    .max(Comparator.comparing(FieldChange::getTimestamp))
                    .orElse(null);
                String[] parts = entry.getKey().split("\\|", 2);
                return new SyncAuditMachineSummaryDto(
                    parts.length > 0 ? parts[0] : null,
                    parts.length > 1 ? parts[1] : null,
                    changes.size(),
                    earliest != null ? formatInstant(earliest.getTimestamp()) : null,
                    latest != null ? formatInstant(latest.getTimestamp()) : null
                );
            })
            .sorted(Comparator.comparingLong(SyncAuditMachineSummaryDto::changeCount).reversed())
            .toList();
    }

    private Map<Long, List<FieldChange>> groupByEntity(List<FieldChange> changes) {
        return changes.stream().collect(Collectors.groupingBy(FieldChange::getEntityId, LinkedHashMap::new, Collectors.toList()));
    }

    private int statusRank(String status) {
        return switch (status) {
            case "DIVERGENT" -> 0;
            case "LEFT_ONLY" -> 1;
            case "RIGHT_ONLY" -> 2;
            default -> 3;
        };
    }

    private String toJsonArray(List<String> values) {
        return values.stream()
            .map(this::toJsonString)
            .collect(Collectors.joining(", ", "[", "]"));
    }

    private String toJsonString(String value) {
        return value == null ? "null" : "\"" + escapeJson(value) + "\"";
    }

    private String escapeJson(String value) {
        return value
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\r", "\\r")
            .replace("\n", "\\n");
    }

    private List<SyncAuditReconstructedFieldDiffDto> buildReconstructionDiffs(SyncAuditCurrentRowDto currentRow,
                                                                              Map<String, String> reconstructedFields) {
        if (currentRow.rawRow() == null || currentRow.rawRow().isEmpty()) {
            return List.of();
        }

        List<SyncAuditReconstructedFieldDiffDto> diffs = new ArrayList<>();
        for (Map.Entry<String, String> entry : reconstructedFields.entrySet()) {
            Object current = currentRow.rawRow().get(entry.getKey());
            String currentString = current == null ? null : current.toString();
            if (!Objects.equals(normalizeComparable(entry.getValue()), normalizeComparable(currentString))) {
                diffs.add(new SyncAuditReconstructedFieldDiffDto(
                    entry.getKey(),
                    entry.getValue(),
                    currentString
                ));
            }
        }
        return diffs;
    }

    private String normalizeComparable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.startsWith("\"") && trimmed.endsWith("\"") && trimmed.length() >= 2) {
            return trimmed.substring(1, trimmed.length() - 1);
        }
        return trimmed;
    }

    private Boolean asBoolean(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Boolean bool) {
            return bool;
        }
        return Boolean.parseBoolean(value.toString());
    }

    private Long asLong(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private record QueryParts(String query, Map<String, Object> parameters) {
    }
}
