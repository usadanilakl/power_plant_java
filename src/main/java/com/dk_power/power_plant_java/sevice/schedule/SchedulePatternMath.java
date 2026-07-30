package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.dto.schedule.PatternCell;

import java.util.List;

/**
 * Pure rotation math for schedule v2 — no Spring, no persistence, so it is trivially unit-testable.
 *
 * <p>The rotation is anchored to the absolute epoch day (not a crew's start date) so the cycle
 * position for a given calendar date is stable no matter when a crew/assignment is created or
 * edited. A crew's {@code offsetDays} phases it into the cycle. Rotation is crew-level: one shift
 * per cycle day for the whole crew (no role dimension).
 */
public final class SchedulePatternMath {

    private SchedulePatternMath() {}

    /**
     * The 0-based cycle-day index for a calendar date.
     *
     * @param epochDay    {@code LocalDate.toEpochDay()} of the target date
     * @param offsetDays  the crew's {@code offsetDays} (phases into the cycle)
     * @param lengthDays  the rotation's cycle length
     * @return index in {@code [0, lengthDays)}, or 0 when {@code lengthDays <= 0}
     */
    public static int cycleDay(long epochDay, int offsetDays, int lengthDays) {
        if (lengthDays <= 0) return 0;
        return (int) Math.floorMod(epochDay + offsetDays, (long) lengthDays);
    }

    /** The shift code for a cycle day in a rotation's cells, or {@code null} if no cell matches. */
    public static String shiftFor(List<PatternCell> cells, int cycleDay) {
        if (cells == null) return null;
        for (PatternCell c : cells) {
            if (c != null && c.getDayIndex() != null && c.getDayIndex() == cycleDay) {
                return c.getShift();
            }
        }
        return null;
    }
}
