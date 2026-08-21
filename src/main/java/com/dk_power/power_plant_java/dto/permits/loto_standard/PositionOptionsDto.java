package com.dk_power.power_plant_java.dto.permits.loto_standard;

import com.dk_power.power_plant_java.dto.categories.ValueDto;

import java.util.List;

/**
 * Value options for in-field corrections and walkdown-pile filters. Mirrors the desktop
 * 'isoPos' / 'normPos' / 'location' / 'eqType' Value categories — the mobile walker can
 * override a point's isolation/restored position or its Location/EqType Values, and the
 * points-pile picker uses these lists to build multi-select filter dropdowns.
 */
public record PositionOptionsDto(List<ValueDto> isoPos, List<ValueDto> normPos,
                                 List<ValueDto> location, List<ValueDto> eqType) {}
