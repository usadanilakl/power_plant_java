package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.dto.schedule.PatternCell;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    /**
     * Relief "swap with next in line" simulation. Starting from {@code initialSlots} (a
     * {@code slot -> userId} map where one slot is {@code "REL"}), advance {@code periods} turns: each
     * turn the relief person swaps places with the next person in {@code lineOrder} — the incoming
     * relief leaves their crew slot, the outgoing relief takes it. Returns the resulting
     * {@code userId -> slot}. Pure + deterministic (no dates), so the swap is unit-testable.
     */
    public static Map<Long, String> reliefSlots(List<Long> lineOrder, Map<String, Long> initialSlots, int periods) {
        Map<Long, String> state = new HashMap<>();
        if (initialSlots != null) {
            for (Map.Entry<String, Long> e : initialSlots.entrySet()) {
                if (e.getValue() != null) state.put(e.getValue(), e.getKey());
            }
        }
        Long relief = initialSlots == null ? null : initialSlots.get("REL");
        if (relief == null || lineOrder == null || lineOrder.isEmpty() || periods <= 0) return state;
        int startIdx = lineOrder.indexOf(relief);
        if (startIdx < 0) return state;
        for (int k = 1; k <= periods; k++) {
            Long pNew = lineOrder.get(Math.floorMod(startIdx + k, lineOrder.size()));
            String vacated = state.get(pNew);
            if (vacated == null) continue;   // pNew not tracked — leave state unchanged defensively
            state.put(relief, vacated);
            state.put(pNew, "REL");
            relief = pNew;
        }
        return state;
    }
}
