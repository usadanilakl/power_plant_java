package com.dk_power.power_plant_java.sevice.etapro;

import com.dk_power.power_plant_java.entities.etapro.EtaProPoint;
import com.dk_power.power_plant_java.repository.etapro.EtaProPointRepo;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link EtaProPointImportService} with a mocked repository.
 * Covers XLSX parsing, CSV parsing, header detection, dedup-by-pointId,
 * in-file duplicates, and error rows.
 */
class EtaProPointImportServiceTest {

    private EtaProPointRepo repo;
    private EtaProPointImportService service;

    /** In-memory store to simulate pointId uniqueness across saves. */
    private Map<String, EtaProPoint> stored;

    @BeforeEach
    void setUp() {
        repo = mock(EtaProPointRepo.class);
        service = new EtaProPointImportService(repo);

        stored = new HashMap<>();
        when(repo.findByPointId(any())).thenAnswer(inv -> {
            String id = inv.getArgument(0);
            return Optional.ofNullable(stored.get(id));
        });
        when(repo.save(any())).thenAnswer(inv -> {
            EtaProPoint p = inv.getArgument(0);
            stored.put(p.getPointId(), p);
            return p;
        });
    }

    // ── CSV parsing ─────────────────────────────────────────────

    @Test
    void importsNewPointsFromCsv() throws Exception {
        String csv = """
                #,Point ID,Description,Units
                1,1GT1.MW,Gas Turbine 1 MW,MW
                2,1GT1.EX_TEMP,Exhaust Temp,degF
                3,1HRSG.PRESS,Main Steam Press,PSI
                """;

        EtaProPointImportService.ImportResult result = runImport("points.csv", csv);

        assertThat(result.added()).isEqualTo(3);
        assertThat(result.skipped()).isZero();
        assertThat(result.errorCount()).isZero();

        ArgumentCaptor<EtaProPoint> captor = ArgumentCaptor.forClass(EtaProPoint.class);
        verify(repo, org.mockito.Mockito.times(3)).save(captor.capture());
        assertThat(captor.getAllValues()).extracting(EtaProPoint::getPointId)
                .containsExactly("1GT1.MW", "1GT1.EX_TEMP", "1HRSG.PRESS");
        assertThat(captor.getAllValues()).extracting(EtaProPoint::getDescription)
                .containsExactly("Gas Turbine 1 MW", "Exhaust Temp", "Main Steam Press");
        assertThat(captor.getAllValues()).extracting(EtaProPoint::getUnit)
                .containsExactly("MW", "degF", "PSI");
        assertThat(captor.getAllValues()).extracting(EtaProPoint::getActive)
                .containsOnly(Boolean.TRUE);
    }

    @Test
    void skipsExistingPointsOnReImport() throws Exception {
        // First import: 2 new points
        String csv = """
                Point ID,Description,Units
                P1,Desc 1,MW
                P2,Desc 2,PSI
                """;
        EtaProPointImportService.ImportResult first = runImport("points.csv", csv);
        assertThat(first.added()).isEqualTo(2);

        // Second import: same file — should skip both
        EtaProPointImportService.ImportResult second = runImport("points.csv", csv);
        assertThat(second.added()).isZero();
        assertThat(second.skipped()).isEqualTo(2);
        assertThat(second.errorCount()).isZero();

        // repo.save was only called twice total (from first import)
        verify(repo, org.mockito.Mockito.times(2)).save(any());
    }

    @Test
    void incrementalReImportAddsOnlyNewPoints() throws Exception {
        // First import: 2 points
        runImport("points.csv", """
                Point ID,Description,Units
                P1,Desc 1,MW
                P2,Desc 2,PSI
                """);

        // Second import: 2 original + 1 new
        EtaProPointImportService.ImportResult result = runImport("points.csv", """
                Point ID,Description,Units
                P1,Desc 1,MW
                P2,Desc 2,PSI
                P3,Desc 3,degF
                """);

        assertThat(result.added()).isEqualTo(1);
        assertThat(result.skipped()).isEqualTo(2);
        assertThat(stored).containsKeys("P1", "P2", "P3");
    }

    @Test
    void detectsInFileDuplicatesAsErrors() throws Exception {
        EtaProPointImportService.ImportResult result = runImport("points.csv", """
                Point ID,Description,Units
                P1,Desc 1,MW
                P1,Desc 1 again,MW
                P2,Desc 2,PSI
                """);

        assertThat(result.added()).isEqualTo(2);
        assertThat(result.errorCount()).isEqualTo(1);
        assertThat(result.errors().get(0)).contains("duplicate").contains("P1");
    }

    @Test
    void ignoresBlankRows() throws Exception {
        EtaProPointImportService.ImportResult result = runImport("points.csv", """
                Point ID,Description,Units
                P1,Desc 1,MW

                P2,Desc 2,PSI
                ,should be skipped,unit
                """);

        assertThat(result.added()).isEqualTo(2);
    }

    @Test
    void acceptsAlternateHeaderNames() throws Exception {
        // "Unit" instead of "Units", "Tag Number" instead of "Point ID"
        EtaProPointImportService.ImportResult result = runImport("points.csv", """
                Tag Number,Description,Unit
                P1,Desc 1,MW
                """);
        assertThat(result.added()).isEqualTo(1);
    }

    @Test
    void rejectsCsvWithoutPointIdColumn() {
        assertThatThrownBy(() -> runImport("bad.csv", """
                Name,Description,Units
                P1,Desc 1,MW
                """))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Point ID");
    }

    @Test
    void rejectsUnsupportedFileType() {
        assertThatThrownBy(() -> runImport("points.pdf", "some,header\nvalue,data"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported");
    }

    // ── Excel parsing ───────────────────────────────────────────

    @Test
    void importsFromXlsx() throws Exception {
        byte[] xlsxBytes = buildXlsx("Sheet1", new String[][]{
                {"#", "Point ID", "Description", "Units"},
                {"1", "XL.P1", "Excel Point 1", "MW"},
                {"2", "XL.P2", "Excel Point 2", "degF"},
        });

        EtaProPointImportService.ImportResult result =
                service.importFromUpload("catalog.xlsx", new ByteArrayInputStream(xlsxBytes));

        assertThat(result.added()).isEqualTo(2);
        assertThat(result.skipped()).isZero();
        assertThat(stored).containsKeys("XL.P1", "XL.P2");
        assertThat(stored.get("XL.P1").getDescription()).isEqualTo("Excel Point 1");
    }

    @Test
    void xlsxImportSkipsSheetsWithoutPointIdHeader() throws Exception {
        // First sheet has no Point ID column, second one does — should pick the second
        byte[] xlsxBytes = buildTwoSheetXlsx(
                new String[][]{
                        {"Metadata", "Value"},
                        {"Plant", "Jackson"}
                },
                new String[][]{
                        {"Point ID", "Description", "Units"},
                        {"XL.P1", "Found", "MW"}
                });

        EtaProPointImportService.ImportResult result =
                service.importFromUpload("catalog.xlsx", new ByteArrayInputStream(xlsxBytes));

        assertThat(result.added()).isEqualTo(1);
        assertThat(stored).containsKey("XL.P1");
    }

    @Test
    void xlsxImportFailsWhenNoSheetHasPointIdHeader() throws Exception {
        byte[] xlsxBytes = buildXlsx("Other", new String[][]{
                {"Name", "Description"},
                {"Foo", "Bar"}
        });

        assertThatThrownBy(() -> service.importFromUpload("catalog.xlsx", new ByteArrayInputStream(xlsxBytes)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Point ID");

        verify(repo, never()).save(any());
    }

    // ── Helpers ─────────────────────────────────────────────────

    private EtaProPointImportService.ImportResult runImport(String filename, String content) throws Exception {
        try (InputStream is = new ByteArrayInputStream(content.getBytes(java.nio.charset.StandardCharsets.UTF_8))) {
            return service.importFromUpload(filename, is);
        }
    }

    private byte[] buildXlsx(String sheetName, String[][] rows) throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(sheetName);
            for (int r = 0; r < rows.length; r++) {
                Row row = sheet.createRow(r);
                for (int c = 0; c < rows[r].length; c++) {
                    row.createCell(c).setCellValue(rows[r][c]);
                }
            }
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private byte[] buildTwoSheetXlsx(String[][] sheet1Rows, String[][] sheet2Rows) throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            fillSheet(workbook.createSheet("First"), sheet1Rows);
            fillSheet(workbook.createSheet("AllPoints"), sheet2Rows);
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private void fillSheet(Sheet sheet, String[][] rows) {
        for (int r = 0; r < rows.length; r++) {
            Row row = sheet.createRow(r);
            for (int c = 0; c < rows[r].length; c++) {
                row.createCell(c).setCellValue(rows[r][c]);
            }
        }
    }
}
