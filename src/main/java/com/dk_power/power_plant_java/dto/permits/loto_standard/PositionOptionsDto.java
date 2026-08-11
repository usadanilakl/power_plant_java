package com.dk_power.power_plant_java.dto.permits.loto_standard;

import com.dk_power.power_plant_java.dto.categories.ValueDto;

import java.util.List;

/**
 * Value options for in-field corrections. Mirrors the desktop 'isoPos' / 'normPos' / 'location'
 * Value categories — the mobile walker can override a point's isolation position, restored
 * position, or location Value straight from the checklist.
 */
public record PositionOptionsDto(List<ValueDto> isoPos, List<ValueDto> normPos, List<ValueDto> location) {}
