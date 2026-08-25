package com.dk_power.power_plant_java.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

/**
 * Drops the stale auto-generated UNIQUE constraint/index that H2 created on {@code instrument.tag_number}
 * back when {@code Instrument.tagNumber} was {@code @Column(unique=true)}.
 *
 * <p>That annotation was removed so a duplicate tagNumber can INSERT and COEXIST just long enough for the
 * hub-only {@code InstrumentMergeService} to merge it (the deterministic-coexist convergence path — same as
 * Category/Value, which have no DB uniqueness). But {@code spring.jpa.hibernate.ddl-auto=update} never DROPS
 * a constraint it once created, so every existing hub + desktop H2 file still carries the unique index —
 * which would turn the intended transient coexist into an INSERT poison-pill that aborts the whole apply
 * batch. This fixer removes it at startup on every node.
 *
 * <p>Idempotent + fresh-DB-safe: a freshly-built schema never has the constraint (the entity no longer
 * declares it), so this finds nothing and no-ops. Best-effort — a failure is logged, never aborts startup.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(45) // before AdminUserSeeder / any sync apply
public class InstrumentTagUniqueConstraintFixer {

    private final DataSource dataSource;

    @EventListener(ApplicationReadyEvent.class)
    public void dropTagNumberUniqueness() {
        try (Connection conn = dataSource.getConnection()) {
            boolean droppedAny = false;

            // 1) Named UNIQUE CONSTRAINT form (Hibernate's usual output for @Column(unique=true)).
            for (String name : findUniqueConstraints(conn, "INSTRUMENT", "TAG_NUMBER")) {
                try (Statement s = conn.createStatement()) {
                    s.execute("ALTER TABLE instrument DROP CONSTRAINT IF EXISTS " + name);
                    log.info("InstrumentTagUniqueConstraintFixer: dropped unique constraint {} on instrument.tag_number", name);
                    droppedAny = true;
                } catch (Exception drop) {
                    log.warn("InstrumentTagUniqueConstraintFixer: failed to drop constraint {}: {}", name, drop.getMessage());
                }
            }

            // 2) Bare UNIQUE INDEX form (fallback — separate try so a schema-view mismatch can't abort).
            try {
                for (String idx : findUniqueIndexes(conn, "INSTRUMENT", "TAG_NUMBER")) {
                    try (Statement s = conn.createStatement()) {
                        s.execute("DROP INDEX IF EXISTS " + idx);
                        log.info("InstrumentTagUniqueConstraintFixer: dropped unique index {} on instrument.tag_number", idx);
                        droppedAny = true;
                    } catch (Exception drop) {
                        log.warn("InstrumentTagUniqueConstraintFixer: failed to drop index {}: {}", idx, drop.getMessage());
                    }
                }
            } catch (Exception idxScan) {
                log.debug("InstrumentTagUniqueConstraintFixer: unique-index scan skipped: {}", idxScan.getMessage());
            }

            if (!droppedAny) {
                log.debug("InstrumentTagUniqueConstraintFixer: no unique tag_number constraint/index present");
            }
        } catch (Exception e) {
            log.warn("InstrumentTagUniqueConstraintFixer: skipped (likely non-H2 or no table yet): {}", e.getMessage());
        }
    }

    private List<String> findUniqueConstraints(Connection conn, String table, String column) throws Exception {
        List<String> names = new ArrayList<>();
        String sql =
                "SELECT DISTINCT tc.CONSTRAINT_NAME " +
                "FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc " +
                "JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME " +
                "WHERE UPPER(tc.TABLE_NAME) = ? AND tc.CONSTRAINT_TYPE = 'UNIQUE' AND UPPER(kcu.COLUMN_NAME) = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, table.toUpperCase());
            ps.setString(2, column.toUpperCase());
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) names.add(rs.getString(1));
            }
        }
        return names;
    }

    /** Non-primary-key unique indexes on the column that are NOT the intentional non-unique lookup index. */
    private List<String> findUniqueIndexes(Connection conn, String table, String column) throws Exception {
        List<String> names = new ArrayList<>();
        // H2 v2: INFORMATION_SCHEMA.INDEXES has one row per (index, column); IS_UNIQUE distinguishes them.
        String sql =
                "SELECT DISTINCT INDEX_NAME FROM INFORMATION_SCHEMA.INDEXES " +
                "WHERE UPPER(TABLE_NAME) = ? AND UPPER(COLUMN_NAME) = ? AND IS_UNIQUE = TRUE";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, table.toUpperCase());
            ps.setString(2, column.toUpperCase());
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String n = rs.getString(1);
                    // Never drop the deliberate non-unique lookup index (it won't match IS_UNIQUE anyway, but be safe).
                    if (n != null && !n.equalsIgnoreCase("idx_instrument_tag_number")) names.add(n);
                }
            }
        }
        return names;
    }
}
