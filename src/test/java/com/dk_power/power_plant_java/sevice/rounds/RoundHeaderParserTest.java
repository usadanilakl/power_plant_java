package com.dk_power.power_plant_java.sevice.rounds;

import com.dk_power.power_plant_java.entities.rounds.RoundAnswerType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** Validates the single-line WebView header heuristic against real column headers from the plant. */
class RoundHeaderParserTest {

    private final RoundHeaderParser parser = new RoundHeaderParser();

    @Test
    void tagAndRange() {
        var p = parser.parse("ACC MCC (01-ACC-MCC) Building Temperature (65-85 F) (3)");
        assertEquals("ACC MCC", p.getCategory());
        assertEquals("01-ACC-MCC", p.getTagCode());
        assertEquals("Building Temperature", p.getPrompt());
        assertEquals(65.0, p.getLowLimit());
        assertEquals(85.0, p.getHighLimit());
        assertEquals("F", p.getUnit());
        assertEquals(RoundAnswerType.READING, p.getSuggestedType());
    }

    @Test
    void tagNoRange() {
        var p = parser.parse("AIR COMPRESSOR 1A (00-INA-CMP-01A) AIR COMPRESSOR STATUS");
        assertEquals("AIR COMPRESSOR 1A", p.getCategory());
        assertEquals("00-INA-CMP-01A", p.getTagCode());
        assertEquals("AIR COMPRESSOR STATUS", p.getPrompt());
        assertNull(p.getLowLimit());
    }

    @Test
    void noTagLeadingCapsCategory() {
        var p = parser.parse("AMMONIA Pump Disch Press. (80-100 PSI)");
        assertEquals("AMMONIA", p.getCategory());
        assertEquals("Pump Disch Press.", p.getPrompt());
        assertEquals(80.0, p.getLowLimit());
        assertEquals(100.0, p.getHighLimit());
        assertEquals("PSI", p.getUnit());
        assertEquals(RoundAnswerType.READING, p.getSuggestedType());
    }

    @Test
    void noTagNoRange() {
        var p = parser.parse("ACC Abnormal Conditions/Leaks");
        assertEquals("ACC", p.getCategory());
        assertEquals("Abnormal Conditions/Leaks", p.getPrompt());
        assertEquals(RoundAnswerType.TEXT, p.getSuggestedType());
    }

    @Test
    void selector() {
        var p = parser.parse("ANSWER FIRST Which Shift");
        assertEquals("ANSWER FIRST", p.getCategory());
        assertEquals("Which Shift", p.getPrompt());
        assertEquals(RoundAnswerType.SELECTOR, p.getSuggestedType());
    }

    @Test
    void multiWordCategoryNoTag() {
        var p = parser.parse("AUXILIARY BOILER Check Local PLC/Alarms");
        assertEquals("AUXILIARY BOILER", p.getCategory());
        assertEquals("Check Local PLC/Alarms", p.getPrompt());
    }

    @Test
    void tankLevel() {
        var p = parser.parse("AMMONIA Ammonia Tank Level SG North");
        assertEquals("AMMONIA", p.getCategory());
        assertEquals("Ammonia Tank Level SG North", p.getPrompt());
    }

    @Test
    void trailingChoiceParensAreNotRange() {
        var p = parser.parse("2C/ECA Cooler Cooling water system GT 2C/ECA cooler cooling water recirc pump running (A) or (B)");
        assertEquals("2C/ECA", p.getCategory());
        assertTrue(p.getPrompt().startsWith("Cooler Cooling water"));
        assertNull(p.getLowLimit());
        assertNull(p.getHighLimit());
    }

    @Test
    void questionKeyStripsOrdinal() {
        var p = parser.parse("ACC MCC (01-ACC-MCC) Building Temperature (65-85 F) (3)");
        assertEquals("ACC MCC (01-ACC-MCC) Building Temperature (65-85 F)", p.getQuestionKey());
    }
}
