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

        } catch (Exception e) {
            log.warn("Sync schema preparation failed (non-fatal): {}", e.getMessage());
        }
    }
}
