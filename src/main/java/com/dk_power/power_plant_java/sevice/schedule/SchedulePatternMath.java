package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.dto.schedule.PatternCell;

import java.util.List;

/**
 * Pure rotation math for schedule v2 — no Spring, no persistence, so it is trivially unit-testable.
 *
 * <p>The rotation is anchored to the absolute epoch day (not an assignment's start date) so the
 * cycle position for a given calendar date is stable no matter when an assignment is created or
 * edited. A {@code patternOffsetDays} value phases a person/crew into the cycle.
 */
public final class SchedulePatternMath {

    private SchedulePatternMath() {}

    /**
     * The 0-based cycle-day index for a calendar date.
     *
     * @param epochDay    {@code LocalDate.toEpochDay()} of the target date
     * @param offsetDays  the assignment's {@code patternOffsetDays} (phases into the cycle)
     * @param lengthDays  the crew pattern's cycle length
     * @return index in {@code [0, lengthDays)}, or 0 when {@code lengthDays <= 0}
     */
    public static int cycleDay(long epochDay, int offsetDays, int lengthDays) {
        if (lengthDays <= 0) return 0;
        return (int) Math.floorMod(epochDay + offsetDays, (long) lengthDays);
    }

    /**
     * The shift code for a (cycleDay, role) pair in a pattern grid, or {@code null} if the grid has
     * no cell for that pair. First match wins; a well-formed grid has at most one cell per pair.
     */
    public static String shiftFor(List<PatternCell> cells, int cycleDay, String role) {
        if (cells == null || role == null) return null;
        for (PatternCell c : cells) {
            if (c != null
                    && c.getDayIndex() != null && c.getDayIndex() == cycleDay
                    && role.equals(c.getRole())) {
                return c.getShift();
            }
        }
        return null;
    }
}
