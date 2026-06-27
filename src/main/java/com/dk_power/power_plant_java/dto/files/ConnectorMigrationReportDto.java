package com.dk_power.power_plant_java.dto.files;

import java.util.List;

/**
 * Result of the Equipment-→-FileConnector migration. Returned by the
 * {@code /migrate-from-equipment} endpoint so the operator can audit what
 * was converted, what was skipped, and why.
 *
 * <p>{@code items} holds the per-Equipment action log — necessary for
 * codex-flagged durability ("if we soft-delete the Equipment we need a
 * mapping back"). Each item names the source Equipment id + tagNumber + the
 * action taken, so re-running the migration with the same data produces
 * the same report and an operator can grep for failed cases.
 */
public record ConnectorMigrationReportDto(
    boolean dryRun,
    int totalConnectorEquipment,
    int migrated,
    int skippedShortTag,
    int skippedHasData,
    int skippedNoSourceFile,
    int skippedNoMatch,
    int skippedAmbiguous,
    int skippedAlreadyMigrated,
    int paired,
    int unpairedMultipleCandidates,
    List<ConnectorMigrationItemDto> items
) {}
