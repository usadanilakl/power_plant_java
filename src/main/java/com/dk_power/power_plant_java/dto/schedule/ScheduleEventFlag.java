package com.dk_power.power_plant_java.dto.schedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A compact, render-ready projection of a {@link com.dk_power.power_plant_java.entities.schedule.ScheduleEvent}
 * folded into a day. Serialized as the JSON array stored in {@code ShiftDay.eventFlagsJson} and
 * surfaced on {@code ShiftDayDto.eventFlags} for the Day/Month/Year consumer views.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleEventFlag {
    /** One of {@code ScheduleEvent.Type} — drives the icon/colour default on consumers. */
    private String eventType;
    private String title;
    /** Hex colour (event override or per-type default resolved at materialisation). */
    private String color;
    /** DAY | NIGHT | BOTH | null. */
    private String appliesToShift;
}
