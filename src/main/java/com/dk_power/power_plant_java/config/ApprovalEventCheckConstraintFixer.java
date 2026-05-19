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
 * Drops the auto-generated CHECK constraint that H2 created on
 * {@code loto_standard_approval_event.event_type} when the table was first
 * built. The constraint hard-codes the original enum values; adding new
 * values ({@code EDIT_PENDING_REVIEW}, {@code EDIT_ACCEPTED_AS_MINOR},
 * {@code EDIT_REQUIRES_REAPPROVAL} per loto-procedure.md §3.3) makes every
 * insert fail with {@code "Check constraint violation: CONSTRAINT_9C"}.
 *
 * <p>{@code spring.jpa.hibernate.ddl-auto=update} does NOT refresh existing
 * CHECK constraints when the underlying Java enum gains values — it only
 * adds tables/columns. So we explicitly drop any CHECK constraint on
 * that column at startup. Hibernate may or may not re-emit one; either way
 * the column itself is a wide-enough VARCHAR to accept the new values.
 *
 * <p>Idempotent: looks up constraints from INFORMATION_SCHEMA each startup
 * and drops them; doing nothing if none exist.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(50) // run before AdminUserSeeder etc.
public class ApprovalEventCheckConstraintFixer {

    private final DataSource dataSource;

    @EventListener(ApplicationReadyEvent.class)
    public void fixCheckConstraints() {
        try (Connection conn = dataSource.getConnection()) {
            List<String> toDrop = findCheckConstraints(conn,
                    "LOTO_STANDARD_APPROVAL_EVENT", "EVENT_TYPE");
            if (toDrop.isEmpty()) {
                log.debug("ApprovalEventCheckConstraintFixer: no check constraints to drop");
                return;
            }
            for (String name : toDrop) {
                try (Statement s = conn.createStatement()) {
                    s.execute("ALTER TABLE loto_standard_approval_event DROP CONSTRAINT IF EXISTS " + name);
                    log.info("ApprovalEventCheckConstraintFixer: dropped check constraint {}", name);
                } catch (Exception drop) {
                    // Best-effort: log but don't abort startup if a single drop fails
                    log.warn("ApprovalEventCheckConstraintFixer: failed to drop {}: {}", name, drop.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("ApprovalEventCheckConstraintFixer: skipped (likely non-H2 or no table yet): {}",
                    e.getMessage());
        }
    }

    /**
     * Return every CHECK constraint name that references the given column on
     * the given table. Works on H2 — uses {@code INFORMATION_SCHEMA.CHECK_CONSTRAINTS}
     * joined with {@code INFORMATION_SCHEMA.CONSTRAINTS} to filter by table.
     * Constraint names are uppercase (H2 default).
     */
    private List<String> findCheckConstraints(Connection conn, String table, String column) throws Exception {
        List<String> names = new ArrayList<>();
        // H2 v2 stores CHECK constraint definitions in INFORMATION_SCHEMA.CHECK_CONSTRAINTS.
        // The CHECK_CLAUSE text contains the column name when the check was emitted
        // for an enum column. We filter by table via TABLE_CONSTRAINTS.
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
