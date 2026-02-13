package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.config.HubSyncConfig;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.sevice.sync.EntityTableRegistry;
import jakarta.persistence.EntityManager;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Computes entity counts and health stats from the hub's own real database tables.
 * Uses EntityTableRegistry for table names and EntityManager for native count queries.
 * Only active when sync.role=hub.
 */
@Service
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@Slf4j
public class HubHealthStatsService {

    private final EntityManager entityManager;
    private final EntityTableRegistry entityTableRegistry;
    private final FieldChangeRepository fieldChangeRepository;
    private final HubFieldChangeQueryService fieldChangeQueryService;
    private final HubSyncConfig hubSyncConfig;

    @Value("${files.root.path:${user.dir}/uploads}")
    private String filesRootPath;

    public HubHealthStatsService(EntityManager entityManager,
                                  EntityTableRegistry entityTableRegistry,
                                  FieldChangeRepository fieldChangeRepository,
                                  HubFieldChangeQueryService fieldChangeQueryService,
                                  HubSyncConfig hubSyncConfig) {
        this.entityManager = entityManager;
        this.entityTableRegistry = entityTableRegistry;
        this.fieldChangeRepository = fieldChangeRepository;
        this.fieldChangeQueryService = fieldChangeQueryService;
        this.hubSyncConfig = hubSyncConfig;
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getEntityCounts() {
        Map<String, Long> counts = new LinkedHashMap<>();

        for (String type : entityTableRegistry.getSyncOrder()) {
            try {
                String tableName = entityTableRegistry.getTableName(type);
                Long count;
                try {
                    count = ((Number) entityManager.createNativeQuery(
                        "SELECT COUNT(*) FROM " + tableName + " WHERE deleted = false")
                        .getSingleResult()).longValue();
                } catch (Exception e) {
                    // Fallback: table might not have deleted column
                    try {
                        count = ((Number) entityManager.createNativeQuery(
                            "SELECT COUNT(*) FROM " + tableName)
                            .getSingleResult()).longValue();
                    } catch (Exception e2) {
                        count = 0L;
                    }
                }
                counts.put(type, count);
            } catch (Exception e) {
                log.trace("Could not count {}: {}", type, e.getMessage());
            }
        }

        return counts;
    }

    @Transactional(readOnly = true)
    public HealthStats getHealthStats() {
        Map<String, Long> entityCounts = getEntityCounts();
        long totalEntities = entityCounts.values().stream().mapToLong(Long::longValue).sum();

        long fileCount = countUploadFiles();
        Instant latestChangeTime = fieldChangeQueryService.findLatestChangeTime();

        return HealthStats.builder()
            .entityCounts(entityCounts)
            .totalEntities(totalEntities)
            .fileCount(fileCount)
            .latestChangeTime(latestChangeTime)
            .totalFieldChanges(fieldChangeRepository.count())
            .build();
    }

    @Transactional(readOnly = true)
    public PartialSyncDatesResponse getAvailableSyncDates() {
        List<java.sql.Date> dates = fieldChangeQueryService.findDistinctChangeDates();

        List<String> dateStrings = dates.stream()
            .map(d -> d.toLocalDate().toString())
            .collect(Collectors.toList());

        Instant oldest = fieldChangeQueryService.findOldestChangeTime();
        Instant latest = fieldChangeQueryService.findLatestChangeTime();

        return PartialSyncDatesResponse.builder()
            .availableDates(dateStrings)
            .oldestDate(oldest != null ? oldest.atZone(ZoneId.systemDefault()).toLocalDate().toString() : null)
            .latestDate(latest != null ? latest.atZone(ZoneId.systemDefault()).toLocalDate().toString() : null)
            .totalChangesInHistory(fieldChangeRepository.count())
            .retentionDays(hubSyncConfig.getRetentionDays())
            .build();
    }

    private long countUploadFiles() {
        try {
            Path uploadsDir = Path.of(filesRootPath);
            if (!Files.isDirectory(uploadsDir)) return 0;
            try (var stream = Files.walk(uploadsDir)) {
                return stream.filter(Files::isRegularFile).count();
            }
        } catch (IOException e) {
            log.debug("Could not count upload files: {}", e.getMessage());
            return 0;
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HealthStats {
        private Map<String, Long> entityCounts;
        private long totalEntities;
        private long fileCount;
        private Instant latestChangeTime;
        private long totalFieldChanges;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartialSyncDatesResponse {
        private List<String> availableDates;
        private String oldestDate;
        private String latestDate;
        private long totalChangesInHistory;
        private int retentionDays;
    }
}
