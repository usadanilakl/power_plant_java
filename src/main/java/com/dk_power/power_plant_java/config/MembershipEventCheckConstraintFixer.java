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
 * Drops the auto-generated CHECK constraint H2 created on {@code membership_event.op} when the table
 * was first built by an EARLIER build of the OR-Set.
 *
 * <p>The membership OR-Set's {@code op} enum shipped as {@code {ADD, REMOVE}} first (commit
 * {@code b3305905b}) and gained {@code RESET} later (commit {@code d8ade4174}). Any node — hub OR
 * desktop — that ran an intermediate build already has {@code membership_event} with a CHECK constraint
 * hard-coding {@code op IN ('ADD','REMOVE')}. Because {@code spring.jpa.hibernate.ddl-auto=update} only
 * ADDS tables/columns and never revises an existing CHECK constraint, the new build's first {@code RESET}
 * write (the reconcile / "Use Hub" barrier) fails with {@code "Check constraint violation"}. This was
 * observed live on the dev hub and fixed there by a manual {@code ALTER}; that is not viable across a
 * fleet of desktop clients, so it is automated here.
 *
 * <p>Dropping the stale constraint is safe: {@code op} is a wide-enough {@code VARCHAR(8)} to hold every
 * value, and application code is the sole writer (only ever the three valid ops). Hibernate has already
 * run its schema update by {@code ApplicationReadyEvent}, so it will not re-emit one — the column simply
 * ends up unconstrained, which is fine.
 *
 * <p>Idempotent and fleet-safe: a FRESH node (table created by this build) has a correct constraint whose
 * clause already permits RESET — it is dropped too (harmless), or none is found and this is a no-op. Runs
 * early (before the sync apply path can issue a RESET) and never aborts startup on failure.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(50) // run before sync processing / seeding can write a RESET
public class MembershipEventCheckConstraintFixer {

    private final DataSource dataSource;

    @EventListener(ApplicationReadyEvent.class)
    public void fixCheckConstraints() {
        try (Connection conn = dataSource.getConnection()) {
            List<String> toDrop = findCheckConstraints(conn, "MEMBERSHIP_EVENT", "OP");
            if (toDrop.isEmpty()) {
                log.debug("MembershipEventCheckConstraintFixer: no check constraints to drop");
                return;
            }
            for (String name : toDrop) {
                try (Statement s = conn.createStatement()) {
                    s.execute("ALTER TABLE membership_event DROP CONSTRAINT IF EXISTS " + name);
                    log.info("MembershipEventCheckConstraintFixer: dropped stale op CHECK constraint {} "
                            + "(pre-RESET build) — RESET writes are now accepted", name);
                } catch (Exception drop) {
                    // Best-effort: log but never abort startup if a single drop fails.
                    log.warn("MembershipEventCheckConstraintFixer: failed to drop {}: {}", name, drop.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("MembershipEventCheckConstraintFixer: skipped (likely non-H2 or no table yet): {}",
                    e.getMessage());
        }
    }

    /**
     * Every CHECK constraint on {@code table} whose clause references {@code column}. H2 stores the
     * definitions in {@code INFORMATION_SCHEMA.CHECK_CONSTRAINTS}, filtered to the table via
     * {@code TABLE_CONSTRAINTS}. Constraint names are uppercase (H2 default). Mirrors
     * {@link ApprovalEventCheckConstraintFixer#findCheckConstraints}.
     */
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
