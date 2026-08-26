package com.dk_power.power_plant_java.dto.pwa.finder;

import java.util.List;

/**
 * One filter box from the Equipment Finder: a bucket of words plus how to combine them.
 *
 * <p>{@code mode} is {@code "AND"} (every word must appear) or {@code "OR"} (any word will do);
 * anything else, including null, is treated as OR — the forgiving default for a search box. Each word
 * matches as a case-insensitive substring, so "pmp" finds nothing but "pump" finds "FEEDWATER PUMP".</p>
 *
 * <p>A filter with no usable words is ignored entirely rather than matching everything.</p>
 */
public record FinderFilterDto(
        List<String> terms,
        String mode
) {
    public boolean isAndMode() {
        return "AND".equalsIgnoreCase(mode);
    }
}
