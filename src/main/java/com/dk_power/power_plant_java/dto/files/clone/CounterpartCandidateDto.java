package com.dk_power.power_plant_java.dto.files.clone;

/**
 * One candidate counterpart file for the "Set Counterpart File…" picker.
 * Suggestions returned by {@code NgFileCloneService.findCounterpartCandidates},
 * ranked by {@link #score} descending.
 *
 * <p>{@link #matchReason} is the human-readable rationale ("Tag-swap U1↔U2",
 * "1-letter difference: A↔B", "Same type/vendor") so the UI can show why each
 * row was suggested.
 */
public record CounterpartCandidateDto(
    Long id,
    String fileNumber,
    String name,
    String fileTypeName,
    String vendorName,
    int score,
    String matchReason
) {}
