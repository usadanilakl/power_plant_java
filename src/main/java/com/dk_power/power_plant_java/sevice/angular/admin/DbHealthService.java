package com.dk_power.power_plant_java.sevice.angular.admin;

import com.dk_power.power_plant_java.dto.admin.DbHealthDto;
import com.zaxxer.hikari.HikariDataSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Computes read-only H2 database health stats for the admin DB Health tab:
 * physical file size vs. logical table usage (dead-space %), biggest tables,
 * leftover Envers audit tables, attachment dedup stats, and FieldChange volume/day.
 *
 * <p>All queries use H2-specific functions (DISK_SPACE_USED, FORMATDATETIME) and are
 * individually guarded, so on a non-H2 datasource (Postgres migration) the endpoint
 * degrades to a note instead of failing.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DbHealthService {

    private static final int TOP_TABLES = 20;
    private static final double COMPACT_THRESHOLD_PCT = 25.0;

    private final JdbcTemplate jdbcTemplate;
    private final HikariDataSource dataSource;

    public DbHealthDto getDbHealth() {
        String jdbcUrl = dataSource.getJdbcUrl();
        boolean isH2 = jdbcUrl != null && jdbcUrl.contains(":h2:");

        DbHealthDto.DbHealthDtoBuilder dto = DbHealthDto.builder()
            .dialect(isH2 ? "H2" : "OTHER")
            .tables(new ArrayList<>())
            .auditTables(new ArrayList<>())
            .fieldChangeByDay(new ArrayList<>());

        if (!isH2) {
            return dto.note("DB Health stats are only available on the H2 datasource.").build();
        }

        // --- physical file sizes on disk ---
        String basePath = parseH2FilePath(jdbcUrl);
        dto.dbFilePath(basePath != null ? basePath + ".mv.db" : null);
        long fileSize = basePath != null ? fileSize(basePath + ".mv.db") : 0;
        dto.fileSizeBytes(fileSize);
        dto.traceSizeBytes(basePath != null ? fileSize(basePath + ".trace.db") : 0);

        // --- per-table logical usage (single proven query) ---
        long logical = 0;
        List<DbHealthDto.TableStat> all = new ArrayList<>();
        List<DbHealthDto.TableStat> audit = new ArrayList<>();
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT TABLE_NAME, DISK_SPACE_USED(TABLE_NAME) AS BYTES " +
                "FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='PUBLIC' ORDER BY BYTES DESC");
            for (Map<String, Object> r : rows) {
                String name = String.valueOf(r.get("TABLE_NAME"));
                long bytes = toLong(r.get("BYTES"));
                logical += bytes;
                DbHealthDto.TableStat stat = DbHealthDto.TableStat.builder().name(name).bytes(bytes).build();
                all.add(stat);
                String upper = name.toUpperCase();
                if (upper.equals("REVINFO") || upper.endsWith("_AUD")) audit.add(stat);
            }
        } catch (Exception e) {
            log.warn("[DbHealth] table usage query failed: {}", e.getMessage());
            dto.note("Could not read table usage: " + e.getMessage());
        }
        dto.logicalBytes(logical);
        dto.tables(all.size() > TOP_TABLES ? new ArrayList<>(all.subList(0, TOP_TABLES)) : all);
        dto.auditTables(audit);

        long dead = Math.max(0, fileSize - logical);
        dto.deadSpaceBytes(dead);
        double pct = fileSize > 0 ? (dead * 100.0 / fileSize) : 0.0;
        dto.deadSpacePercent(Math.round(pct * 10.0) / 10.0);
        dto.compactRecommended(pct >= COMPACT_THRESHOLD_PCT && dead > 50L * 1024 * 1024);

        // --- attachment dedup stats ---
        try {
            Map<String, Object> a = jdbcTemplate.queryForMap(
                "SELECT COUNT(*) ROWS, COUNT(DISTINCT CONTENT_HASH) DISTINCT_HASHES, " +
                "SUM(CASE WHEN CONTENT_HASH IS NULL THEN 1 ELSE 0 END) NULL_HASHES, " +
                "COALESCE(SUM(LENGTH(BASE64CONTENT)),0) TOTAL_BYTES FROM PERMIT_ATTACHMENT");
            dto.attachments(DbHealthDto.AttachmentStat.builder()
                .rowCount(toLong(a.get("ROWS")))
                .distinctHashes(toLong(a.get("DISTINCT_HASHES")))
                .nullHashCount(toLong(a.get("NULL_HASHES")))
                .totalBytes(toLong(a.get("TOTAL_BYTES")))
                .build());
        } catch (Exception e) {
            log.debug("[DbHealth] attachment stats failed: {}", e.getMessage());
        }

        // --- FieldChange volume ---
        try {
            dto.fieldChangeTotal(toLong(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM FIELD_CHANGE", Object.class)));
            List<Map<String, Object>> days = jdbcTemplate.queryForList(
                "SELECT FORMATDATETIME(TIMESTAMP,'yyyy-MM-dd') D, COUNT(*) C FROM FIELD_CHANGE " +
                "GROUP BY FORMATDATETIME(TIMESTAMP,'yyyy-MM-dd') ORDER BY D DESC LIMIT 14");
            List<DbHealthDto.DayCount> byDay = new ArrayList<>();
            for (Map<String, Object> d : days) {
                byDay.add(DbHealthDto.DayCount.builder()
                    .day(String.valueOf(d.get("D"))).count(toLong(d.get("C"))).build());
            }
            dto.fieldChangeByDay(byDay);
        } catch (Exception e) {
            log.debug("[DbHealth] field-change stats failed: {}", e.getMessage());
        }

        return dto.build();
    }

    /** Extract the file path from a jdbc:h2:file:&lt;path&gt;;opts URL. */
    private String parseH2FilePath(String jdbcUrl) {
        int idx = jdbcUrl.indexOf("h2:file:");
        if (idx < 0) return null;
        String base = jdbcUrl.substring(idx + "h2:file:".length());
        int semi = base.indexOf(';');
        if (semi >= 0) base = base.substring(0, semi);
        return base;
    }

    private long fileSize(String path) {
        try {
            Path p = Path.of(path).toAbsolutePath();
            return Files.exists(p) ? Files.size(p) : 0;
        } catch (Exception e) {
            log.debug("[DbHealth] could not size {}: {}", path, e.getMessage());
            return 0;
        }
    }

    private long toLong(Object o) {
        return o instanceof Number ? ((Number) o).longValue() : 0L;
    }
}
