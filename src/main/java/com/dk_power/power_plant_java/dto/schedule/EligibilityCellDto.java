package com.dk_power.power_plant_java.dto.schedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Per-person, per-day open-seat counts the operator is off + qualified to cover, split by shift —
 * drives the schedule-grid marker (green day count / blue night count / half-and-half when both).
 * {@code day}/{@code night} are the number of remaining open seats across the needs this person's
 * position can cover on that shift (Lead covers Lead+CRO+AO, CRO covers CRO+AO, AO covers AO;
 * non-ops cover their own discipline).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EligibilityCellDto {
    private String date;   // YYYY-MM-DD
    private Long userId;
    private int day;
    private int night;
}
