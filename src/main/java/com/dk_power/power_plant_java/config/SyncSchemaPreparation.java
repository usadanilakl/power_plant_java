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
        "ID", "OBJECT_TYPE", "DELETED", "DATE_CREATED", "DATE_MODIFIED",
        "id", "object_type", "deleted", "date_created", "date_modified"
    );

    @EventListener(ApplicationReadyEvent.class)
    @Order(0)
    public void prepareSchemaForSync() {
        int totalAltered = 0;

        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            boolean postgres = isPostgres(conn);

            for (String entityType : entityTableRegistry.getSyncOrder()) {
                String tableName = entityTableRegistry.getTableName(entityType);
                // H2 uses uppercase table names, PostgreSQL uses lowercase
                String queryTableName = postgres ? tableName.toLowerCase() : tableName.toUpperCase();

                // Collect column names FIRST, then ALTER — using the same Statement for
                // both executeQuery and executeUpdate closes the ResultSet prematurely.
                List<String> columnsToAlter = new ArrayList<>();
                ResultSet rs = stmt.executeQuery(
                    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS " +
                    "WHERE TABLE_NAME = '" + queryTableName + "' " +
                    "AND TABLE_SCHEMA = CURRENT_SCHEMA " +
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
                        if (postgres) {
                            // PostgreSQL: ALTER TABLE ... ALTER COLUMN ... DROP NOT NULL
                            stmt.executeUpdate(
                                "ALTER TABLE " + queryTableName + " ALTER COLUMN " + colName + " DROP NOT NULL");
                        } else {
                            // H2: ALTER TABLE ... ALTER COLUMN ... SET NULL
                            stmt.executeUpdate(
                                "ALTER TABLE " + queryTableName + " ALTER COLUMN " + colName + " SET NULL");
                        }
                        totalAltered++;
                    } catch (Exception e) {
                        log.trace("Could not alter {}.{}: {}", queryTableName, colName, e.getMessage());
                    }
                }
            }

            if (totalAltered > 0) {
                log.info("Sync schema preparation: altered {} NOT NULL columns to nullable", totalAltered);
            }

            // Backfill null @Version columns — existing rows predate the version field
            backfillVersionColumns(stmt, postgres);

            // Index for fast lookups on field_change — used by LWW, pending counts,
            // sync queries, and the NOT EXISTS check in findIdsMissingCreateMarker.
            // Without this, queries scan 270k+ rows on the hub.
            String fcTable = postgres ? "field_change" : "FIELD_CHANGE";
            createIndexIfNotExists(stmt, "idx_fc_entity_lookup",
                fcTable, postgres ? "entity_type, entity_id, change_type, field_name"
                                  : "ENTITY_TYPE, ENTITY_ID, CHANGE_TYPE, FIELD_NAME");
            createIndexIfNotExists(stmt, "idx_fc_synced_origin",
                fcTable, postgres ? "origin_machine_id, synced_to_machines"
                                  : "ORIGIN_MACHINE_ID, SYNCED_TO_MACHINES");
            createIndexIfNotExists(stmt, "idx_fc_timestamp",
                fcTable, postgres ? "timestamp" : "TIMESTAMP");

        } catch (Exception e) {
            log.warn("Sync schema preparation failed (non-fatal): {}", e.getMessage());
        }
    }

    private boolean isPostgres(Connection conn) {
        try {
            String product = conn.getMetaData().getDatabaseProductName();
            return product != null && product.toLowerCase().contains("postgresql");
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Sets version = 0 for any rows where the version column is null.
     * This handles existing data that predates the addition of @Version fields.
     */
    private void backfillVersionColumns(Statement stmt, boolean postgres) {
        String[] tables = postgres ? new String[]{"daily_permit_package"} : new String[]{"DAILY_PERMIT_PACKAGE"};
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
