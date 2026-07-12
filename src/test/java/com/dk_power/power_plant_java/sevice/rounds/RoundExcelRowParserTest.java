package com.dk_power.power_plant_java.sevice.rounds;

import com.dk_power.power_plant_java.entities.rounds.RoundAnswerType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** Validates the Excel-row heuristic against real rows from the exported rounds workbooks. */
class RoundExcelRowParserTest {

    private final RoundExcelRowParser parser = new RoundExcelRowParser();

    @Test
    void readingWithBothAlarmLimits() {
        var p = parser.parse("SERVICE WATER", "Tank Heater Temp (40-100 F)", "73 Deg F", "HI: > 100 Deg F\nLO: < 40 Deg F");
        assertEquals("SERVICE WATER", p.getCategory());
        assertNull(p.getTagCode());
        assertEquals(RoundAnswerType.READING, p.getSuggestedType());
        assertEquals(40.0, p.getLowLimit());
        assertEquals(100.0, p.getHighLimit());
        assertEquals("Deg F", p.getUnit());
    }

    @Test
    void categoryTagSplit() {
        var p = parser.parse("AIR COMPRESSOR 1A (00-INA-CMP-01A)", "AIR COMPRESSOR STATUS", "LEAD", "");
        // "1A" instance token is in the tag → coalesced to the area, so 1A/1B group together
        assertEquals("AIR COMPRESSOR", p.getCategory());
        assertEquals("00-INA-CMP-01A", p.getTagCode());
    }

    @Test
    void passFailFromAlarmNotEqual() {
        var p = parser.parse("DEMINERALIZED WATER", "RO \"A\" has no alarms and in auto.", "Yes", "HI: <> Yes ");
        assertEquals(RoundAnswerType.PASS_FAIL, p.getSuggestedType());
        assertEquals("Yes", p.getExpectedValue());
    }

    @Test
    void passFailFromAlarmEqualsUsesSampleAsPass() {
        var p = parser.parse("AMMONIA", "Abnormal Conditions/Leaks", "Sat", "HI: = Unsat ");
        assertEquals(RoundAnswerType.PASS_FAIL, p.getSuggestedType());
        assertEquals("Sat", p.getExpectedValue()); // abnormal = Unsat → pass = the normal sample (Sat)
    }

    @Test
    void lowOnlyAlarm() {
        var p = parser.parse("AMMONIA", "Ammonia Tank Level SG North", "89", "LO: < 40 ");
        assertEquals(RoundAnswerType.READING, p.getSuggestedType());
        assertEquals(40.0, p.getLowLimit());
        assertNull(p.getHighLimit());
    }

    @Test
    void chemTankLowThresholdWrittenAsHi() {
        var p = parser.parse("DEMINERALIZED WATER", "Chem Tank Level - Caustic", "20 %", "HI: < 25 %");
        assertEquals(RoundAnswerType.READING, p.getSuggestedType());
        assertEquals(25.0, p.getLowLimit());   // operator is '<' → low threshold, regardless of the HI: label
        assertEquals("%", p.getUnit());
    }

    @Test
    void labelRangeFallbackWhenNoAlarm() {
        var p = parser.parse("DEMINERALIZED WATER", "Bag Filter DP A (<10)", "3.4 PSI", "");
        assertEquals(RoundAnswerType.READING, p.getSuggestedType());
        assertEquals(10.0, p.getHighLimit());
        assertEquals("Bag Filter DP A", p.getPrompt());
        assertEquals("PSI", p.getUnit()); // from the sample value
    }

    @Test
    void selector() {
        var p = parser.parse("ANSWER FIRST", "Which Shift", "Day", "");
        assertEquals(RoundAnswerType.SELECTOR, p.getSuggestedType());
    }

    @Test
    void numericSampleNoAlarmIsReading() {
        var p = parser.parse("Service Water", "Service water level", "33.1", "");
        assertEquals(RoundAnswerType.READING, p.getSuggestedType());
    }

    @Test
    void freeTextWhenNoSignals() {
        var p = parser.parse("UNIT 1", "U1 Status?", "Unit online;", "");
        // ends with '?' → PASS_FAIL by convention
        assertEquals(RoundAnswerType.PASS_FAIL, p.getSuggestedType());
    }

    @Test
    void acheFansCoalesceToOneArea() {
        var a = parser.parse("AIR COOLED HEAT EXCHANGER FAN 01A (01-CCW-FAN-01A)", "Fan condition", "Sat", "");
        var b = parser.parse("AIR COOLED HEAT EXCHANGER FAN 02C (01-CCW-FAN-02C)", "Fan condition", "Sat", "");
        assertEquals("AIR COOLED HEAT EXCHANGER FAN", a.getCategory());
        assertEquals("AIR COOLED HEAT EXCHANGER FAN", b.getCategory());
        assertEquals("01-CCW-FAN-01A", a.getTagCode());   // each still keeps its own tag
        assertEquals("01-CCW-FAN-02C", b.getTagCode());
    }

    @Test
    void areaNotStrippedWhenTokenNotInTag() {
        var p = parser.parse("SERVICE WATER", "Pump Oil Level", "Sat", "HI: = Unsat ");
        assertEquals("SERVICE WATER", p.getCategory());
    }

    @Test
    void mbhStyleTag() {
        var p = parser.parse("GT TCA COOLER 01MBH05AC301 (01MBH05AC301)", "Abnormal Conditions/Leaks", "Sat", "HI: = Unsat ");
        assertEquals("01MBH05AC301", p.getTagCode());
        assertEquals("GT TCA COOLER 01MBH05AC301", p.getCategory());
    }
}
