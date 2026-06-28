package com.dk_power.power_plant_java.dto.files;

import java.util.List;

/**
 * Context payload returned to the loto-builder Edit dialog when the user
 * starts editing a legacy connector (Equipment with eqType.name='connector').
 * Carries everything the dialog needs to show "what we know" plus the
 * candidate target files the auto-migration matching logic would consider,
 * so the user can pick one with a single click rather than searching manually.
 *
 * <p>The fall-through is the regular file picker — if the candidates list is
 * empty or none match the user's intent, they can search the full file list
 * the same way they do when drawing a new connector.
 */
public record LegacyConnectorContextDto(
    Long equipmentId,
    String tagNumber,
    Long sourceFileId,
    String sourceFileNumber,
    String sourceFileName,
    /** Files whose fileNumber contains the equipment's tagNumber.
     *  Often just one or two — most legacy connectors point at exactly one P&ID. */
    List<CandidateFile> candidates,
    /** Why no auto-migration ran (short tag, no source file, etc.) — null when
     *  the candidate list is the actual reason (0 or N candidates). Lets the
     *  dialog show a hint like "tag too short to auto-match." */
    String skipReason
) {
    public record CandidateFile(
        Long id,
        String fileNumber,
        String name,
        String fileLink
    ) {}
}
