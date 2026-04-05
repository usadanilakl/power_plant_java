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
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Prepares the database schema for sync entity creation.
 *
 * Sync creates entities via JPA persist with pre-applied field values.
 * However, ManyToOne FK columns may be null when the referenced entity
 * hasn't been created yet (resolved later by the three-pass retry).
 * This component ALTERs ALL NOT NULL columns to nullable at startup,
 * ensuring persist succeeds even with unresolved references.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SyncSchemaPreparation {

    private final EntityTableRegistry entityTableRegistry;
    private final DataSource dataSource;

    private static final Set<String> SKIP_COLUMNS = Set.of(
        "ID", "OBJECT_TYPE", "DELETED", "DATE_CREATED", "DATE_MODIFIED"
    );

    @EventListener(ApplicationReadyEvent.class)
    @Order(0)
    public void prepareSchemaForSync() {
        int totalAltered = 0;

        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            for (String entityType : entityTableRegistry.getSyncOrder()) {
                String tableName = entityTableRegistry.getTableName(entityType).toUpperCase();

                // Collect column names FIRST, then ALTER — using the same Statement for
                // both executeQuery and executeUpdate closes the ResultSet prematurely.
                List<String> columnsToAlter = new ArrayList<>();
                ResultSet rs = stmt.executeQuery(
                    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS " +
                    "WHERE TABLE_NAME = '" + tableName + "' " +
                    "AND IS_NULLABLE = 'NO'");

                while (rs.next()) {
                    String colName = rs.getString("COLUMN_NAME");
                    if (!SKIP_COLUMNS.contains(colName)) {
                        columnsToAlter.add(colName);
                    }
                }
                rs.close();

                for (String colName : columnsToAlter) {
                    try {
                        stmt.executeUpdate(
                            "ALTER TABLE " + tableName + " ALTER COLUMN " + colName + " SET NULL");
                        totalAltered++;
                    } catch (Exception e) {
                        log.trace("Could not alter {}.{}: {}", tableName, colName, e.getMessage());
                    }
                }
            }

            if (totalAltered > 0) {
                log.info("Sync schema preparation: altered {} NOT NULL columns to nullable", totalAltered);
            }

            // Backfill null @Version columns — existing rows predate the version field
            backfillVersionColumns(stmt);

            // Index for fast lookups on field_change — used by LWW, pending counts,
            // sync queries, and the NOT EXISTS check in findIdsMissingCreateMarker.
            // Without this, queries scan 270k+ rows on the hub.
            createIndexIfNotExists(stmt, "IDX_FC_ENTITY_LOOKUP",
                "FIELD_CHANGE", "ENTITY_TYPE, ENTITY_ID, CHANGE_TYPE, FIELD_NAME");
            createIndexIfNotExists(stmt, "IDX_FC_SYNCED_ORIGIN",
                "FIELD_CHANGE", "ORIGIN_MACHINE_ID, SYNCED_TO_MACHINES");
            createIndexIfNotExists(stmt, "IDX_FC_TIMESTAMP",
                "FIELD_CHANGE", "TIMESTAMP");

        } catch (Exception e) {
            log.warn("Sync schema preparation failed (non-fatal): {}", e.getMessage());
        }
    }

    /**
     * Sets version = 0 for any rows where the version column is null.
     * This handles existing data that predates the addition of @Version fields.
     */
    private void backfillVersionColumns(Statement stmt) {
        String[] tables = {"DAILY_PERMIT_PACKAGE"};
        for (String table : tables) {
            try {
                int updated = stmt.executeUpdate(
                    "UPDATE " + table + " SET VERSION = 0 WHERE VERSION IS NULL");
                if (updated > 0) {
                    log.info("Backfilled {} null version rows in {}", updated, table);
                }
            } catch (Exception e) {
                log.trace("Could not backfill version for {}: {}", table, e.getMessage());
            }
        }
    }

    private void createIndexIfNotExists(Statement stmt, String indexName, String tableName, String columns) {
        try {
            stmt.executeUpdate("CREATE INDEX IF NOT EXISTS " + indexName + " ON " + tableName + " (" + columns + ")");
            log.debug("Index {} ensured on {}({})", indexName, tableName, columns);
        } catch (Exception e) {
            log.trace("Could not create index {}: {}", indexName, e.getMessage());
        }
    }
}
