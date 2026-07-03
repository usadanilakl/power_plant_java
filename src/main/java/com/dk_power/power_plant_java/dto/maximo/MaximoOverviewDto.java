package com.dk_power.power_plant_java.dto.maximo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * The Electron "Maximo overview" widget payload for a configured set of people (leads, or a
 * hand-picked personid list): the tracked people's work orders bucketed by due status relative to
 * the current ISO week (Mon–Sun) — overdue / due this week / upcoming — plus what they completed
 * this week. Bucketing is done server-side (one clock) so every desktop agrees.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaximoOverviewDto {
    private String mode;              // "leads" or "people" (which pool was tracked)
    private String asOf;              // yyyy-MM-dd — the server date the buckets were computed for
    private String weekStart;         // yyyy-MM-dd — Monday of the current ISO week
    private String weekEnd;           // yyyy-MM-dd — Sunday of the current ISO week
    private int personCount;          // how many personids were tracked

    private List<MaximoWorkOrderDto> overdue;            // open, target start before today
    private List<MaximoWorkOrderDto> dueThisWeek;        // open, target start today..Sunday
    private List<MaximoWorkOrderDto> completedThisWeek;  // COMP with statusdate in the current ISO week
    private List<MaximoWorkOrderDto> completedLastWeek;  // COMP with statusdate in the previous ISO week
    private List<MaximoWorkOrderDto> upcoming;           // open, target start after Sunday or no target date
}
