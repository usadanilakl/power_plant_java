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
 * Self-heals the {@code recurring_pm} table schema on startup.
 *
 * The table originally had a UNIQUE index on {@code pmnum}; the catalog was later re-keyed on
 * {@code pm_key} (= pmnum or "D:"+description, since pmnum is sparse) and {@code preferred_day_of_week}
 * was added. {@code ddl-auto=update} failed to add {@code pm_key} because creating a UNIQUE index over
 * the existing rows (all NULL on the new column) is rejected by H2 — leaving the column missing
 * ({@code Column "PM_KEY" not found}). And the stale UNIQUE index on {@code pmnum} would block the
 * now-nullable pmnum (description-keyed rows have a NULL pmnum).
 *
 * <p>It also drops the auto-generated CHECK constraint H2 created on the {@code cadence} enum column when
 * the table was first built. That constraint hard-codes the original enum values ({@code DAY, WEEK, MONTH,
 * OTHER}); adding {@code BIWEEK} / {@code QUARTER} makes any update to those values fail with
 * {@code "Check constraint violation: CONSTRAINT_7B"}. {@code ddl-auto=update} never refreshes an existing
 * CHECK constraint when the Java enum gains values, so we drop it explicitly (the column is a wide-enough
 * VARCHAR, and the enum is validated in Java).
 *
 * This fixer runs idempotent DDL. Best-effort; never aborts startup.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(40) // before AdminUserSeeder etc.
public class RecurringPmSchemaFixer {

    private final DataSource dataSource;

    @EventListener(ApplicationReadyEvent.class)
    public void fix() {
        String[] statements = {
            "ALTER TABLE recurring_pm ADD COLUMN IF NOT EXISTS pm_key VARCHAR(1024)",
            "ALTER TABLE recurring_pm ADD COLUMN IF NOT EXISTS preferred_day_of_week INTEGER",
            "ALTER TABLE recurring_pm ADD COLUMN IF NOT EXISTS manually_added BOOLEAN DEFAULT FALSE",
            "ALTER TABLE recurring_pm ADD COLUMN IF NOT EXISTS form_key VARCHAR(128)",
            "ALTER TABLE recurring_pm ADD COLUMN IF NOT EXISTS form_keys VARCHAR(1024)",
            // Stale UNIQUE index on pmnum — pmnum is now nullable (description-keyed rows). Drop it.
            "DROP INDEX IF EXISTS idx_recurring_pm_pmnum",
        };
        try (Connection conn = dataSource.getConnection()) {
            for (String sql : statements) {
                try (Statement s = conn.createStatement()) {
                    s.execute(sql);
                    log.info("RecurringPmSchemaFixer: ran [{}]", sql);
                } catch (Exception one) {
                    // e.g. table doesn't exist yet (fresh DB), or non-H2 — non-fatal.
                    log.debug("RecurringPmSchemaFixer: skipped [{}]: {}", sql, one.getMessage());
                }
            }
            dropStaleCadenceCheck(conn);
        } catch (Exception e) {
            log.warn("RecurringPmSchemaFixer: skipped (no DB / non-H2): {}", e.getMessage());
        }
    }

    /**
     * Drop any CHECK constraint that references the {@code cadence} column — it hard-codes the old enum values
     * and rejects newly-added ones (BIWEEK/QUARTER). Idempotent: looks the constraint up each startup and drops
     * it; does nothing once gone. Hibernate {@code update} does not re-emit CHECK constraints on existing columns.
     */
    private void dropStaleCadenceCheck(Connection conn) {
        try {
            for (String name : findCheckConstraints(conn, "RECURRING_PM", "CADENCE")) {
                try (Statement s = conn.createStatement()) {
                    s.execute("ALTER TABLE recurring_pm DROP CONSTRAINT IF EXISTS " + name);
                    log.info("RecurringPmSchemaFixer: dropped stale cadence CHECK constraint {}", name);
                } catch (Exception drop) {
                    log.warn("RecurringPmSchemaFixer: failed to drop cadence constraint {}: {}", name, drop.getMessage());
                }
            }
        } catch (Exception e) {
            log.debug("RecurringPmSchemaFixer: cadence-constraint lookup skipped: {}", e.getMessage());
        }
    }

    /** CHECK-constraint names on the given table whose clause references the given column (H2 INFORMATION_SCHEMA). */
    private List<String> findCheckConstraints(Connection conn, String table, String column) throws Exception {
        List<String> names = new ArrayList<>();
        String sql =
                "SELECT cc.CONSTRAINT_NAME " +
                "FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc " +
                "JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc " +
                "  ON cc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME " +
                "WHERE UPPER(tc.TABLE_NAME) = ? " +
                "  AND UPPER(cc.CHECK_CLAUSE) LIKE ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, table.toUpperCase());
            ps.setString(2, "%" + column.toUpperCase() + "%");
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) names.add(rs.getString(1));
            }
        }
        return names;
    }
}
