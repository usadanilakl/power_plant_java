package com.dk_power.power_plant_java.sevice.sync;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Imports a JSON ZIP database export into the local H2 database on startup.
 *
 * This handles the cold resync case when the hub runs PostgreSQL:
 * 1. Electron downloads the JSON ZIP from hub before starting Spring Boot
 * 2. Saves it to ./sync-import/resync-data.zip
 * 3. Spring Boot starts with an empty H2 database
 * 4. This component detects the ZIP, imports all entities, and deletes the ZIP
 *
 * Import order follows EntityTableRegistry.getSyncOrder() to respect FK dependencies.
 * Uses JdbcTemplate for fast batch inserts (bypasses JPA entity listeners).
 *
 * Only runs on clients (not hub) — the hub exports, clients import.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JsonResyncImporter {

    private static final String IMPORT_DIR = "./sync-import";
    private static final String IMPORT_FILE = "resync-data.zip";

    private final JdbcTemplate jdbcTemplate;
    private final EntityTableRegistry entityTableRegistry;
    private final ObjectMapper objectMapper;

    /**
     * Join tables to import (must match HubResyncService.JOIN_TABLES).
     * Format: [tableName, dbCol1, dbCol2, jsonKey1, jsonKey2]
     */
    private static final List<String[]> JOIN_TABLES = List.of(
        new String[]{"eq_loto_point", "eq_id", "loto_point_id", "equipmentId", "lotoPointId"},
        new String[]{"file_point", "point_id", "file_id", "equipmentId", "fileId"},
        new String[]{"loto_standard_loto_point", "loto_standard_id", "loto_point_id", "lotoStandardId", "lotoPointId"},
        new String[]{"loto_standard_groups", "loto_standard_id", "value_id", "lotoStandardId", "valueId"},
        new String[]{"ht_equipment", "ht_id", "eq_id", "heatTraceId", "equipmentId"},
        new String[]{"ht_pid", "ht_id", "pid_id", "heatTraceId", "fileObjectId"},
        new String[]{"breaker_eq", "br_id", "eq_id", "breakerId", "equipmentId"},
        new String[]{"permit_equipment", "permit_id", "equipment_id", "permitId", "equipmentId"},
        new String[]{"daily_permit_package_lotos", "daily_permit_package_id", "loto_id", "dailyPermitPackageId", "lotoId"}
    );

    @EventListener(ApplicationReadyEvent.class)
    @Order(10) // Run after SyncSchemaPreparation (order 0) and SequenceInitializer
    public void importIfAvailable() {
        Path importPath = Paths.get(IMPORT_DIR, IMPORT_FILE);
        if (!Files.exists(importPath)) {
            return;
        }

        log.info("=== JSON Resync Import: found {} ===", importPath);
        long start = System.currentTimeMillis();

        try {
            Map<String, List<Map<String, Object>>> data = readZipContents(importPath);
            int totalImported = importAllEntities(data);
            long elapsed = System.currentTimeMillis() - start;
            log.info("=== JSON Resync Import complete: {} records imported in {}ms ===", totalImported, elapsed);

            // Delete the ZIP after successful import
            Files.deleteIfExists(importPath);
            log.info("Deleted import file: {}", importPath);
        } catch (Exception e) {
            log.error("JSON Resync Import FAILED: {}", e.getMessage(), e);
            // Don't delete the ZIP on failure — allows retry on next startup
        }
    }

    private Map<String, List<Map<String, Object>>> readZipContents(Path zipPath) throws IOException {
        Map<String, List<Map<String, Object>>> data = new LinkedHashMap<>();

        try (ZipInputStream zis = new ZipInputStream(Files.newInputStream(zipPath))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                String name = entry.getName();
                if (name.equals("metadata.json") || entry.isDirectory()) {
                    zis.closeEntry();
                    continue;
                }

                // Strip .json extension to get table name
                String tableName = name.endsWith(".json") ? name.substring(0, name.length() - 5) : name;

                byte[] content = zis.readAllBytes();
                try {
                    List<Map<String, Object>> entities = objectMapper.readValue(
                        content, new TypeReference<List<Map<String, Object>>>() {});
                    data.put(tableName, entities);
                    log.debug("Read {} records from {}", entities.size(), name);
                } catch (Exception e) {
                    log.warn("Could not parse {}: {}", name, e.getMessage());
                }
                zis.closeEntry();
            }
        }

        return data;
    }

    @Transactional
    protected int importAllEntities(Map<String, List<Map<String, Object>>> data) {
        int totalImported = 0;

        // Import entity tables in sync order (parents before children)
        for (String entityType : entityTableRegistry.getSyncOrder()) {
            String tableName = entityTableRegistry.getTableName(entityType);
            List<Map<String, Object>> entities = data.get(tableName);
            if (entities != null && !entities.isEmpty()) {
                totalImported += importEntityTable(tableName, entities);
            }
        }

        // Import join tables
        for (String[] jt : JOIN_TABLES) {
            String tableName = jt[0];
            List<Map<String, Object>> rows = data.get(tableName);
            if (rows != null && !rows.isEmpty()) {
                totalImported += importJoinTable(tableName, jt[1], jt[2], jt[3], jt[4], rows);
            }
        }

        return totalImported;
    }

    private int importEntityTable(String tableName, List<Map<String, Object>> entities) {
        if (entities.isEmpty()) return 0;

        // Get column names from first entity, convert camelCase to snake_case
        Set<String> jsonKeys = entities.get(0).keySet();
        List<String> dbColumns = jsonKeys.stream()
            .map(this::camelToSnakeCase)
            .toList();

        String columnList = String.join(", ", dbColumns);
        String placeholders = String.join(", ", Collections.nCopies(dbColumns.size(), "?"));
        String insertSql = String.format("INSERT INTO %s (%s) VALUES (%s)", tableName, columnList, placeholders);

        List<String> keyOrder = new ArrayList<>(jsonKeys);

        int imported = 0;
        for (Map<String, Object> entity : entities) {
            try {
                Object[] values = keyOrder.stream()
                    .map(key -> convertValue(entity.get(key)))
                    .toArray();
                jdbcTemplate.update(insertSql, values);
                imported++;
            } catch (Exception e) {
                log.trace("Failed to import row to {}: {}", tableName, e.getMessage());
            }
        }

        log.info("Imported {}/{} records into {}", imported, entities.size(), tableName);
        return imported;
    }

    private int importJoinTable(String tableName, String dbCol1, String dbCol2,
                                 String jsonKey1, String jsonKey2,
                                 List<Map<String, Object>> rows) {
        String insertSql = String.format("INSERT INTO %s (%s, %s) VALUES (?, ?)", tableName, dbCol1, dbCol2);

        int imported = 0;
        for (Map<String, Object> row : rows) {
            try {
                Long val1 = extractLongValue(row, dbCol1, jsonKey1);
                Long val2 = extractLongValue(row, dbCol2, jsonKey2);

                if (val1 != null && val2 != null) {
                    jdbcTemplate.update(insertSql, val1, val2);
                    imported++;
                }
            } catch (Exception e) {
                log.trace("Failed to import row to {}: {}", tableName, e.getMessage());
            }
        }

        log.info("Imported {}/{} rows into join table {}", imported, rows.size(), tableName);
        return imported;
    }

    private Long extractLongValue(Map<String, Object> row, String... keys) {
        for (String key : keys) {
            Object val = row.get(key);
            if (val instanceof Number num) {
                return num.longValue();
            }
        }
        return null;
    }

    private Object convertValue(Object value) {
        if (value == null) return null;
        if (value instanceof Number || value instanceof Boolean) return value;
        if (value instanceof String s) {
            // Try to parse ISO instant strings for timestamp columns
            if (s.length() > 18 && s.contains("T") && (s.endsWith("Z") || s.contains("+"))) {
                try {
                    return java.sql.Timestamp.from(Instant.parse(s));
                } catch (Exception ignored) {}
            }
            return s;
        }
        // Collections and nested objects — store as JSON string
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return value.toString();
        }
    }

    private String camelToSnakeCase(String camelCase) {
        return camelCase.replaceAll("([a-z])([A-Z])", "$1_$2").toLowerCase();
    }
}
