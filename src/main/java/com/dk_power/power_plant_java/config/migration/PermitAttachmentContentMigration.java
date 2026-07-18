package com.dk_power.power_plant_java.config.migration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Idempotent migration that moves {@code PermitAttachment} inline base64 into the out-of-row
 * {@code permit_attachment_content} table, then NULLs the legacy column so H2 stops rewriting the
 * whole ~1.3&nbsp;MB row on every sync-flag update. Runs on EVERY node at startup (each node owns
 * its local H2). Safe to leave in permanently — after a full pass the guard early-returns.
 *
 * <p>Order is deliberate and is the safety contract: <b>backfill → VERIFY every live row was
 * copied → only then clear the parent bytes</b>. If verification fails we do NOT clear, and
 * {@link com.dk_power.power_plant_java.entities.permits.PermitAttachment#getBase64Content()} keeps
 * serving from the legacy column (fallback), so a partial copy can never surface as an empty
 * attachment. Uses raw JDBC (not entity loads) so it never pulls hundreds of MB of blobs into heap.
 *
 * <p>Tombstoned rows ({@code deleted = TRUE}) are intentionally excluded — copying them would
 * resurrect deleted content; they are reclaimed by {@code purgeTombstonesOlderThan} instead.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PermitAttachmentContentMigration implements ApplicationRunner {

    private final JdbcTemplate jdbc;

    @Override
    public void run(ApplicationArguments args) {
        try {
            Long pending = jdbc.queryForObject(
                "SELECT COUNT(*) FROM permit_attachment WHERE base64content IS NOT NULL AND deleted = FALSE",
                Long.class);
            if (pending == null || pending == 0) return; // already migrated / nothing stored inline

            log.info("[AttachmentMigration] {} inline attachment(s) to move out of row", pending);

            int copied = jdbc.update(
                "INSERT INTO permit_attachment_content (id, base64content) " +
                "SELECT id, base64content FROM permit_attachment " +
                "WHERE deleted = FALSE AND base64content IS NOT NULL " +
                "AND id NOT IN (SELECT id FROM permit_attachment_content)");

            Long missing = jdbc.queryForObject(
                "SELECT COUNT(*) FROM permit_attachment a WHERE a.deleted = FALSE AND a.base64content IS NOT NULL " +
                "AND NOT EXISTS (SELECT 1 FROM permit_attachment_content c WHERE c.id = a.id)",
                Long.class);
            if (missing != null && missing > 0) {
                log.error("[AttachmentMigration] backfill INCOMPLETE: {} live row(s) missing content — NOT clearing "
                    + "legacy column; the fallback getter keeps serving legacy bytes. Will retry next startup.", missing);
                return;
            }

            int cleared = jdbc.update(
                "UPDATE permit_attachment SET base64content = NULL " +
                "WHERE base64content IS NOT NULL AND id IN (SELECT id FROM permit_attachment_content)");

            log.info("[AttachmentMigration] done: copied={} cleared={}. Run scripts/database/compact-database.bat "
                + "to reclaim the freed space.", copied, cleared);
        } catch (Exception e) {
            log.error("[AttachmentMigration] failed (will retry next startup): {}", e.getMessage(), e);
        }
    }
}
