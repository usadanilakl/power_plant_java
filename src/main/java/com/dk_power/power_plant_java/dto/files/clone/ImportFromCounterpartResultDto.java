package com.dk_power.power_plant_java.dto.files.clone;

import java.util.List;

/**
 * Result of importing equipment + LOTO from a linked counterpart file.
 * Mirrors {@link CloneFileResultDto} but specialized for the "target already
 * exists" path:
 * <ul>
 *   <li>{@code deletedExistingCount} — equipment soft-deleted before import
 *       (zero when caller chose keepExisting=true)</li>
 *   <li>{@code summary} / {@code suggestions} — same as the clone flow</li>
 * </ul>
 */
public record ImportFromCounterpartResultDto(
    String status,
    Long targetFileId,
    Long sourceFileId,
    int deletedExistingCount,
    String sourceUnit,
    String targetUnit,
    CloneSummaryDto summary,
    List<LotoSuggestionDto> suggestions,
    String error
) {}
