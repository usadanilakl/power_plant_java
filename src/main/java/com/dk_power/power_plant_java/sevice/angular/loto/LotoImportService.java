package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.loto.LotoBox;
import com.dk_power.power_plant_java.repository.loto.LotoBoxRepo;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LotoImportService {
    private final NgLotoService ngLotoService;
    private final LotoBoxRepo lotoBoxRepo;
    private final LotoRepo lotoRepo;

    /**
     * Parse uploaded file into rows (for preview or import).
     * Returns list of maps with standardized keys: lotoNumber, equipmentDescription, jobDescription, lockBox
     */
    public List<Map<String, String>> parseFile(MultipartFile file) throws Exception {
        String filename = file.getOriginalFilename();
        if (filename == null) throw new IllegalArgumentException("File has no name");

        String lower = filename.toLowerCase();
        if (lower.endsWith(".csv")) {
            return parseCsv(file);
        } else if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
            return parseExcel(file);
        } else {
            throw new IllegalArgumentException("Unsupported file type. Use .csv, .xlsx, or .xls");
        }
    }

    /**
     * Import LOTOs from parsed rows. Creates a Loto entity for each row.
     */
    @Transactional
    public List<LotoDto> importLotos(MultipartFile file) throws Exception {
        List<Map<String, String>> rows = parseFile(file);
        List<LotoDto> results = new ArrayList<>();

        for (Map<String, String> row : rows) {
            try {
                Loto loto = createOrUpdateLotoFromRow(row);
                Loto saved = ngLotoService.save(loto);
                results.add(ngLotoService.toDto(saved));
            } catch (Exception e) {
                System.err.println("Error importing row " + row + ": " + e.getMessage());
            }
        }

        return results;
    }

    private Loto createOrUpdateLotoFromRow(Map<String, String> row) {
        String lotoNumber = row.getOrDefault("lotoNumber", "").trim();

        // Find existing LOTO by name or create new
        Loto loto = lotoNumber.isEmpty() ? new Loto()
                : lotoRepo.findByName(lotoNumber).orElse(new Loto());

        if (!lotoNumber.isEmpty()) {
            loto.setName(lotoNumber);
            try {
                loto.setDocNum(Long.parseLong(lotoNumber));
            } catch (NumberFormatException ignored) {}
        }

        String equipmentDesc = row.getOrDefault("equipmentDescription", "").trim();
        if (!equipmentDesc.isEmpty()) {
            loto.setEquipmentSystem(equipmentDesc);
        }

        String jobDesc = row.getOrDefault("jobDescription", "").trim();
        if (!jobDesc.isEmpty()) {
            loto.setWorkScope(jobDesc);
        }

        String lockBox = row.getOrDefault("lockBox", "").trim();
        if (!lockBox.isEmpty()) {
            try {
                // Remove any decimal (e.g., "57.0" from Excel)
                int boxNumber = (int) Double.parseDouble(lockBox);
                loto.setBoxNumber(boxNumber);

                LotoBox box = lotoBoxRepo.findByNumber(boxNumber);
                if (box != null) {
                    loto.setLotoBox(box);
                }
            } catch (NumberFormatException e) {
                // Non-numeric box value, skip linking
            }
        }

        return loto;
    }

    private List<Map<String, String>> parseCsv(MultipartFile file) throws Exception {
        List<Map<String, String>> rows = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String headerLine = reader.readLine();
            if (headerLine == null) return rows;

            List<String> headers = parseCsvLine(headerLine);
            Map<Integer, String> columnMapping = buildColumnMapping(headers);

            String line;
            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                List<String> values = parseCsvLine(line);
                Map<String, String> row = mapRowValues(values, columnMapping);
                if (!row.isEmpty()) rows.add(row);
            }
        }

        return rows;
    }

    private List<Map<String, String>> parseExcel(MultipartFile file) throws Exception {
        List<Map<String, String>> rows = new ArrayList<>();

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) return rows;

            Row headerRow = sheet.getRow(0);
            if (headerRow == null) return rows;

            List<String> headers = new ArrayList<>();
            for (Cell cell : headerRow) {
                headers.add(getCellStringValue(cell));
            }

            Map<Integer, String> columnMapping = buildColumnMapping(headers);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                List<String> values = new ArrayList<>();
                for (int j = 0; j < headers.size(); j++) {
                    Cell cell = row.getCell(j);
                    values.add(getCellStringValue(cell));
                }

                Map<String, String> mapped = mapRowValues(values, columnMapping);
                if (!mapped.isEmpty()) rows.add(mapped);
            }
        }

        return rows;
    }

    /**
     * Maps column headers to standardized keys using flexible matching.
     */
    private Map<Integer, String> buildColumnMapping(List<String> headers) {
        Map<Integer, String> mapping = new LinkedHashMap<>();

        for (int i = 0; i < headers.size(); i++) {
            String header = headers.get(i).toLowerCase().trim();
            if (header.contains("loto") && header.contains("number")) {
                mapping.put(i, "lotoNumber");
            } else if (header.contains("equipment") && header.contains("description")) {
                mapping.put(i, "equipmentDescription");
            } else if (header.contains("job") && header.contains("description")) {
                mapping.put(i, "jobDescription");
            } else if (header.contains("lock") && header.contains("box")) {
                mapping.put(i, "lockBox");
            } else if (header.contains("status")) {
                mapping.put(i, "status");
            }
        }

        return mapping;
    }

    private Map<String, String> mapRowValues(List<String> values, Map<Integer, String> columnMapping) {
        Map<String, String> row = new LinkedHashMap<>();
        for (Map.Entry<Integer, String> entry : columnMapping.entrySet()) {
            int idx = entry.getKey();
            if (idx < values.size()) {
                String value = values.get(idx).trim();
                if (!value.isEmpty()) {
                    row.put(entry.getValue(), value);
                }
            }
        }
        return row;
    }

    private List<String> parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder current = new StringBuilder();

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                result.add(current.toString().trim());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        result.add(current.toString().trim());

        return result;
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val) && !Double.isInfinite(val)) {
                    yield String.valueOf((long) val);
                }
                yield String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try {
                    yield cell.getStringCellValue();
                } catch (Exception e) {
                    yield String.valueOf(cell.getNumericCellValue());
                }
            }
            default -> "";
        };
    }
}
