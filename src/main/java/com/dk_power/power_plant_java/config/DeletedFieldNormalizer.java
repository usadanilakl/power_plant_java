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
import java.sql.Statement;

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
    }
}
