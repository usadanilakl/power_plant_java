package com.dk_power.power_plant_java.dto.pwa.finder;

/**
 * Equipment Finder query. Every filter is independent and optional; the ones that carry words are
 * combined with AND (an item must satisfy all of them), while the words INSIDE a filter combine by
 * that filter's own AND/OR mode.
 *
 * <p>Filters map onto the same five fields for both LOTO points and equipment, which is what lets one
 * query search both. {@code location} additionally matches a LOTO point's free-text
 * {@code generalLocation}, because the plant records a location in either place depending on the
 * vintage of the row.</p>
 */
public record FinderRequestDto(
        FinderFilterDto location,
        FinderFilterDto eqType,
        FinderFilterDto specificLocation,
        FinderFilterDto tagNumber,
        FinderFilterDto description,
        Integer limit
) {}
