package com.dk_power.power_plant_java.sevice.etapro;

import com.dk_power.power_plant_java.entities.etapro.EtaProReading;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pure unit tests for {@link EtaProScraperEngine#parseCsv(Path, String)}.
 * The parser has no injected dependencies, so we instantiate the engine with nulls.
 */
class EtaProScraperServiceCsvTest {

    private EtaProScraperEngine service;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        // Parser doesn't touch the injected services — null is safe.
        service = new EtaProScraperEngine(null, null, null);
    }

    // ── Flat format ─────────────────────────────────────────────────

    @Test
    void parsesFlatFormatCsv() throws Exception {
        Path csv = writeCsv("""
                PointId,Timestamp,Value,Quality
                1GT1.MW,2026-04-08T10:00:00,150.5,Good
                1GT1.MW,2026-04-08T10:01:00,151.2,Good
                1HRSG.PRESS,2026-04-08T10:00:00,1200.3,Good
                """);

        List<EtaProReading> result = service.parseCsv(csv, "session-1");

        assertThat(result).hasSize(3);
        assertThat(result.get(0).getPointId()).isEqualTo("1GT1.MW");
        assertThat(result.get(0).getReadingTime()).isEqualTo(LocalDateTime.of(2026, 4, 8, 10, 0, 0));
        assertThat(result.get(0).getReadingValue()).isEqualTo(150.5);
        assertThat(result.get(0).getQuality()).isEqualTo("Good");
        assertThat(result.get(0).getScrapeSessionId()).isEqualTo("session-1");

        assertThat(result.get(2).getPointId()).isEqualTo("1HRSG.PRESS");
        assertThat(result.get(2).getReadingValue()).isEqualTo(1200.3);
    }

    @Test
    void flatFormatHandlesMissingQualityColumn() throws Exception {
        // Only 3 columns — quality should default to "Good"
        // Note: parser requires 4 columns for flat-format detection, so this falls through to the fallback branch
        Path csv = writeCsv("""
                PointId,Timestamp,Value,Quality
                1GT1.MW,2026-04-08T10:00:00,150.5
                """);

        List<EtaProReading> result = service.parseCsv(csv, "session-1");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getQuality()).isEqualTo("Good");
    }

    // ── Pivot format ────────────────────────────────────────────────

    @Test
    void parsesPivotFormatCsv() throws Exception {
        Path csv = writeCsv("""
                Timestamp,1GT1.MW,1GT1.EXHAUST_TEMP,1HRSG.PRESS
                2026-04-08T10:00:00,150.5,1100.2,1200.3
                2026-04-08T10:01:00,151.2,1100.5,1200.8
                """);

        List<EtaProReading> result = service.parseCsv(csv, "session-2");

        // 2 rows × 3 points = 6 readings
        assertThat(result).hasSize(6);

        // Verify first row produced one reading per point
        assertThat(result).extracting(EtaProReading::getPointId)
                .containsExactly("1GT1.MW", "1GT1.EXHAUST_TEMP", "1HRSG.PRESS",
                                 "1GT1.MW", "1GT1.EXHAUST_TEMP", "1HRSG.PRESS");

        assertThat(result).extracting(EtaProReading::getReadingValue)
                .containsExactly(150.5, 1100.2, 1200.3, 151.2, 1100.5, 1200.8);

        // All should share the same session ID
        assertThat(result).allMatch(r -> "session-2".equals(r.getScrapeSessionId()));
    }

    @Test
    void pivotFormatWithTimeHeaderAlsoWorks() throws Exception {
        // Header "Time" instead of "Timestamp" — both should trigger pivot parsing
        Path csv = writeCsv("""
                Time,Point1,Point2
                2026-04-08T10:00:00,10.5,20.5
                """);

        List<EtaProReading> result = service.parseCsv(csv, "session-3");

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getPointId()).isEqualTo("Point1");
        assertThat(result.get(0).getReadingValue()).isEqualTo(10.5);
    }

    @Test
    void pivotFormatSkipsEmptyValues() throws Exception {
        Path csv = writeCsv("""
                Timestamp,Point1,Point2,Point3
                2026-04-08T10:00:00,10.5,,30.5
                """);

        List<EtaProReading> result = service.parseCsv(csv, "session-4");

        // Point2 is empty and should be skipped
        assertThat(result).hasSize(2);
        assertThat(result).extracting(EtaProReading::getPointId)
                .containsExactly("Point1", "Point3");
    }

    // ── Edge cases ──────────────────────────────────────────────────

    @Test
    void emptyCsvProducesNoReadings() throws Exception {
        Path csv = writeCsv("");
        List<EtaProReading> result = service.parseCsv(csv, "session-5");
        assertThat(result).isEmpty();
    }

    @Test
    void headerOnlyCsvProducesNoReadings() throws Exception {
        Path csv = writeCsv("PointId,Timestamp,Value,Quality\n");
        List<EtaProReading> result = service.parseCsv(csv, "session-6");
        assertThat(result).isEmpty();
    }

    @Test
    void skipsMalformedRowsWithoutFailing() throws Exception {
        Path csv = writeCsv("""
                PointId,Timestamp,Value,Quality
                1GT1.MW,2026-04-08T10:00:00,150.5,Good
                malformed-line-with-wrong-date,not-a-date,not-a-number,Bad
                1GT1.MW,2026-04-08T10:02:00,152.1,Good
                """);

        List<EtaProReading> result = service.parseCsv(csv, "session-7");

        // Malformed row is skipped, other two succeed
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getReadingValue()).isEqualTo(150.5);
        assertThat(result.get(1).getReadingValue()).isEqualTo(152.1);
    }

    @Test
    void handlesNullValueRepresentations() throws Exception {
        Path csv = writeCsv("""
                PointId,Timestamp,Value,Quality
                1GT1.MW,2026-04-08T10:00:00,NaN,Bad
                1GT1.MW,2026-04-08T10:01:00,N/A,Bad
                1GT1.MW,2026-04-08T10:02:00,150.5,Good
                """);

        List<EtaProReading> result = service.parseCsv(csv, "session-8");

        assertThat(result).hasSize(3);
        assertThat(result.get(0).getReadingValue()).isNull();
        assertThat(result.get(1).getReadingValue()).isNull();
        assertThat(result.get(2).getReadingValue()).isEqualTo(150.5);
    }

    @Test
    void parsesMultipleTimestampFormats() throws Exception {
        Path csv = writeCsv("""
                PointId,Timestamp,Value,Quality
                P1,2026-04-08T10:00:00,1.0,Good
                P2,2026-04-08 10:00:00,2.0,Good
                P3,04/08/2026 10:00:00,3.0,Good
                """);

        List<EtaProReading> result = service.parseCsv(csv, "session-9");

        assertThat(result).hasSize(3);
        // All three rows should parse to the same logical time (within format precision)
        assertThat(result).allMatch(r -> r.getReadingTime() != null);
        assertThat(result.get(0).getReadingTime().getHour()).isEqualTo(10);
        assertThat(result.get(1).getReadingTime().getHour()).isEqualTo(10);
        assertThat(result.get(2).getReadingTime().getHour()).isEqualTo(10);
    }

    @Test
    void handlesQuotedFieldsWithCommas() throws Exception {
        Path csv = writeCsv("""
                PointId,Timestamp,Value,Quality
                "P1,with,commas",2026-04-08T10:00:00,150.5,Good
                """);

        List<EtaProReading> result = service.parseCsv(csv, "session-10");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getPointId()).isEqualTo("P1,with,commas");
    }

    @Test
    void handlesEscapedQuotesInFields() throws Exception {
        // Use regular string (not text block) to avoid ambiguity with """ delimiters
        String content = "PointId,Timestamp,Value,Quality\n"
                + "\"P1 \"\"quoted\"\"\",2026-04-08T10:00:00,150.5,Good\n";
        Path csv = writeCsv(content);

        List<EtaProReading> result = service.parseCsv(csv, "session-11");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getPointId()).isEqualTo("P1 \"quoted\"");
    }

    @Test
    void allReadingsShareSessionId() throws Exception {
        Path csv = writeCsv("""
                PointId,Timestamp,Value,Quality
                P1,2026-04-08T10:00:00,1.0,Good
                P2,2026-04-08T10:00:00,2.0,Good
                """);

        List<EtaProReading> result = service.parseCsv(csv, "unique-session-xyz");

        assertThat(result).hasSize(2);
        assertThat(result).allMatch(r -> "unique-session-xyz".equals(r.getScrapeSessionId()));
    }

    // ── Helpers ─────────────────────────────────────────────────────

    private Path writeCsv(String content) throws Exception {
        Path file = tempDir.resolve("test.csv");
        Files.writeString(file, content);
        return file;
    }
}
