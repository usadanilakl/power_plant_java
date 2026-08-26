package com.dk_power.power_plant_java.dto.pwa.finder;

import java.util.List;

/**
 * Equipment Finder response. Counts are of the FULL match set, so the UI can say "showing 200 of 640"
 * instead of silently handing back a truncated list.
 */
public record FinderResultDto(
        List<FinderItemDto> items,
        long lotoPointMatches,
        long equipmentMatches,
        boolean truncated
) {}
