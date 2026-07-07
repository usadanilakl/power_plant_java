package com.dk_power.power_plant_java.dto.rounds;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One available trend series for the picker (no point data). */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TrendSeriesMetaDto {
    private String key;
    private String label;
    private String category;
    private String unit;
    /** How many shift readings are stored for this question. */
    private long points;
    /** ISO timestamp of the most recent reading. */
    private String lastReading;
}
