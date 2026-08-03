package com.dk_power.power_plant_java.sevice.logging;

import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsEventDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class LogDiagnosticsFileServiceTest {

    private static final String FILE_NAME = "power-plant-logger.log";

    @TempDir
    Path tempDir;

    @Test
    void readsOnlyAppendedBytesAndKeepsExistingEventIds() throws IOException {
        LogDiagnosticsFileService service = service(100);
        Path activeLog = tempDir.resolve(FILE_NAME);
        String first = line("2026-08-02 12:00:00.000", "app.first", "first");
        Files.writeString(activeLog, first, StandardCharsets.UTF_8);

        List<LogDiagnosticsEventDto> initial = service.getSnapshot().events();
        long bytesAfterInitialRead = service.getBytesReadForTesting(FILE_NAME);
        String firstId = initial.getFirst().eventId();

        String second = line("2026-08-02 12:01:00.000", "app.second", "second");
        Files.writeString(activeLog, second, StandardCharsets.UTF_8, StandardOpenOption.APPEND);
        List<LogDiagnosticsEventDto> afterAppend = service.getSnapshot().events();

        assertThat(initial).hasSize(1);
        assertThat(afterAppend).hasSize(2);
        assertThat(afterAppend.getFirst().eventId()).isEqualTo(firstId);
        assertThat(service.getBytesReadForTesting(FILE_NAME) - bytesAfterInitialRead)
            .isEqualTo(second.getBytes(StandardCharsets.UTF_8).length);
    }

    @Test
    void preservesBoundedPriorGenerationAcrossRotation() throws IOException {
        LogDiagnosticsFileService service = service(10);
        Path activeLog = tempDir.resolve(FILE_NAME);
        Files.writeString(activeLog, line("2026-08-02 12:00:00.000", "app.old", "old"));
        String oldId = service.getSnapshot().events().getFirst().eventId();

        Files.move(activeLog, tempDir.resolve(FILE_NAME + ".1"));
        Files.writeString(activeLog, line("2026-08-02 12:01:00.000", "app.new", "new"));
        LogDiagnosticsFileService.LogFilesSnapshot afterRotation = service.getSnapshot();

        assertThat(afterRotation.events()).extracting(LogDiagnosticsEventDto::eventCode)
            .containsExactly("app.old", "app.new");
        assertThat(afterRotation.events().getFirst().eventId()).isEqualTo(oldId);
        assertThat(afterRotation.events().getLast().eventId()).isNotEqualTo(oldId);
        assertThat(afterRotation.truncated()).isTrue();
    }

    @Test
    void detectsTruncationAndEvictsOldestAtConfiguredBound() throws IOException {
        LogDiagnosticsFileService service = service(2);
        Path activeLog = tempDir.resolve(FILE_NAME);
        Files.writeString(
            activeLog,
            line("2026-08-02 12:00:00.000", "app.one", "one")
                + line("2026-08-02 12:01:00.000", "app.two", "two")
        );
        assertThat(service.getSnapshot().events()).hasSize(2);

        Files.writeString(
            activeLog,
            line("2026-08-02 13:00:00.000", "app.three", "three"),
            StandardOpenOption.TRUNCATE_EXISTING
        );
        LogDiagnosticsFileService.LogFilesSnapshot afterTruncate = service.getSnapshot();

        assertThat(afterTruncate.events()).extracting(LogDiagnosticsEventDto::eventCode)
            .containsExactly("app.two", "app.three");
        assertThat(afterTruncate.truncated()).isTrue();
    }

    @Test
    void assignsDistinctIdsWhenRewriteReusesTimestampAndOffset() throws IOException {
        LogDiagnosticsFileService service = service(10);
        Path activeLog = tempDir.resolve(FILE_NAME);
        String timestamp = "2026-08-02 12:00:00.000";
        Files.writeString(activeLog, line(timestamp, "app.old", "old"));
        String oldId = service.getSnapshot().events().getFirst().eventId();

        Files.writeString(
            activeLog,
            line(timestamp, "app.rewritten", "rewritten"),
            StandardOpenOption.TRUNCATE_EXISTING
        );
        LogDiagnosticsFileService.LogFilesSnapshot afterRewrite = service.getSnapshot();

        assertThat(afterRewrite.events()).extracting(LogDiagnosticsEventDto::eventCode)
            .containsExactly("app.old", "app.rewritten");
        assertThat(afterRewrite.events()).extracting(LogDiagnosticsEventDto::eventId)
            .doesNotHaveDuplicates();
        assertThat(afterRewrite.events().getLast().eventId()).isNotEqualTo(oldId);
    }

    @Test
    void versionsProvisionalTailWhenLateDetailsArrive() throws IOException {
        LogDiagnosticsFileService service = service(10);
        Path activeLog = tempDir.resolve(FILE_NAME);
        Files.writeString(activeLog, line("2026-08-02 12:00:00.000", "app.failed", "failure"));
        LogDiagnosticsEventDto initial = service.getSnapshot().events().getFirst();

        Files.writeString(
            activeLog,
            "\tat example.Service.call(Service.java:42)" + System.lineSeparator(),
            StandardOpenOption.APPEND
        );
        LogDiagnosticsEventDto updated = service.getSnapshot().events().getFirst();

        assertThat(updated.logicalEventId()).isEqualTo(initial.logicalEventId());
        assertThat(updated.eventId()).isNotEqualTo(initial.eventId());
        assertThat(updated.eventId()).isGreaterThan(initial.eventId());
        assertThat(updated.details()).contains("example.Service.call");
    }

    private LogDiagnosticsFileService service(int maxEvents) {
        LogDiagnosticsFileService service = new LogDiagnosticsFileService(new LogDiagnosticsParserService());
        ReflectionTestUtils.setField(service, "logsDirectory", tempDir.toString());
        ReflectionTestUtils.setField(service, "maxEventsPerFile", maxEvents);
        return service;
    }

    private String line(String timestamp, String eventCode, String message) {
        return timestamp + " INFO [main] "
            + "[req=- user=- machine=- job=- jobRun=- sync=- entity=-/- sp=-] "
            + "example.Logger - " + eventCode + ' ' + message + System.lineSeparator();
    }
}
