package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.dto.schedule.PatternCell;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Crew-level rotation math: the cycle index must be stable + wrap correctly, and a rotation resolves
 * one shift per cycle day for the whole crew (no role dimension).
 */
@DisplayName("SchedulePatternMath rotation")
class SchedulePatternMathTest {

    /** Example crew rotation, cycle 8: D D N N O O D D. */
    private static List<PatternCell> cycle() {
        return List.of(
                cell(0, "D"), cell(1, "D"), cell(2, "N"), cell(3, "N"),
                cell(4, "O"), cell(5, "O"), cell(6, "D"), cell(7, "D"));
    }

    private static PatternCell cell(int dayIndex, String shift) {
        return PatternCell.builder().dayIndex(dayIndex).shift(shift).build();
    }

    @Test
    @DisplayName("cycleDay is 0-based, wraps at cycle length, and is anchored to the epoch day")
    void cycleDayWrapsAndIsStable() {
        assertThat(SchedulePatternMath.cycleDay(0, 0, 8)).isZero();
        assertThat(SchedulePatternMath.cycleDay(7, 0, 8)).isEqualTo(7);
        assertThat(SchedulePatternMath.cycleDay(8, 0, 8)).isZero();
        assertThat(SchedulePatternMath.cycleDay(9, 0, 8)).isEqualTo(1);

        long e = LocalDate.of(2026, 7, 29).toEpochDay();
        assertThat(SchedulePatternMath.cycleDay(e, 0, 28))
                .isEqualTo(SchedulePatternMath.cycleDay(e + 28, 0, 28));
    }

    @Test
    @DisplayName("offsetDays phases the rotation, incl. negative via floorMod")
    void offsetPhasesTheCycle() {
        assertThat(SchedulePatternMath.cycleDay(0, 4, 8)).isEqualTo(4);
        assertThat(SchedulePatternMath.cycleDay(0, -1, 8)).isEqualTo(7);
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
    @DisplayName("shiftFor resolves the crew's single shift for a cycle day")
    void shiftForResolvesCrewShift() {
        List<PatternCell> c = cycle();
        assertThat(SchedulePatternMath.shiftFor(c, 0)).isEqualTo("D");
        assertThat(SchedulePatternMath.shiftFor(c, 2)).isEqualTo("N");
        assertThat(SchedulePatternMath.shiftFor(c, 4)).isEqualTo("O");
    }

    @Test
    @DisplayName("shiftFor returns null for absent cells and null input")
    void shiftForMisses() {
        assertThat(SchedulePatternMath.shiftFor(cycle(), 99)).isNull();
        assertThat(SchedulePatternMath.shiftFor(null, 0)).isNull();
    }
}
