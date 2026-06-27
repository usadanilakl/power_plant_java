package com.dk_power.power_plant_java.dto.files;

import java.util.List;

/**
 * Per-Equipment record in the connector migration report — durable mapping
 * from the old Equipment row to either the new FileConnector (on success)
 * or the reason the migration declined to act (on skip).
 *
 * <p>{@code action} values:
 * <ul>
 *   <li>{@code MIGRATED} — converted to FileConnector; {@code newConnectorId} set.</li>
 *   <li>{@code SKIP_SHORT_TAG} — tagNumber shorter than minTagLength.</li>
 *   <li>{@code SKIP_HAS_DATA} — Equipment had attached lotoPoints/files,
 *       would lose data silently.</li>
 *   <li>{@code SKIP_NO_SOURCE_FILE} — Equipment.mainFile was null.</li>
 *   <li>{@code SKIP_NO_MATCH} — no FileObject matched the tagNumber substring.</li>
 *   <li>{@code SKIP_AMBIGUOUS} — multiple FileObject candidates;
 *       {@code candidateFileIds} populated for manual review.</li>
 *   <li>{@code SKIP_ALREADY_MIGRATED} — a FileConnector with the same source/target/coordinates
 *       already exists (idempotency — safe to re-run).</li>
 *   <li>{@code DRY_RUN} — would have migrated, but caller passed dryRun=true.</li>
 * </ul>
 */
public record ConnectorMigrationItemDto(
    Long equipmentId,
    String tagNumber,
    Long sourceFileId,
    String action,
    Long newConnectorId,
    List<Long> candidateFileIds,
    String note
) {}
