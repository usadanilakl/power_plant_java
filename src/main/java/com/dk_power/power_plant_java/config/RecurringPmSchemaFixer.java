package com.dk_power.power_plant_java.config;

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
 * Self-heals the {@code recurring_pm} table schema on startup.
 *
 * The table originally had a UNIQUE index on {@code pmnum}; the catalog was later re-keyed on
 * {@code pm_key} (= pmnum or "D:"+description, since pmnum is sparse) and {@code preferred_day_of_week}
 * was added. {@code ddl-auto=update} failed to add {@code pm_key} because creating a UNIQUE index over
 * the existing rows (all NULL on the new column) is rejected by H2 — leaving the column missing
 * ({@code Column "PM_KEY" not found}). And the stale UNIQUE index on {@code pmnum} would block the
 * now-nullable pmnum (description-keyed rows have a NULL pmnum).
 *
 * This fixer runs idempotent DDL: ensure the two columns exist and drop the stale unique pmnum index.
 * Uniqueness is enforced logically instead — by the upsert (findFirstByPmKey) and by DedupKeyResolver
 * on the sync path. Best-effort; never aborts startup.
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
        } catch (Exception e) {
            log.warn("RecurringPmSchemaFixer: skipped (no DB / non-H2): {}", e.getMessage());
        }
    }
}
