package com.dk_power.power_plant_java.sevice.etapro;

import com.dk_power.power_plant_java.entities.etapro.EtaProPoint;
import com.dk_power.power_plant_java.repository.etapro.EtaProPointRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Imports a catalog of EtaPro points from an uploaded Excel or CSV file.
 *
 * <p><b>Expected columns</b> (detected by case-insensitive header match):
 * <ul>
 *   <li>{@code Point ID} — required, unique key</li>
 *   <li>{@code Description} — optional</li>
 *   <li>{@code Units} — optional (also accepts {@code Unit})</li>
 * </ul>
 *
 * <p>A leading {@code #} column is ignored. Other unknown columns are ignored.
 *
 * <p><b>Sheet selection</b>: the first sheet containing a {@code Point ID} header row
 * is used. For multi-sheet workbooks, the typical "all points" sheet will win.
 *
 * <p><b>Matching</b>: existing points are identified by exact case-sensitive {@code pointId}
 * match. Re-running the import is safe — existing points are left untouched.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "etapro.enabled", havingValue = "true", matchIfMissing = false)
public class EtaProPointImportService {

    private final EtaProPointRepo pointRepo;

    public record ImportResult(
            int added,
            int skipped,
            int errorCount,
            List<String> errors
    ) {}

    private record ParsedRow(String pointId, String description, String unit, int lineNumber) {}

    /**
     * Parse the given upload and insert new points into the database.
     *
     * @param fileName     original filename (used only to pick parser: xlsx vs csv)
     * @param inputStream  file contents — caller is responsible for closing
     */
    @Transactional
    public ImportResult importFromUpload(String fileName, InputStream inputStream) throws IOException {
        if (fileName == null) fileName = "";
        String lower = fileName.toLowerCase();

        List<ParsedRow> rows;
        if (lower.endsWith(".xlsx") || lower.endsWith(".xlsm")) {
            rows = parseExcel(inputStream);
        } else if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
            rows = parseCsv(inputStream);
        } else {
            throw new IllegalArgumentException("Unsupported file type. Expected .xlsx, .xlsm, or .csv");
        }

        return applyImport(rows);
    }

    // ── Excel parser ──────────────────────────────────────────

    List<ParsedRow> parseExcel(InputStream inputStream) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(inputStream)) {
            DataFormatter formatter = new DataFormatter();

            // Find the first sheet with a Point ID header
            Sheet targetSheet = null;
            int[] colIndices = null;

            for (int s = 0; s < workbook.getNumberOfSheets(); s++) {
                Sheet sheet = workbook.getSheetAt(s);
                int[] candidates = findHeaderColumns(sheet, formatter);
                if (candidates != null && candidates[0] >= 0) {
                    targetSheet = sheet;
                    colIndices = candidates;
                    log.info("[EtaPro Import] Using sheet '{}' with header row 0", sheet.getSheetName());
                    break;
                }
            }

            if (targetSheet == null) {
                throw new IllegalArgumentException(
                        "No sheet with a 'Point ID' column was found in the uploaded file.");
            }

            int pointIdCol = colIndices[0];
            int descCol = colIndices[1];
            int unitCol = colIndices[2];

            List<ParsedRow> rows = new ArrayList<>();
            int lastRow = targetSheet.getLastRowNum();
            for (int r = 1; r <= lastRow; r++) {
                Row row = targetSheet.getRow(r);
                if (row == null) continue;
                String pointId = cellText(row, pointIdCol, formatter);
                if (pointId == null || pointId.isEmpty()) continue;

                String description = descCol >= 0 ? cellText(row, descCol, formatter) : "";
                String unit = unitCol >= 0 ? cellText(row, unitCol, formatter) : "";

                rows.add(new ParsedRow(pointId, description, unit, r + 1));
            }
            return rows;
        }
    }

    /**
     * Returns [pointIdCol, descCol, unitCol] indices, or null if no header row found.
     * Missing optional columns are -1.
     */
    private int[] findHeaderColumns(Sheet sheet, DataFormatter formatter) {
        Row header = sheet.getRow(0);
        if (header == null) return null;

        int pointIdCol = -1;
        int descCol = -1;
        int unitCol = -1;

        int lastCell = header.getLastCellNum();
        for (int c = 0; c < lastCell; c++) {
            String value = cellText(header, c, formatter);
            if (value == null) continue;
            String normalized = value.trim().toLowerCase();

            if (pointIdCol < 0 && (normalized.equals("point id") || normalized.equals("pointid")
                    || normalized.equals("tag") || normalized.equals("tag number"))) {
                pointIdCol = c;
            } else if (descCol < 0 && (normalized.equals("description") || normalized.equals("desc"))) {
                descCol = c;
            } else if (unitCol < 0 && (normalized.equals("units") || normalized.equals("unit")
                    || normalized.equals("uom"))) {
                unitCol = c;
            }
        }

        if (pointIdCol < 0) return null;
        return new int[]{pointIdCol, descCol, unitCol};
    }

    private String cellText(Row row, int col, DataFormatter formatter) {
        if (col < 0) return "";
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return "";
        if (cell.getCellType() == CellType.FORMULA) {
            try {
                return formatter.formatCellValue(cell).trim();
            } catch (Exception e) {
                return "";
            }
        }
        return formatter.formatCellValue(cell).trim();
    }

    // ── CSV parser ────────────────────────────────────────────

    List<ParsedRow> parseCsv(InputStream inputStream) throws IOException {
        List<String> lines = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                lines.add(line);
            }
        }

        if (lines.isEmpty()) {
            throw new IllegalArgumentException("CSV file is empty");
        }

        String[] headers = splitCsvLine(lines.get(0));
        int pointIdCol = -1, descCol = -1, unitCol = -1;
        for (int i = 0; i < headers.length; i++) {
            String normalized = headers[i].trim().toLowerCase();
            if (pointIdCol < 0 && (normalized.equals("point id") || normalized.equals("pointid")
                    || normalized.equals("tag") || normalized.equals("tag number"))) {
                pointIdCol = i;
            } else if (descCol < 0 && (normalized.equals("description") || normalized.equals("desc"))) {
                descCol = i;
            } else if (unitCol < 0 && (normalized.equals("units") || normalized.equals("unit")
                    || normalized.equals("uom"))) {
                unitCol = i;
            }
        }

        if (pointIdCol < 0) {
            throw new IllegalArgumentException("CSV header must contain a 'Point ID' column");
        }

        List<ParsedRow> rows = new ArrayList<>();
        for (int i = 1; i < lines.size(); i++) {
            String line = lines.get(i);
            if (line == null || line.trim().isEmpty()) continue;
            String[] cols = splitCsvLine(line);
            if (pointIdCol >= cols.length) continue;
            String pointId = cols[pointIdCol].trim();
            if (pointId.isEmpty()) continue;
            String description = (descCol >= 0 && descCol < cols.length) ? cols[descCol].trim() : "";
            String unit = (unitCol >= 0 && unitCol < cols.length) ? cols[unitCol].trim() : "";
            rows.add(new ParsedRow(pointId, description, unit, i + 1));
        }
        return rows;
    }

    private String[] splitCsvLine(String line) {
        List<String> fields = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder current = new StringBuilder();
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                fields.add(current.toString());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        fields.add(current.toString());
        return fields.toArray(new String[0]);
    }

    // ── DB insert ─────────────────────────────────────────────

    private ImportResult applyImport(List<ParsedRow> rows) {
        List<String> errors = new ArrayList<>();
        int added = 0;
        int skipped = 0;

        // Deduplicate within the file itself (same pointId appearing twice → only process first)
        Set<String> seenInFile = new HashSet<>();

        for (ParsedRow row : rows) {
            if (!seenInFile.add(row.pointId())) {
                errors.add("Row " + row.lineNumber() + ": duplicate pointId '" + row.pointId() + "' in file — skipped");
                continue;
            }

            try {
                Optional<EtaProPoint> existing = pointRepo.findByPointId(row.pointId());
                if (existing.isPresent()) {
                    skipped++;
                    continue;
                }

                EtaProPoint point = new EtaProPoint();
                point.setPointId(row.pointId());
                point.setDescription(nullIfEmpty(row.description()));
                point.setUnit(nullIfEmpty(row.unit()));
                point.setCategory(null); // not in the catalog sheet; user can set later
                point.setActive(true);
                pointRepo.save(point);
                added++;
            } catch (Exception e) {
                errors.add("Row " + row.lineNumber() + " (" + row.pointId() + "): " + e.getMessage());
            }
        }

        log.info("[EtaPro Import] Added {}, skipped {}, errors {}", added, skipped, errors.size());
        return new ImportResult(added, skipped, errors.size(), errors);
    }

    private String nullIfEmpty(String s) {
        if (s == null) return null;
        String trimmed = s.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
