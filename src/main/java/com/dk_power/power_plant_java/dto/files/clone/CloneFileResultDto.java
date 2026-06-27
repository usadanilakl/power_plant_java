package com.dk_power.power_plant_java.dto.files.clone;

import java.util.List;

/**
 * Result of {@code NgFileCloneService.cloneToUnit}.
 *
 * <p>Status values:
 * <ul>
 *   <li><b>created</b>  — clone succeeded; {@code newFileId} populated.</li>
 *   <li><b>exists</b>   — at least one prior clone of {@code sourceFileId} found;
 *       {@code existingCloneIds} populated. Caller can re-POST with {@code force=true}
 *       to create another.</li>
 *   <li><b>error</b>    — clone aborted; {@code error} explains why
 *       (source not found / unit not detectable / disk-copy failed / etc.).</li>
 * </ul>
 *
 * <p>{@code suggestions} is the list of LOTO points the user must accept or skip
 * individually — see {@link LotoSuggestionDto}. Empty list when every source
 * point had a real DB counterpart (or no unit-specific tag).
 */
public record CloneFileResultDto(
    String status,
    Long sourceFileId,
    Long newFileId,
    List<Long> existingCloneIds,
    String sourceUnit,
    String targetUnit,
    CloneSummaryDto summary,
    List<LotoSuggestionDto> suggestions,
    String error
) {}
