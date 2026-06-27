package com.dk_power.power_plant_java.dto.files.clone;

import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;

/**
 * Single item in the {@link AcceptSuggestionsRequestDto} list — represents a
 * suggested counterpart the user accepted (optionally after editing the
 * transformed payload). Backend will save {@code lotoPoint} as a new LotoPoint,
 * link it to {@code newEquipmentId} via the eq_loto_point join, and set the
 * bidirectional {@code counterpartId} between the new and source points.
 */
public record AcceptedSuggestionItemDto(
    Long newEquipmentId,
    Long sourceLotoPointId,
    LotoPointDto lotoPoint
) {}
