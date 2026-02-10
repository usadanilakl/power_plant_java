package com.dk_power.power_plant_java.sevice.angular.engraver;

import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class EngraverService {

    public static final int BATCH_SIZE = 4;

    @Value("${engraver.data.path:engraver_data}")
    private String engraverDataPath;

    @Value("${engraver.csv.filename:tags-to-print.csv}")
    private String csvFilename;

    @Value("${engraver.lightburn.template:tag-array-text-only.lbrn2}")
    private String lightburnTemplate;

    @Value("${engraver.lightburn.template-with-qr:tag-array-with-qr.lbrn2}")
    private String lightburnTemplateWithQr;

    @Value("${engraver.lightburn.path:C:/Program Files/LightBurn/LightBurn.exe}")
    private String lightburnPath;

    @Value("${engraver.csv.include-header:false}")
    private boolean includeHeader;

    /**
     * Generates CSV file for a batch of LOTO points.
     * The CSV has columns for 1-line, 2-line, 3-line, and 4-line descriptions.
     * Header inclusion is controlled by engraver.csv.include-header property (default: false).
     */
    public String generateCsvForBatch(List<LotoPoint> batch, boolean withQr) throws IOException {
        File csvFile = new File(engraverDataPath, csvFilename);

        // Ensure directory exists
        csvFile.getParentFile().mkdirs();

        try (PrintWriter writer = new PrintWriter(new FileWriter(csvFile))) {
            // Write header only if configured to include it
            if (includeHeader) {
                writer.println("tagNumber,oneLineDescription,twoLineDescription1,twoLineDescription2,threeLineDescription1,threeLineDescription2,threeLineDescription3,fourLineDescription1,fourLineDescription2,fourLineDescription3,fourLineDescription4,qrCode");
            }

            // Write each item
            for (LotoPoint point : batch) {
                String[] row = mapLotoPointToCsvRow(point, withQr);
                writer.println(String.join(",", row));
            }
        }

        log.info("Generated CSV file at: {} with {} items (header: {}, withQr: {})", csvFile.getAbsolutePath(), batch.size(), includeHeader, withQr);
        return csvFile.getAbsolutePath();
    }

    /**
     * Maps a LotoPoint to CSV columns based on description length.
     * Automatically determines whether to use 1, 2, 3, or 4 line format.
     * QR code is the last column (column 12).
     *
     * CSV columns: tagNumber, oneLineDesc, twoLine1, twoLine2, threeLine1, threeLine2, threeLine3, fourLine1, fourLine2, fourLine3, fourLine4, qrCode
     */
    private String[] mapLotoPointToCsvRow(LotoPoint point, boolean withQr) {
        String tagNumber = escapeCsvField(point.getTagNumber() != null ? point.getTagNumber() : "");
        String description = point.getDescription() != null ? point.getDescription() : "";

        // Split description into lines (check for existing line breaks or split by length)
        String[] lines = splitDescription(description);

        // Initialize all columns as empty
        String oneLineDesc = "";
        String twoLine1 = "";
        String twoLine2 = "";
        String threeLine1 = "";
        String threeLine2 = "";
        String threeLine3 = "";
        String fourLine1 = "";
        String fourLine2 = "";
        String fourLine3 = "";
        String fourLine4 = "";

        if (lines.length == 1 && lines[0].length() <= 20) {
            // Short single line - use oneLineDescription
            oneLineDesc = escapeCsvField(lines[0]);
        } else if (lines.length <= 2) {
            // Two lines - use twoLineDescription columns
            twoLine1 = escapeCsvField(lines[0]);
            twoLine2 = lines.length > 1 ? escapeCsvField(lines[1]) : "";
        } else if (lines.length == 3) {
            // Three lines - use threeLineDescription columns
            threeLine1 = escapeCsvField(lines[0]);
            threeLine2 = escapeCsvField(lines[1]);
            threeLine3 = escapeCsvField(lines[2]);
        } else {
            // Four lines - use fourLineDescription columns
            fourLine1 = escapeCsvField(lines[0]);
            fourLine2 = escapeCsvField(lines[1]);
            fourLine3 = escapeCsvField(lines[2]);
            fourLine4 = lines.length > 3 ? escapeCsvField(lines[3]) : "";
        }

        // QR code is the last column - contains tag number if withQr is true
        String qrCode = withQr ? tagNumber : "";

        return new String[]{tagNumber, oneLineDesc, twoLine1, twoLine2, threeLine1, threeLine2, threeLine3, fourLine1, fourLine2, fourLine3, fourLine4, qrCode};
    }

    /**
     * Splits a description into multiple lines.
     * First checks for explicit line breaks, then splits by length if needed.
     */
    private String[] splitDescription(String description) {
        if (description == null || description.isEmpty()) {
            return new String[]{""};
        }

        // Check for explicit line breaks
        if (description.contains("\n")) {
            String[] lines = description.split("\n");
            // Trim each line and limit to 4 lines
            String[] result = new String[Math.min(lines.length, 4)];
            for (int i = 0; i < result.length; i++) {
                result[i] = lines[i].trim();
            }
            return result;
        }

        // If no line breaks and description is short, return as single line
        if (description.length() <= 20) {
            return new String[]{description};
        }

        // Split long descriptions into multiple lines (max ~20 chars per line)
        return splitByLength(description, 20);
    }

    /**
     * Splits a string into multiple lines of approximately maxLength characters,
     * trying to break at word boundaries.
     */
    private String[] splitByLength(String text, int maxLength) {
        if (text.length() <= maxLength) {
            return new String[]{text};
        }

        String[] words = text.split("\\s+");
        StringBuilder currentLine = new StringBuilder();
        java.util.List<String> lines = new java.util.ArrayList<>();

        for (String word : words) {
            if (currentLine.length() + word.length() + 1 <= maxLength) {
                if (currentLine.length() > 0) {
                    currentLine.append(" ");
                }
                currentLine.append(word);
            } else {
                if (currentLine.length() > 0) {
                    lines.add(currentLine.toString());
                    currentLine = new StringBuilder();
                }
                currentLine.append(word);
            }

            // Limit to 4 lines
            if (lines.size() >= 3 && currentLine.length() > 0) {
                lines.add(currentLine.toString());
                break;
            }
        }

        if (currentLine.length() > 0 && lines.size() < 4) {
            lines.add(currentLine.toString());
        }

        return lines.toArray(new String[0]);
    }

    /**
     * Escapes a field for CSV format.
     */
    private String escapeCsvField(String field) {
        if (field == null) return "";
        // If field contains comma, quote, or newline, wrap in quotes
        if (field.contains(",") || field.contains("\"") || field.contains("\n")) {
            return "\"" + field.replace("\"", "\"\"") + "\"";
        }
        return field;
    }

    /**
     * Lists available LightBurn template files (.lbrn2) in the engraver data directory.
     */
    public List<String> listTemplateFiles() {
        File dir = new File(engraverDataPath);
        if (!dir.exists() || !dir.isDirectory()) {
            return Collections.emptyList();
        }
        File[] files = dir.listFiles((d, name) -> name.toLowerCase().endsWith(".lbrn2"));
        if (files == null) {
            return Collections.emptyList();
        }
        return Arrays.stream(files)
                .map(File::getName)
                .sorted()
                .collect(Collectors.toList());
    }

    /**
     * Ensures the template's VariableText section has the correct CSV Filename.
     * Injects or updates the Filename element so any template works with the generated CSV.
     */
    private void injectCsvPathIntoTemplate(File templateFile) throws IOException {
        String csvAbsolutePath = new File(engraverDataPath, csvFilename).getAbsolutePath().replace('\\', '/');
        String filenameElement = "        <Filename Value=\"" + csvAbsolutePath + "\"/>";

        String content = Files.readString(templateFile.toPath(), StandardCharsets.UTF_8);

        if (content.contains("<Filename Value=\"")) {
            // Replace existing Filename element
            content = content.replaceFirst(
                    "<Filename Value=\"[^\"]*\"/>",
                    "<Filename Value=\"" + csvAbsolutePath + "\"/>"
            );
        } else if (content.contains("</VariableText>")) {
            // Insert Filename before closing tag
            content = content.replace("</VariableText>", filenameElement + "\n    </VariableText>");
        }

        Files.writeString(templateFile.toPath(), content, StandardCharsets.UTF_8);
        log.info("Injected CSV path into template: {}", csvAbsolutePath);
    }

    /**
     * Opens LightBurn with a specific template file.
     * Injects the CSV path into the template before opening.
     */
    public void openLightBurn(String templateName) throws IOException {
        File templateFile = new File(engraverDataPath, templateName);

        if (!templateFile.exists()) {
            log.warn("LightBurn template not found: {}", templateFile.getAbsolutePath());
            throw new IOException("LightBurn template file not found: " + templateFile.getAbsolutePath());
        }

        injectCsvPathIntoTemplate(templateFile);

        try {
            String os = System.getProperty("os.name").toLowerCase();

            if (os.contains("win")) {
                // Windows - use PowerShell to open file and bring window to foreground
                String psScript = String.format(
                    "$file = '%s'; " +
                    "Start-Process $file; " +
                    "Start-Sleep -Milliseconds 500; " +
                    "$wshell = New-Object -ComObject wscript.shell; " +
                    "$wshell.AppActivate('LightBurn')",
                    templateFile.getAbsolutePath().replace("'", "''")
                );
                ProcessBuilder pb = new ProcessBuilder("powershell", "-Command", psScript);
                pb.start();
            } else if (os.contains("mac")) {
                // macOS - open and activate
                ProcessBuilder pb = new ProcessBuilder("open", "-a", "LightBurn", templateFile.getAbsolutePath());
                pb.start();
            } else {
                // Linux
                ProcessBuilder pb = new ProcessBuilder("xdg-open", templateFile.getAbsolutePath());
                pb.start();
            }

            log.info("Opened LightBurn with template: {}", templateFile.getAbsolutePath());
        } catch (Exception e) {
            log.error("Failed to open LightBurn: {}", e.getMessage());
            throw new IOException("Failed to open LightBurn: " + e.getMessage());
        }
    }

    /**
     * Opens LightBurn with the default (no QR) template.
     */
    public void openLightBurn() throws IOException {
        openLightBurn(lightburnTemplate);
    }

    /**
     * Calculates the number of batches needed for a given number of items.
     */
    public int calculateBatchCount(int totalItems) {
        return (int) Math.ceil((double) totalItems / BATCH_SIZE);
    }

    /**
     * Gets the batch size.
     */
    public int getBatchSize() {
        return BATCH_SIZE;
    }

    /**
     * Gets the path to the generated CSV file.
     */
    public String getCsvFilePath() {
        return new File(engraverDataPath, csvFilename).getAbsolutePath();
    }
}
