package com.dk_power.power_plant_java.dto.schedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Per-day open-seat counts by shift — the data behind the coverage chips (blue = night, green =
 * day, number = open seats) on the Day/Month/Year views. Only days with at least one required seat
 * are emitted.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoverageSeatSummaryDto {
    private LocalDate date;
    private int dayRequired;
    private int dayOpen;
    private int nightRequired;
    private int nightOpen;
}
