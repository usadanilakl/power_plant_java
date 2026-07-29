package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.dto.schedule.PatternCell;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The rotation math is the load-bearing part of schedule v2 — every materialised day depends on it
 * landing the right person on the right shift. These tests pin the two guarantees that matter:
 * the cycle index is stable + wraps correctly, and the role × day grid lets LEAD and AO rotate
 * between shift and relief independently within one crew.
 */
@DisplayName("SchedulePatternMath rotation")
class SchedulePatternMathTest {

    /** Example crew: cycle 8, LEAD = D D N N O O D D, AO differs at day 5 (R vs O). */
    private static List<PatternCell> exampleGrid() {
        return List.of(
                cell(0, "LEAD", "D"), cell(1, "LEAD", "D"), cell(2, "LEAD", "N"), cell(3, "LEAD", "N"),
                cell(4, "LEAD", "O"), cell(5, "LEAD", "O"), cell(6, "LEAD", "D"), cell(7, "LEAD", "D"),
                cell(0, "AO", "D"), cell(1, "AO", "D"), cell(2, "AO", "N"), cell(3, "AO", "N"),
                cell(4, "AO", "O"), cell(5, "AO", "R"), cell(6, "AO", "D"), cell(7, "AO", "D"));
    }

    private static PatternCell cell(int dayIndex, String role, String shift) {
        return PatternCell.builder().dayIndex(dayIndex).role(role).shift(shift).build();
    }

    @Test
    @DisplayName("cycleDay is 0-based, wraps at cycle length, and is anchored to the epoch day")
    void cycleDayWrapsAndIsStable() {
        assertThat(SchedulePatternMath.cycleDay(0, 0, 8)).isZero();
        assertThat(SchedulePatternMath.cycleDay(7, 0, 8)).isEqualTo(7);
        assertThat(SchedulePatternMath.cycleDay(8, 0, 8)).isZero();        // wraps
        assertThat(SchedulePatternMath.cycleDay(9, 0, 8)).isEqualTo(1);

        // Advancing exactly one cycle returns the same index (stable rotation).
        long e = LocalDate.of(2026, 7, 29).toEpochDay();
        assertThat(SchedulePatternMath.cycleDay(e, 0, 28))
                .isEqualTo(SchedulePatternMath.cycleDay(e + 28, 0, 28));
    }

    @Test
    @DisplayName("patternOffsetDays phases the rotation, incl. negative via floorMod")
    void offsetPhasesTheCycle() {
        assertThat(SchedulePatternMath.cycleDay(0, 4, 8)).isEqualTo(4);
        assertThat(SchedulePatternMath.cycleDay(0, -1, 8)).isEqualTo(7);   // floorMod, not %
        // Two crews on the same date, 4 apart, are 4 apart in the cycle.
        long e = LocalDate.of(2026, 7, 29).toEpochDay();
        int crewA = SchedulePatternMath.cycleDay(e, 0, 8);
        int crewB = SchedulePatternMath.cycleDay(e, 4, 8);
        assertThat(Math.floorMod(crewB - crewA, 8)).isEqualTo(4);
    }

    @Test
    @DisplayName("non-positive cycle length degrades to index 0 rather than dividing by zero")
    void zeroLengthIsSafe() {
        assertThat(SchedulePatternMath.cycleDay(123, 5, 0)).isZero();
        assertThat(SchedulePatternMath.cycleDay(123, 5, -3)).isZero();
    }

    @Test
    @DisplayName("shiftFor resolves per (cycleDay, role) so LEAD and AO can differ on the same day")
    void shiftForIsRoleAware() {
        List<PatternCell> grid = exampleGrid();
        assertThat(SchedulePatternMath.shiftFor(grid, 2, "LEAD")).isEqualTo("N");
        assertThat(SchedulePatternMath.shiftFor(grid, 0, "LEAD")).isEqualTo("D");
        // Day 5: LEAD is off, AO is on relief — the whole point of the role × day grid.
        assertThat(SchedulePatternMath.shiftFor(grid, 5, "LEAD")).isEqualTo("O");
        assertThat(SchedulePatternMath.shiftFor(grid, 5, "AO")).isEqualTo("R");
    }

    @Test
    @DisplayName("shiftFor returns null for absent cells, unknown roles, and null input")
    void shiftForMisses() {
        List<PatternCell> grid = exampleGrid();
        assertThat(SchedulePatternMath.shiftFor(grid, 99, "LEAD")).isNull();
        assertThat(SchedulePatternMath.shiftFor(grid, 0, "RELIEF")).isNull();
        assertThat(SchedulePatternMath.shiftFor(null, 0, "LEAD")).isNull();
        assertThat(SchedulePatternMath.shiftFor(grid, 0, null)).isNull();
    }
}
