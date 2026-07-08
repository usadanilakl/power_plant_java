package com.dk_power.power_plant_java.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.io.File;
import java.io.FileInputStream;
import java.sql.Connection;
import java.util.List;
import java.util.Properties;

/**
 * Ensures the id_seq sequence is consistent after a database restore (cold resync).
 *
 * When Electron downloads the sync server's H2 backup and places it as the client's
 * proddb.mv.db, the id_seq sequence may be at a stale value. The DevicePrefixedIdGenerator
 * computes: deviceNumber * 1_000_000_000 + id_seq.nextVal. If the sequence is too low,
 * new inserts could generate IDs that collide with existing data from this device.
 *
 * This component runs on every startup — it's a no-op when the sequence is already correct.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SequenceInitializer {

    private static final long DEVICE_ID_MULTIPLIER = 1_000_000_000L;
    private static final String MACHINE_ID_FILE = "./machine-id.properties";

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    private boolean isPostgres() {
        try (Connection conn = dataSource.getConnection()) {
            String product = conn.getMetaData().getDatabaseProductName();
            return product != null && product.toLowerCase().contains("postgresql");
        } catch (Exception e) {
            return false;
        }
    }

    @PostConstruct
    public void ensureSequenceConsistency() {
        try {
            long deviceNumber = readDeviceNumber();
            if (deviceNumber < 0 || deviceNumber > 99) {
                return;
            }

            boolean postgres = isPostgres();
            long rangeStart = deviceNumber * DEVICE_ID_MULTIPLIER;
            long rangeEnd = rangeStart + DEVICE_ID_MULTIPLIER;

            // Find all user tables that have an ID column (skip system/audit tables)
            // Use UPPER() for case-insensitive match: H2 stores names uppercase, PG lowercase
            List<String> tables = jdbcTemplate.queryForList(
                "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS " +
                "WHERE UPPER(COLUMN_NAME) = 'ID' AND TABLE_SCHEMA = CURRENT_SCHEMA " +
                "AND UPPER(TABLE_NAME) NOT LIKE '%_AUD' AND UPPER(TABLE_NAME) <> 'REVINFO' " +
                // Only numeric-id tables: MOD(ID,?) throws on UUID ids (e.g. FIELD_CHANGE),
                // which otherwise spams the H2 trace file every startup.
                "AND UPPER(DATA_TYPE) IN ('BIGINT','INTEGER','SMALLINT','NUMERIC','DECIMAL')",
                String.class
            );

            if (tables.isEmpty()) {
                return;
            }

            // Find the max suffix (id % 1B) across all tables for this device's range
            long maxSuffix = 0;
            for (String table : tables) {
                try {
                    // PostgreSQL is case-sensitive with quoted identifiers — use as-is
                    String quotedTable = postgres ? "\"" + table + "\"" : "\"" + table + "\"";
                    Long tablMax = jdbcTemplate.queryForObject(
                        "SELECT MAX(MOD(ID, ?)) FROM " + quotedTable + " WHERE ID >= ? AND ID < ?",
                        Long.class,
                        DEVICE_ID_MULTIPLIER, rangeStart, rangeEnd
                    );
                    if (tablMax != null && tablMax > maxSuffix) {
                        maxSuffix = tablMax;
                    }
                } catch (Exception e) {
                    // Table might not have numeric ID or other issues — skip
                }
            }

            if (maxSuffix == 0) {
                log.debug("No existing IDs found for device {} — sequence is fine", deviceNumber);
                return;
            }

            // Get current sequence value — dialect-aware
            String nextValSql = postgres ? "SELECT nextval('id_seq')" : "SELECT NEXT VALUE FOR id_seq";
            Long currentSeqVal = jdbcTemplate.queryForObject(nextValSql, Long.class);

            if (currentSeqVal != null && currentSeqVal <= maxSuffix) {
                long newStart = maxSuffix + 1;
                jdbcTemplate.execute("ALTER SEQUENCE id_seq RESTART WITH " + newStart);
                log.warn("id_seq adjusted: was {} -> now {} (device {} had IDs up to suffix {})",
                    currentSeqVal, newStart, deviceNumber, maxSuffix);
            } else {
                log.debug("id_seq is consistent: current={}, maxSuffix={}, device={}",
                    currentSeqVal, maxSuffix, deviceNumber);
            }
        } catch (Exception e) {
            log.warn("Sequence consistency check failed (non-fatal): {}", e.getMessage());
        }
    }

    private long readDeviceNumber() {
        File file = new File(MACHINE_ID_FILE);
        if (!file.exists()) {
            return -1;
        }
        try (FileInputStream fis = new FileInputStream(file)) {
            Properties props = new Properties();
            props.load(fis);
            String val = props.getProperty("device.number");
            if (val != null && !val.isEmpty()) {
                return Long.parseLong(val.trim());
            }
        } catch (Exception e) {
            log.debug("Could not read device number: {}", e.getMessage());
        }
        return -1;
    }
}
