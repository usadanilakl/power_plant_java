package com.dk_power.power_plant_java.dto.rounds;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/** A single trended question over time — chart-ready. */
@Getter
@Setter
@NoArgsConstructor
public class TrendSeriesDto {
    /** Ordinal-stripped question key (stable id). */
    private String key;
    private String label;
    private String unit;
    private String category;
    private List<TrendPointDto> points = new ArrayList<>();
}
