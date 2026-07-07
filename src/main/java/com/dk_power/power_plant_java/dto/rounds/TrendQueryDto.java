package com.dk_power.power_plant_java.dto.rounds;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/** Request body for a trend-data query: which questions, over what window. */
@Getter
@Setter
@NoArgsConstructor
public class TrendQueryDto {
    /** Ordinal-stripped question keys to plot. */
    private List<String> keys = new ArrayList<>();
    /** ISO local date-time (inclusive). Null → wide default. */
    private String from;
    /** ISO local date-time (inclusive). Null → now. */
    private String to;
}
