package com.dk_power.power_plant_java.dto.rounds;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One point on a trend series: an ISO shift timestamp and its numeric value. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TrendPointDto {
    /** ISO-8601 local date-time of the shift (x-axis value). */
    private String t;
    private double value;
    /** "Day" / "Night". */
    private String shift;
    /** Original cell text. */
    private String rawValue;
}
