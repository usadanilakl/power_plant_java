package com.dk_power.power_plant_java.sevice.sync;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for checking and fixing database integrity issues.
 *
 * Detects and fixes:
 * - Duplicate entries in ManyToMany join tables
 * - Orphaned FK references to deleted/non-existent entities
 * - Missing primary key constraints on join tables
 * - Soft-deleted entities ready for permanent deletion
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DataIntegrityService {

    private final JdbcTemplate jdbcTemplate;

    @Value("${data.integrity.soft-delete-retention-days:90}")
    private int softDeleteRetentionDays;

    /**
     * All ManyToMany join tables with their columns.
     * Format: [table_name, column1, column2, parent_table1, parent_table2]
     */
    private static final List<String[]> JOIN_TABLES = List.of(
        new String[]{"eq_loto_point", "eq_id", "loto_point_id", "equipment", "loto_point"},
        new String[]{"file_point", "point_id", "file_id", "equipment", "file_object"},
        new String[]{"loto_standard_loto_point", "loto_standard_id", "loto_point_id", "loto_standard", "loto_point"},
        new String[]{"loto_standard_groups", "loto_standard_id", "value_id", "loto_standard", "val_table"},
        new String[]{"ht_equipment", "ht_id", "eq_id", "heat_trace", "equipment"},
        new String[]{"ht_pid", "ht_id", "pid_id", "heat_trace", "file_object"},
        new String[]{"breaker_eq", "br_id", "eq_id", "eq_breaker", "equipment"},
        new String[]{"daily_permit_package_lotos", "daily_permit_package_id", "loto_id", "daily_permit_package", "loto"},
        new String[]{"permit_equipment", "permit_id", "equipment_id", null, "equipment"} // permit_id references multiple tables
    );

    /**
     * FK references from entities to soft-deletable entities.
     * Format: [referencing_table, fk_column, referenced_table]
     * These need to be nullified before purging the referenced entity.
     */
    private static final List<String[]> FK_REFERENCES = List.of(
        new String[]{"equipment", "pid_id", "file_object"},
        new String[]{"equipment", "mcc_id", "electrical_panel"},
        new String[]{"equipment", "breaker_id", "eq_breaker"},
        new String[]{"loto_point", "loto_id", "loto"},
        new String[]{"loto_point", "equipment_id", "equipment"},
        new String[]{"loto", "equipment_id", "equipment"},
        new String[]{"highlight", "file_id", "file_object"},
        new String[]{"comment", "file_id", "file_object"},
        new String[]{"eq_breaker", "panel_id", "electrical_panel"}
    );

    /**
     * Entities with soft-delete (deleted column) and their table names.
     */
    private static final Map<String, String> SOFT_DELETE_ENTITIES = Map.ofEntries(
        Map.entry("Equipment", "equipment"),
        Map.entry("FileObject", "file_object"),
        Map.entry("LotoPoint", "loto_point"),
        Map.entry("Loto", "loto"),
        Map.entry("LotoStandard", "loto_standard"),
        Map.entry("HeatTrace", "heat_trace"),
        Map.entry("Highlight", "highlight"),
        Map.entry("ElectricalPanel", "electrical_panel"),
        Map.entry("EqBreaker", "eq_breaker"),
        Map.entry("Category", "category"),
        Map.entry("Value", "val_table"),
        Map.entry("Comment", "comment"),
        Map.entry("ZeroEnergy", "zero_energy"),
        Map.entry("LotoBox", "loto_boxes"),
        Map.entry("Lock", "lock_table"),
        Map.entry("EspDevice", "esp_devices"),
        Map.entry("LedStrip", "led_strips")
    );

    // ==================== CHECK METHODS ====================

    /**
     * Check all integrity issues (read-only).
     */
    public IntegrityCheckResult checkIntegrity() {
        log.info("Starting integrity check...");
        IntegrityCheckResult result = new IntegrityCheckResult();
        result.setCheckedAt(Instant.now());
        result.setSoftDeleteRetentionDays(softDeleteRetentionDays);

        Map<String, TableIssues> tableIssues = new LinkedHashMap<>();
        int totalDuplicates = 0;
        int totalOrphans = 0;
        boolean constraintsMissing = false;

        // Check each join table
        for (String[] joinTable : JOIN_TABLES) {
            String tableName = joinTable[0];
            String col1 = joinTable[1];
            String col2 = joinTable[2];
            String parentTable1 = joinTable[3];
            String parentTable2 = joinTable[4];

            TableIssues issues = new TableIssues();
            issues.setTableName(tableName);

            try {
                // Check for duplicates
                long duplicates = countDuplicates(tableName, col1, col2);
                issues.setDuplicateCount(duplicates);
                totalDuplicates += duplicates;

                // Check for orphans (only if parent tables specified)
                if (parentTable1 != null || parentTable2 != null) {
                    long orphans = countOrphans(tableName, col1, col2, parentTable1, parentTable2);
                    issues.setOrphanCount(orphans);
                    totalOrphans += orphans;
                }

                // Check for PK constraint
                boolean hasPK = hasPrimaryKey(tableName);
                issues.setHasPrimaryKey(hasPK);
                if (!hasPK) {
                    constraintsMissing = true;
                }

                tableIssues.put(tableName, issues);

            } catch (Exception e) {
                log.warn("Error checking table {}: {}", tableName, e.getMessage());
                issues.setDuplicateCount(-1); // Indicate error
                tableIssues.put(tableName, issues);
            }
        }

        // Check soft-deleted entities
        Map<String, Long> softDeletedByEntity = new LinkedHashMap<>();
        int totalSoftDeleted = 0;

        Instant cutoffDate = Instant.now().minus(softDeleteRetentionDays, ChronoUnit.DAYS);

        for (Map.Entry<String, String> entry : SOFT_DELETE_ENTITIES.entrySet()) {
            String entityName = entry.getKey();
            String tableName = entry.getValue();

            try {
                long count = countSoftDeleted(tableName, cutoffDate);
                if (count > 0) {
                    softDeletedByEntity.put(entityName, count);
                    totalSoftDeleted += count;
                }
            } catch (Exception e) {
                log.debug("Could not count soft-deleted in {}: {}", tableName, e.getMessage());
            }
        }

        result.setTableIssues(tableIssues);
        result.setTotalDuplicates(totalDuplicates);
        result.setTotalOrphans(totalOrphans);
        result.setConstraintsMissing(constraintsMissing);
        result.setTotalSoftDeleted(totalSoftDeleted);
        result.setSoftDeletedByEntity(softDeletedByEntity);
        result.setHasIssues(totalDuplicates > 0 || totalOrphans > 0 || constraintsMissing);

        log.info("Integrity check complete: {} duplicates, {} orphans, constraints missing: {}, {} soft-deleted",
            totalDuplicates, totalOrphans, constraintsMissing, totalSoftDeleted);

        return result;
    }

    private long countDuplicates(String tableName, String col1, String col2) {
        String sql = String.format(
            "SELECT COUNT(*) - COUNT(DISTINCT CONCAT(%s, '-', %s)) FROM %s",
            col1, col2, tableName
        );
        Long result = jdbcTemplate.queryForObject(sql, Long.class);
        return result != null ? result : 0;
    }

    private long countOrphans(String tableName, String col1, String col2,
                              String parentTable1, String parentTable2) {
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT COUNT(*) FROM ").append(tableName).append(" j WHERE ");

        List<String> conditions = new ArrayList<>();

        if (parentTable1 != null) {
            conditions.add(String.format(
                "NOT EXISTS (SELECT 1 FROM %s p WHERE p.id = j.%s AND p.deleted = false)",
                parentTable1, col1
            ));
        }

        if (parentTable2 != null) {
            conditions.add(String.format(
                "NOT EXISTS (SELECT 1 FROM %s p WHERE p.id = j.%s AND p.deleted = false)",
                parentTable2, col2
            ));
        }

        if (conditions.isEmpty()) {
            return 0;
        }

        sql.append("(").append(String.join(" OR ", conditions)).append(")");

        try {
            Long result = jdbcTemplate.queryForObject(sql.toString(), Long.class);
            return result != null ? result : 0;
        } catch (Exception e) {
            // Table might not have deleted column
            log.debug("Could not count orphans for {}: {}", tableName, e.getMessage());
            return 0;
        }
    }

    private boolean hasPrimaryKey(String tableName) {
        try {
            return jdbcTemplate.execute((java.sql.Connection conn) -> {
                DatabaseMetaData metaData = conn.getMetaData();
                try (ResultSet rs = metaData.getPrimaryKeys(null, null, tableName.toUpperCase())) {
                    return rs.next();
                }
            });
        } catch (Exception e) {
            log.debug("Could not check PK for {}: {}", tableName, e.getMessage());
            return false;
        }
    }

    private long countSoftDeleted(String tableName, Instant cutoffDate) {
        // Use date_modified column (from BaseIdEntity.dateModified)
        String sql = String.format(
            "SELECT COUNT(*) FROM %s WHERE deleted = true AND date_modified < ?",
            tableName
        );
        try {
            Long result = jdbcTemplate.queryForObject(sql, Long.class, java.sql.Timestamp.from(cutoffDate));
            return result != null ? result : 0;
        } catch (Exception e) {
            log.debug("Could not count soft-deleted in {}: {}", tableName, e.getMessage());
            return 0;
        }
    }

    // ==================== FIX METHODS ====================

    /**
     * Fix duplicate join table entries.
     */
    @Transactional
    public IntegrityFixResult fixDuplicates(boolean dryRun) {
        log.info("Fixing duplicates (dryRun={})", dryRun);
        IntegrityFixResult result = new IntegrityFixResult();
        result.setDryRun(dryRun);

        int totalRemoved = 0;
        List<String> errors = new ArrayList<>();

        for (String[] joinTable : JOIN_TABLES) {
            String tableName = joinTable[0];
            String col1 = joinTable[1];
            String col2 = joinTable[2];

            try {
                long duplicates = countDuplicates(tableName, col1, col2);
                if (duplicates > 0) {
                    if (dryRun) {
                        log.info("[DRY RUN] Would remove {} duplicates from {}", duplicates, tableName);
                        totalRemoved += duplicates;
                    } else {
                        int removed = removeDuplicates(tableName, col1, col2);
                        totalRemoved += removed;
                        log.info("Removed {} duplicates from {}", removed, tableName);
                    }
                }
            } catch (Exception e) {
                String error = String.format("Error fixing duplicates in %s: %s", tableName, e.getMessage());
                log.error(error);
                errors.add(error);
            }
        }

        result.setDuplicatesRemoved(totalRemoved);
        result.setErrors(errors);
        result.setSuccess(errors.isEmpty());
        result.setMessage(dryRun
            ? String.format("Would remove %d duplicates", totalRemoved)
            : String.format("Removed %d duplicates", totalRemoved));

        return result;
    }

    private int removeDuplicates(String tableName, String col1, String col2) {
        // H2 syntax: use _ROWID_ pseudo-column to identify rows for deletion
        // Keep the row with the smallest _ROWID_ for each unique combination
        String sql = String.format(
            "DELETE FROM %s WHERE _ROWID_ NOT IN (SELECT MIN(_ROWID_) FROM %s GROUP BY %s, %s)",
            tableName, tableName, col1, col2
        );
        return jdbcTemplate.update(sql);
    }

    /**
     * Fix orphaned FK references.
     */
    @Transactional
    public IntegrityFixResult fixOrphanedReferences(boolean dryRun) {
        log.info("Fixing orphaned references (dryRun={})", dryRun);
        IntegrityFixResult result = new IntegrityFixResult();
        result.setDryRun(dryRun);

        int totalRemoved = 0;
        List<String> errors = new ArrayList<>();

        for (String[] joinTable : JOIN_TABLES) {
            String tableName = joinTable[0];
            String col1 = joinTable[1];
            String col2 = joinTable[2];
            String parentTable1 = joinTable[3];
            String parentTable2 = joinTable[4];

            if (parentTable1 == null && parentTable2 == null) {
                continue;
            }

            try {
                long orphans = countOrphans(tableName, col1, col2, parentTable1, parentTable2);
                if (orphans > 0) {
                    if (dryRun) {
                        log.info("[DRY RUN] Would remove {} orphans from {}", orphans, tableName);
                        totalRemoved += orphans;
                    } else {
                        int removed = removeOrphans(tableName, col1, col2, parentTable1, parentTable2);
                        totalRemoved += removed;
                        log.info("Removed {} orphans from {}", removed, tableName);
                    }
                }
            } catch (Exception e) {
                String error = String.format("Error fixing orphans in %s: %s", tableName, e.getMessage());
                log.error(error);
                errors.add(error);
            }
        }

        result.setOrphansRemoved(totalRemoved);
        result.setErrors(errors);
        result.setSuccess(errors.isEmpty());
        result.setMessage(dryRun
            ? String.format("Would remove %d orphaned references", totalRemoved)
            : String.format("Removed %d orphaned references", totalRemoved));

        return result;
    }

    private int removeOrphans(String tableName, String col1, String col2,
                              String parentTable1, String parentTable2) {
        StringBuilder sql = new StringBuilder();
        sql.append("DELETE FROM ").append(tableName).append(" WHERE ");

        List<String> conditions = new ArrayList<>();

        if (parentTable1 != null) {
            conditions.add(String.format(
                "NOT EXISTS (SELECT 1 FROM %s p WHERE p.id = %s.%s AND p.deleted = false)",
                parentTable1, tableName, col1
            ));
        }

        if (parentTable2 != null) {
            conditions.add(String.format(
                "NOT EXISTS (SELECT 1 FROM %s p WHERE p.id = %s.%s AND p.deleted = false)",
                parentTable2, tableName, col2
            ));
        }

        sql.append("(").append(String.join(" OR ", conditions)).append(")");

        return jdbcTemplate.update(sql.toString());
    }

    /**
     * Add missing primary key constraints to join tables.
     */
    @Transactional
    public IntegrityFixResult addPrimaryKeyConstraints(boolean dryRun) {
        log.info("Adding primary key constraints (dryRun={})", dryRun);
        IntegrityFixResult result = new IntegrityFixResult();
        result.setDryRun(dryRun);

        int constraintsAdded = 0;
        List<String> errors = new ArrayList<>();

        for (String[] joinTable : JOIN_TABLES) {
            String tableName = joinTable[0];
            String col1 = joinTable[1];
            String col2 = joinTable[2];

            try {
                if (!hasPrimaryKey(tableName)) {
                    if (dryRun) {
                        log.info("[DRY RUN] Would add PK constraint to {}", tableName);
                        constraintsAdded++;
                    } else {
                        // First remove duplicates
                        removeDuplicates(tableName, col1, col2);

                        // Then add constraint
                        String sql = String.format(
                            "ALTER TABLE %s ADD PRIMARY KEY (%s, %s)",
                            tableName, col1, col2
                        );
                        jdbcTemplate.execute(sql);
                        constraintsAdded++;
                        log.info("Added PK constraint to {}", tableName);
                    }
                }
            } catch (Exception e) {
                String error = String.format("Error adding PK to %s: %s", tableName, e.getMessage());
                log.error(error);
                errors.add(error);
            }
        }

        result.setConstraintsAdded(constraintsAdded);
        result.setErrors(errors);
        result.setSuccess(errors.isEmpty());
        result.setMessage(dryRun
            ? String.format("Would add %d PK constraints", constraintsAdded)
            : String.format("Added %d PK constraints", constraintsAdded));

        return result;
    }

    /**
     * Permanently delete soft-deleted entities older than retention period.
     * First removes orphaned join table entries, then purges entities that are NOT
     * still referenced by active records (to avoid breaking active data).
     */
    @Transactional
    public IntegrityFixResult purgeSoftDeleted(boolean dryRun, int retentionDays) {
        log.info("Purging soft-deleted entities (dryRun={}, retentionDays={})", dryRun, retentionDays);
        IntegrityFixResult result = new IntegrityFixResult();
        result.setDryRun(dryRun);

        Instant cutoffDate = Instant.now().minus(retentionDays, ChronoUnit.DAYS);
        int totalPurged = 0;
        int totalSkipped = 0;
        int orphansRemoved = 0;
        List<String> errors = new ArrayList<>();

        // Step 1: Remove orphaned join table entries FIRST to avoid FK constraint violations
        if (!dryRun) {
            log.info("Removing orphaned join table entries before purge...");
            IntegrityFixResult orphanResult = fixOrphanedReferences(false);
            orphansRemoved = orphanResult.getOrphansRemoved();
            if (!orphanResult.getErrors().isEmpty()) {
                errors.addAll(orphanResult.getErrors());
            }
        }

        // Step 2: Purge soft-deleted entities (skipping those still referenced by active entities)
        for (Map.Entry<String, String> entry : SOFT_DELETE_ENTITIES.entrySet()) {
            String entityName = entry.getKey();
            String tableName = entry.getValue();

            try {
                long count = countSoftDeleted(tableName, cutoffDate);
                if (count > 0) {
                    if (dryRun) {
                        // In dry run, also check how many would be skipped
                        Set<Long> skipIds = getReferencedSoftDeletedIds(tableName, cutoffDate);
                        long wouldPurge = count - skipIds.size();
                        if (skipIds.size() > 0) {
                            log.info("[DRY RUN] Would purge {} {} entities ({} skipped - still referenced)",
                                wouldPurge, entityName, skipIds.size());
                            totalSkipped += skipIds.size();
                        } else {
                            log.info("[DRY RUN] Would purge {} {} entities", count, entityName);
                        }
                        totalPurged += wouldPurge;
                    } else {
                        int deleted = purgeSoftDeletedTable(tableName, cutoffDate);
                        totalPurged += deleted;
                        log.info("Purged {} {} entities", deleted, entityName);
                    }
                }
            } catch (Exception e) {
                String error = String.format("Error purging %s: %s", entityName, e.getMessage());
                log.error(error);
                errors.add(error);
            }
        }

        result.setSoftDeletedPurged(totalPurged);
        result.setOrphansRemoved(orphansRemoved);
        result.setErrors(errors);
        result.setSuccess(errors.isEmpty());

        String message;
        if (dryRun) {
            message = totalSkipped > 0
                ? String.format("Would permanently delete %d entities (%d skipped - still referenced by active data)",
                    totalPurged, totalSkipped)
                : String.format("Would permanently delete %d soft-deleted entities", totalPurged);
        } else {
            message = String.format("Permanently deleted %d entities (removed %d orphaned join entries)",
                totalPurged, orphansRemoved);
        }
        result.setMessage(message);

        return result;
    }

    /**
     * Get IDs of soft-deleted entities that are still referenced by active entities.
     * These should NOT be purged to avoid breaking active data.
     */
    private Set<Long> getReferencedSoftDeletedIds(String referencedTable, Instant cutoffDate) {
        Set<Long> referencedIds = new HashSet<>();

        for (String[] fkRef : FK_REFERENCES) {
            if (!fkRef[2].equals(referencedTable)) continue;

            String referencingTable = fkRef[0];
            String fkColumn = fkRef[1];

            try {
                // Find soft-deleted entities that are still referenced by active entities
                String sql = String.format(
                    "SELECT DISTINCT r.id FROM %s r " +
                    "INNER JOIN %s ref ON ref.%s = r.id " +
                    "WHERE r.deleted = true AND r.date_modified < ? " +
                    "AND (ref.deleted = false OR ref.deleted IS NULL)",
                    referencedTable, referencingTable, fkColumn
                );
                List<Long> ids = jdbcTemplate.queryForList(sql, Long.class, java.sql.Timestamp.from(cutoffDate));
                referencedIds.addAll(ids);

                if (!ids.isEmpty()) {
                    log.info("Found {} soft-deleted {} entities still referenced by active {} records",
                        ids.size(), referencedTable, referencingTable);
                }
            } catch (Exception e) {
                log.debug("Could not check references {}.{}: {}", referencingTable, fkColumn, e.getMessage());
            }
        }

        return referencedIds;
    }

    /**
     * Purge soft-deleted entities, skipping those still referenced by active entities.
     */
    private int purgeSoftDeletedTable(String tableName, Instant cutoffDate) {
        // Get IDs that are still referenced and should be skipped
        Set<Long> skipIds = getReferencedSoftDeletedIds(tableName, cutoffDate);

        if (skipIds.isEmpty()) {
            // No references - safe to delete all
            String sql = String.format(
                "DELETE FROM %s WHERE deleted = true AND date_modified < ?",
                tableName
            );
            return jdbcTemplate.update(sql, java.sql.Timestamp.from(cutoffDate));
        } else {
            // Skip referenced entities
            String idList = skipIds.stream().map(String::valueOf).collect(Collectors.joining(","));
            String sql = String.format(
                "DELETE FROM %s WHERE deleted = true AND date_modified < ? AND id NOT IN (%s)",
                tableName, idList
            );
            int deleted = jdbcTemplate.update(sql, java.sql.Timestamp.from(cutoffDate));
            log.info("Skipped {} {} entities still referenced by active records", skipIds.size(), tableName);
            return deleted;
        }
    }

    /**
     * Fix all issues at once (duplicates, orphans, constraints - NOT purge).
     */
    @Transactional
    public IntegrityFixResult fixAll(boolean dryRun) {
        log.info("Fixing all integrity issues (dryRun={})", dryRun);

        IntegrityFixResult duplicatesResult = fixDuplicates(dryRun);
        IntegrityFixResult orphansResult = fixOrphanedReferences(dryRun);
        IntegrityFixResult constraintsResult = addPrimaryKeyConstraints(dryRun);

        IntegrityFixResult result = new IntegrityFixResult();
        result.setDryRun(dryRun);
        result.setDuplicatesRemoved(duplicatesResult.getDuplicatesRemoved());
        result.setOrphansRemoved(orphansResult.getOrphansRemoved());
        result.setConstraintsAdded(constraintsResult.getConstraintsAdded());

        List<String> allErrors = new ArrayList<>();
        allErrors.addAll(duplicatesResult.getErrors());
        allErrors.addAll(orphansResult.getErrors());
        allErrors.addAll(constraintsResult.getErrors());
        result.setErrors(allErrors);

        result.setSuccess(allErrors.isEmpty());
        result.setMessage(String.format(
            "%s: %d duplicates, %d orphans, %d constraints",
            dryRun ? "Would fix" : "Fixed",
            result.getDuplicatesRemoved(),
            result.getOrphansRemoved(),
            result.getConstraintsAdded()
        ));

        return result;
    }

    // ==================== DTOs ====================

    @Data
    public static class IntegrityCheckResult {
        private Instant checkedAt;
        private boolean hasIssues;
        private int totalDuplicates;
        private int totalOrphans;
        private boolean constraintsMissing;
        private int totalSoftDeleted;
        private int softDeleteRetentionDays;
        private Map<String, TableIssues> tableIssues;
        private Map<String, Long> softDeletedByEntity;
    }

    @Data
    public static class TableIssues {
        private String tableName;
        private long duplicateCount;
        private long orphanCount;
        private boolean hasPrimaryKey;
    }

    @Data
    public static class IntegrityFixResult {
        private boolean success;
        private String message;
        private boolean dryRun;
        private int duplicatesRemoved;
        private int orphansRemoved;
        private int constraintsAdded;
        private int softDeletedPurged;
        private List<String> errors = new ArrayList<>();
    }
}
