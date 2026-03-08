package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.sevice.sync.EntityTableRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

/**
 * Fixes NULL deleted values in entity tables on startup.
 * Some entities have deleted=NULL instead of deleted=false (e.g., from old data,
 * backup restores, or raw SQL operations). NULL values are invisible to both
 * JPA's @Where(clause = "deleted = false") and export queries.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DeletedFieldNormalizer {

    private final EntityTableRegistry entityTableRegistry;
    private final DataSource dataSource;

    @EventListener(ApplicationReadyEvent.class)
    @Order(1)
    public void normalizeDeletedFields() {
        int totalFixed = 0;

        try (Connection conn = dataSource.getConnection()) {
            for (String entityType : entityTableRegistry.getSyncOrder()) {
                String tableName = entityTableRegistry.getTableName(entityType);
                try (Statement stmt = conn.createStatement()) {
                    int fixed = stmt.executeUpdate(
                        "UPDATE " + tableName + " SET deleted = false WHERE deleted IS NULL");
                    if (fixed > 0) {
                        totalFixed += fixed;
                        log.info("Normalized {} NULL deleted values in {} ({})", fixed, entityType, tableName);
                    }
                } catch (Exception e) {
                    log.debug("Could not normalize table {} ({}): {}", entityType, tableName, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to normalize deleted fields: {}", e.getMessage());
        }

        if (totalFixed > 0) {
            log.info("Total normalized NULL deleted values: {} rows across all tables", totalFixed);
        } else {
            log.debug("No NULL deleted values found — all tables clean");
        }

        repairOrphanedValues();
        repairDoubleEncodedJsonLobs();
    }

    /**
     * Repair JSON LOB fields in FormContainer and PrintableForm that were corrupted
     * by sync double-encoding. The serializeValue() method used to JSON-encode String
     * values (adding quotes + escaping inner quotes), but deserializeValue() only stripped
     * surrounding quotes without unescaping — leaving literal backslash characters.
     *
     * Detects corruption by checking for literal backslash-quote sequences in JSON columns.
     * Fixes by replacing \" with " (unescaping the JSON).
     */
    private void repairDoubleEncodedJsonLobs() {
        String[] columns = {"content_json", "position_json", "size_json", "style_json", "content_style_json"};
        int totalFixed = 0;

        try (Connection conn = dataSource.getConnection()) {
            for (String col : columns) {
                try (Statement stmt = conn.createStatement()) {
                    // Fix double-encoded JSON: {\"x\":0} → {"x":0}
                    int fixed = stmt.executeUpdate(
                        "UPDATE form_container SET " + col + " = REPLACE(" + col + ", '\\\"', '\"') " +
                        "WHERE " + col + " LIKE '%\\\"%' AND deleted = false");
                    if (fixed > 0) {
                        totalFixed += fixed;
                        log.info("Repaired {} double-encoded JSON values in form_container.{}", fixed, col);
                    }
                } catch (Exception e) {
                    log.debug("Could not repair form_container.{}: {}", col, e.getMessage());
                }
            }

            // Also repair PrintableForm.size column
            try (Statement stmt = conn.createStatement()) {
                int fixed = stmt.executeUpdate(
                    "UPDATE printable_form SET size = REPLACE(size, '\\\"', '\"') " +
                    "WHERE size LIKE '%\\\"%' AND deleted = false");
                if (fixed > 0) {
                    totalFixed += fixed;
                    log.info("Repaired {} double-encoded JSON values in printable_form.size", fixed);
                }
            } catch (Exception e) {
                log.debug("Could not repair printable_form.size: {}", e.getMessage());
            }
        } catch (Exception e) {
            log.warn("JSON LOB repair failed (non-fatal): {}", e.getMessage());
        }

        if (totalFixed > 0) {
            log.info("Total repaired double-encoded JSON LOB values: {}", totalFixed);
        }
    }

    /**
     * Un-delete Values that were incorrectly soft-deleted by the merge service
     * while still referenced by active (non-deleted) entities.
     * This repairs data corruption from the CategoryValueMergeService deleting
     * Values before all references were successfully re-pointed.
     */
    private void repairOrphanedValues() {
        try (Connection conn = dataSource.getConnection()) {

            // Use DatabaseMetaData to find ALL FK columns referencing val_table
            DatabaseMetaData meta = conn.getMetaData();
            List<String> existsClauses = new ArrayList<>();
            try (ResultSet rs = meta.getExportedKeys(null, null, "VAL_TABLE")) {
                while (rs.next()) {
                    String fkTable = rs.getString("FKTABLE_NAME");
                    String fkColumn = rs.getString("FKCOLUMN_NAME");
                    // Check if the referencing table has a 'deleted' column
                    boolean hasDeleted = false;
                    try (ResultSet cols = meta.getColumns(null, null, fkTable, "DELETED")) {
                        hasDeleted = cols.next();
                    }
                    String deletedFilter = hasDeleted
                        ? " AND (t.\"DELETED\" IS NULL OR t.\"DELETED\" = false)"
                        : "";
                    existsClauses.add(
                        "EXISTS (SELECT 1 FROM \"" + fkTable + "\" t " +
                        "WHERE t.\"" + fkColumn + "\" = v.id" + deletedFilter + ")");
                }
            }

            if (existsClauses.isEmpty()) {
                log.debug("No FK references to val_table found — skipping repair");
                return;
            }

            String sql = "UPDATE val_table SET deleted = false " +
                "WHERE deleted = true AND id IN (" +
                "  SELECT DISTINCT v.id FROM val_table v WHERE v.deleted = true AND (" +
                String.join(" OR ", existsClauses) +
                "))";

            try (Statement stmt = conn.createStatement()) {
                int repaired = stmt.executeUpdate(sql);
                if (repaired > 0) {
                    log.info("Repaired {} Values that were soft-deleted while still referenced by active entities", repaired);
                }
            }
        } catch (Exception e) {
            log.warn("Value repair check failed (non-fatal): {}", e.getMessage());
        }
    }
}
