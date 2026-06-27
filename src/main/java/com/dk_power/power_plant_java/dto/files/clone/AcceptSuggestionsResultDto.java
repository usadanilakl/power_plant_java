package com.dk_power.power_plant_java.dto.files.clone;

import java.util.List;

/**
 * Result of accepting clone-time LOTO suggestions: how many new points were saved
 * and how many counterpart links were established. {@code errors} lists per-item
 * failures (by source tag) so a partial accept can still report what succeeded.
 */
public record AcceptSuggestionsResultDto(
    int created,
    int linkedCounterparts,
    List<String> errors
) {}
