package com.dk_power.power_plant_java.dto.permits.loto_standard;

import com.dk_power.power_plant_java.dto.categories.ValueDto;

import java.util.List;

/** Position Value options for in-field corrections — mirrors the desktop 'isoPos' / 'normPos' categories. */
public record PositionOptionsDto(List<ValueDto> isoPos, List<ValueDto> normPos) {}
