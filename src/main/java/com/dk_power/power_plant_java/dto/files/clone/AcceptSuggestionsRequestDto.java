package com.dk_power.power_plant_java.dto.files.clone;

import java.util.List;

/**
 * Request payload for {@code POST /ng/file/clone-suggestions/accept}.
 * The frontend posts the subset of suggestions the user accepted (after any edits).
 */
public record AcceptSuggestionsRequestDto(
    List<AcceptedSuggestionItemDto> items
) {}
