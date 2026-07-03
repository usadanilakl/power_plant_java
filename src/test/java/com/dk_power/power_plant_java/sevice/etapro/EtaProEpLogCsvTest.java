package com.dk_power.power_plant_java.sevice.etapro;

import com.dk_power.power_plant_java.entities.etapro.EtaProLogEntry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pure unit tests for {@link EtaProScraperEngine#parseEpLogCsv(Path, String)} — the
 * EtaPRO Event Log CSV parser. Covers Excel-serial date conversion, column mapping by
 * header name, the already-flattened multi-line text, and the composite dedup key.
 * The parser has no injected dependencies, so we instantiate the engine with nulls.
 */
class EtaProEpLogCsvTest {

    private EtaProScraperEngine service;

    @TempDir
    Path tempDir;

    private static final String HEADER =
            "Description,Area,Location,Created By,Create Time,Deactivated By,Deactivate Time,Crew";

    @BeforeEach
    void setUp() {
        service = new EtaProScraperEngine(null, null, null);
    }

    @Test
    void parsesRowsAndConvertsExcelSerialCreateTime() throws Exception {
        // 46202.3035185185 == 2026-06-29 07:17:04 (serial 46202.0 == 2026-06-29 00:00,
        // anchored by the P1 test where 46202.366423287 == 2026-06-29 08:47:38).
        Path csv = writeCsv(HEADER + "\n"
                + "Chemical totes filled,Both Units 1 & 2,Condensate,Sidney Bazemore,46202.3035185185,,,D Crew\n");

        List<EtaProLogEntry> result = service.parseEpLogCsv(csv, "sess-1");

        assertThat(result).hasSize(1);
        EtaProLogEntry e = result.get(0);
        assertThat(e.getDescription()).isEqualTo("Chemical totes filled");
        assertThat(e.getArea()).isEqualTo("Both Units 1 & 2");
        assertThat(e.getLocation()).isEqualTo("Condensate");
        assertThat(e.getCreatedByName()).isEqualTo("Sidney Bazemore");
        assertThat(e.getCreateTime()).isEqualTo(LocalDateTime.of(2026, 6, 29, 7, 17, 4));
        assertThat(e.getCrew()).isEqualTo("D Crew");
        assertThat(e.getDeactivatedBy()).isNull();
        assertThat(e.getDeactivateTime()).isNull();
        assertThat(e.getScrapeSessionId()).isEqualTo("sess-1");
        assertThat(e.getDedupKey()).hasSize(64);  // SHA-256 hex
    }

    @Test
    void keepsFlattenedMultilineTextWithQuotedCommas() throws Exception {
        // PowerShell already flattened newlines to " | "; the field is quoted because it
        // contains a comma. The parser must preserve the whole field verbatim.
        Path csv = writeCsv(HEADER + "\n"
                + "\"Lead:Danil K | CRO:Adam B | Unit 2: 617.780 | Aux Boiler (1=ON, 0=OFF)\","
                + "Plant status,General,abunker,46202.208287037,,,C Crew\n");

        List<EtaProLogEntry> result = service.parseEpLogCsv(csv, "sess-2");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getDescription())
                .isEqualTo("Lead:Danil K | CRO:Adam B | Unit 2: 617.780 | Aux Boiler (1=ON, 0=OFF)");
        assertThat(result.get(0).getArea()).isEqualTo("Plant status");
        assertThat(result.get(0).getCreateTime()).isNotNull();
    }

    @Test
    void dedupKeyIsDeterministicForIdenticalRowsAndDiffersOtherwise() throws Exception {
        Path csv = writeCsv(HEADER + "\n"
                + "Same entry,A,L,bob,46202.5,,,C Crew\n"
                + "Same entry,A,L,bob,46202.5,,,C Crew\n"
                + "Different entry,A,L,bob,46202.5,,,C Crew\n");

        List<EtaProLogEntry> result = service.parseEpLogCsv(csv, "sess-3");

        assertThat(result).hasSize(3);
        // Identical (createTime|description|createdBy) -> identical key
        assertThat(result.get(0).getDedupKey()).isEqualTo(result.get(1).getDedupKey());
        // Different description -> different key
        assertThat(result.get(2).getDedupKey()).isNotEqualTo(result.get(0).getDedupKey());
    }

    @Test
    void mapsColumnsByHeaderNameRegardlessOfOrder() throws Exception {
        // Reordered columns — parser keys off header names, not position
        Path csv = writeCsv("Crew,Create Time,Description,Created By,Area,Location,Deactivated By,Deactivate Time\n"
                + "A Crew,46202.5,Reordered entry,alice,BOP,General,,\n");

        List<EtaProLogEntry> result = service.parseEpLogCsv(csv, "sess-4");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getDescription()).isEqualTo("Reordered entry");
        assertThat(result.get(0).getCreatedByName()).isEqualTo("alice");
        assertThat(result.get(0).getCrew()).isEqualTo("A Crew");
        assertThat(result.get(0).getArea()).isEqualTo("BOP");
    }

    @Test
    void skipsBlankRowsAndHeaderOnly() throws Exception {
        Path headerOnly = writeCsv(HEADER + "\n");
        assertThat(service.parseEpLogCsv(headerOnly, "sess-5")).isEmpty();

        Path withBlank = writeCsv(HEADER + "\n"
                + "Real entry,A,L,bob,46202.5,,,C Crew\n"
                + ",,,,,,,\n");
        List<EtaProLogEntry> result = service.parseEpLogCsv(withBlank, "sess-6");
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getDescription()).isEqualTo("Real entry");
    }

    @Test
    void emptyCsvProducesNoEntries() throws Exception {
        assertThat(service.parseEpLogCsv(writeCsv(""), "sess-7")).isEmpty();
    }

    @Test
    void missingRequiredHeadersFailsLoudlyInsteadOfDroppingAllRows() throws Exception {
        // 'Create Time' renamed to 'Created' — without validation every row would be silently
        // skipped and the batch would falsely report success. Must throw instead.
        Path csv = writeCsv("Description,Area,Location,Created By,Created,Deactivated By,Deactivate Time,Crew\n"
                + "Some entry,A,L,bob,46202.5,,,C Crew\n");
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.parseEpLogCsv(csv, "sess-8"))
                .isInstanceOf(java.io.IOException.class)
                .hasMessageContaining("missing expected headers");
    }

    private Path writeCsv(String content) throws Exception {
        Path file = tempDir.resolve("eplog.csv");
        Files.writeString(file, content);
        return file;
    }
}
