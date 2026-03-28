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

/**
 * Backfills NULL optimistic-lock versions on legacy rows.
 *
 * Existing databases predate the @Version column, so rows restored from backups or
 * created before the versioning rollout may have version=NULL. Hibernate cannot
 * increment a NULL Long version on update and throws during flush.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class VersionFieldNormalizer {

    private final EntityTableRegistry entityTableRegistry;
    private final DataSource dataSource;

    @EventListener(ApplicationReadyEvent.class)
    @Order(2)
    public void normalizeVersionFields() {
        int totalFixed = 0;

        try (Connection conn = dataSource.getConnection()) {
            for (String entityType : entityTableRegistry.getSyncOrder()) {
                String tableName = entityTableRegistry.getTableName(entityType);
                if (!hasVersionColumn(conn, tableName)) {
                    continue;
                }

                try (Statement stmt = conn.createStatement()) {
                    int fixed = stmt.executeUpdate(
                        "UPDATE " + tableName + " SET version = 0 WHERE version IS NULL");
                    if (fixed > 0) {
                        totalFixed += fixed;
                        log.info("Normalized {} NULL version values in {} ({})", fixed, entityType, tableName);
                    }
                } catch (Exception e) {
                    log.debug("Could not normalize version in {} ({}): {}", entityType, tableName, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to normalize version fields: {}", e.getMessage());
        }

        if (totalFixed > 0) {
            log.info("Total normalized NULL version values: {} rows across all tables", totalFixed);
        } else {
            log.debug("No NULL version values found");
        }
    }

    private boolean hasVersionColumn(Connection conn, String tableName) {
        try (ResultSet rs = conn.getMetaData().getColumns(null, null, tableName.toUpperCase(), "VERSION")) {
            if (rs.next()) return true;
        } catch (Exception ignored) {
        }
        try (ResultSet rs = conn.getMetaData().getColumns(null, null, tableName.toLowerCase(), "version")) {
            return rs.next();
        } catch (Exception ignored) {
            return false;
        }
    }
}
