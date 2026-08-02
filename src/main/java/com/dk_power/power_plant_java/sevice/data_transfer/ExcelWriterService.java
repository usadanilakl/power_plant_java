package com.dk_power.power_plant_java.sevice.data_transfer;

import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import org.apache.poi.common.usermodel.HyperlinkType;
import org.apache.poi.ss.SpreadsheetVersion;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.AreaReference;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.ss.util.CellReference;
import org.apache.poi.xssf.usermodel.*;
import org.openxmlformats.schemas.spreadsheetml.x2006.main.CTTable;
import org.openxmlformats.schemas.spreadsheetml.x2006.main.CTTableColumn;
import org.openxmlformats.schemas.spreadsheetml.x2006.main.CTTableColumns;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ExcelWriterService {

    @Value("${project.root}")
    private String projectRoot;

    /**
     * Absolute filesystem root under which uploaded files live —
     * repo-launched hub resolves to something like
     * {@code C:/repo/uploads-prod}; Electron desktop to
     * {@code C:/ProgramData/DK Power Manager/managed_apps/pid/uploads-prod}.
     * Same property every other file-serving service reads
     * ({@code NgFileService.filesRootPath} etc.) so an Excel
     * hyperlink built here points at the SAME file the running
     * backend serves, regardless of which profile/launcher created
     * the export.
     */
    @Value("${files.root.path}")
    private String filesRootPath;

    /**
     * Resolve a DB {@code fileLink} (e.g. {@code "uploads/jpg/PID/x.jpg"})
     * to a {@code file:///} URI that Excel opens via the Windows shell
     * in the recipient's default app. Mirrors {@link
     * com.dk_power.power_plant_java.sevice.angular.file.NgFileService#resolveToFileSystem}
     * for the filesystem-resolution half — the first path segment is
     * a LOGICAL prefix (the URL-side "/uploads/") that must be stripped
     * before resolving against the profile-specific storage root, or
     * links point at non-existent paths under launchers whose
     * working-dir isn't the repo root (Electron, standalone JAR).
     * <p>
     * URI form (not the raw Windows path): Apache POI's
     * {@code XSSFHyperlink.setAddress()} calls {@code new URI(...)}
     * to validate. A backslash-containing Windows path throws
     * URISyntaxException ("illegal character in opaque part at index
     * 2"). {@link java.nio.file.Path#toUri()} produces a properly
     * escaped {@code file:///C:/...} URI that POI accepts and Excel
     * opens the same way the previous FILE hyperlinks did.
     */
    private String resolveFileUri(String fileLink) {
        if (fileLink == null || fileLink.isBlank()) return "";
        String normalized = fileLink.replace("\\", "/");
        int firstSlash = normalized.indexOf('/');
        String relative = firstSlash >= 0 ? normalized.substring(firstSlash + 1) : normalized;
        return Paths.get(filesRootPath).resolve(relative).toAbsolutePath().toUri().toString();
    }

    public void writeMapToExcel(String filePath, List<Map<String, String>> data) {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Sheet1");

        // Create header row
        if (!data.isEmpty()) {
            Row headerRow = sheet.createRow(0);
            Map<String, String> headerData = data.get(0);
            int headerColNum = 0;
            for (String key : headerData.keySet()) {
                Cell cell = headerRow.createCell(headerColNum++);
                cell.setCellValue(key);
            }
        }

        // Create data rows
        int rowNum = 1;
        for (Map<String, String> rowData : data) {
            Row row = sheet.createRow(rowNum++);
            int colNum = 0;
            for (String field : rowData.values()) {
                Cell cell = row.createCell(colNum++);
                cell.setCellValue(field);
            }
        }

        try (FileOutputStream outputStream = new FileOutputStream(filePath)) {
            workbook.write(outputStream);
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            try {
                workbook.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    public void writeLotoPointsToExcel(String filePath, List<LotoPoint> data) {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Sheet1");

        // Create header row
        if (!data.isEmpty()) {
            Row headerRow = sheet.createRow(0);
            LotoPoint lp = data.get(0);
            Map<String, String> headerData = new HashMap<>();
            headerData.put("Tag Number", lp.getTagNumber());
            headerData.put("Description", lp.getDescription());
            headerData.put("General Location", lp.getGeneralLocation());
            headerData.put("Specific Location", lp.getSpecificLocation());
            headerData.put("Iso Pos", lp.getIsoPos() != null ? lp.getIsoPos().getName() : "Iso Pos Undefined");
            headerData.put("Nomr Pos", lp.getNormPos() != null ? lp.getNormPos().getName() : "Norm Pos Undefined");
            int headerColNum = 0;
            for (String key : headerData.keySet()) {
                Cell cell = headerRow.createCell(headerColNum++);
                cell.setCellValue(key);
            }
        }

        // Create data rows
        int rowNum = 1;
        for (LotoPoint p : data) {
            Map<String, String> rowData = new HashMap<>();
            rowData.put("Tag Number", p.getTagNumber());
            rowData.put("Description", p.getDescription());
            rowData.put("General Location", p.getGeneralLocation());
            rowData.put("Specific Location", p.getSpecificLocation());
            rowData.put("Iso Pos", p.getIsoPos() != null ? p.getIsoPos().getName() : "Iso Pos Undefined");
            rowData.put("Nomr Pos", p.getNormPos() != null ? p.getNormPos().getName() : "Norm Pos Undefined");
            Row row = sheet.createRow(rowNum++);
            int colNum = 0;
            for (String field : rowData.values()) {
                Cell cell = row.createCell(colNum++);
                cell.setCellValue(field);
            }
        }

        try (FileOutputStream outputStream = new FileOutputStream(filePath)) {
            workbook.write(outputStream);
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            try {
                workbook.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    public void writeLotoPointsToExcelTable(String filePath, List<LotoPoint> data) {
        XSSFWorkbook workbook = null;
        try {
            workbook = new XSSFWorkbook();
            XSSFSheet sheet = workbook.createSheet("Sheet1");

            // Create header row
            if (!data.isEmpty()) {
                Row headerRow = sheet.createRow(0);
                String[] headers = {"Tag Number", "Description", "General Location", "Specific Location", "Iso Pos", "Nomr Pos"};
                for (int i = 0; i < headers.length; i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(headers[i]);
                }
            }

            // Create data rows
            int rowNum = 1;
            for (LotoPoint p : data) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(p.getTagNumber());
                row.createCell(1).setCellValue(p.getDescription());
                row.createCell(2).setCellValue(p.getGeneralLocation());
                row.createCell(3).setCellValue(p.getSpecificLocation());
                row.createCell(4).setCellValue(p.getIsoPos() != null ? p.getIsoPos().getName() : "Iso Pos Undefined");
                row.createCell(5).setCellValue(p.getNormPos() != null ? p.getNormPos().getName() : "Norm Pos Undefined");
            }

            // Create the table
            XSSFTable table = sheet.createTable(new AreaReference(
                    new CellReference(0, 0),
                    new CellReference(data.size(), 5),
                    SpreadsheetVersion.EXCEL2007
            ));

            // Set table style
            table.setName("Table1");
            table.setDisplayName("Table1");
            table.setStyleName("TableStyleMedium2");
            table.getCTTable().addNewAutoFilter();

            // Auto-size columns
            for (int i = 0; i < 6; i++) {
                sheet.autoSizeColumn(i);
            }

            // Write the output to a file
            try (FileOutputStream outputStream = new FileOutputStream(filePath)) {
                workbook.write(outputStream);
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if (workbook != null) {
                try {
                    workbook.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
        // Open the file
        if (Desktop.isDesktopSupported()) {
            Desktop desktop = Desktop.getDesktop();
            File file = new File(filePath);
            if (file.exists()) {
                try {
                    Thread.sleep(1000);
                    desktop.open(file);
                } catch (IOException | InterruptedException e) {
                    throw new RuntimeException(e);
                }
            }
        }
    }

//    public void writeLotoPointsToExcelTableWithLinks(String filePath, List<LotoPoint> data) {
//        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
//            XSSFSheet sheet = workbook.createSheet("Sheet1");
//
//            // Create a cell style for hyperlinks
//            XSSFCellStyle hlinkStyle = workbook.createCellStyle();
//            XSSFFont hlinkFont = workbook.createFont();
//            hlinkFont.setUnderline(XSSFFont.U_SINGLE);
//            hlinkFont.setColor(IndexedColors.BLUE.getIndex());
//            hlinkStyle.setFont(hlinkFont);
//
//            // Determine the maximum number of file links
//            int maxFileLinkColumns = data.stream()
//                    .mapToInt(p -> p.getFileLinks().size())
//                    .max()
//                    .orElse(0);
//
//            // Create header row
//            Row headerRow = sheet.createRow(0);
//            String[] fixedHeaders = {"Tag Number", "Description", "General Location", "Specific Location", "Iso Pos", "Norm Pos"};
//            int totalColumns = fixedHeaders.length + maxFileLinkColumns;
//
//            for (int i = 0; i < totalColumns; i++) {
//                Cell cell = headerRow.createCell(i);
//                if (i < fixedHeaders.length) {
//                    cell.setCellValue(fixedHeaders[i]);
//                } else {
//                    cell.setCellValue("File Link " + (i - fixedHeaders.length + 1));
//                }
//            }
//
//            // Create data rows
//            int rowNum = 1;
//            for (LotoPoint p : data) {
//                Row row = sheet.createRow(rowNum++);
//                row.createCell(0).setCellValue(p.getTagNumber());
//                row.createCell(1).setCellValue(p.getDescription());
//                row.createCell(2).setCellValue(p.getGeneralLocation());
//                row.createCell(3).setCellValue(p.getSpecificLocation());
//                row.createCell(4).setCellValue(p.getIsoPos() != null ? p.getIsoPos().getName() : "Iso Pos Undefined");
//                row.createCell(5).setCellValue(p.getNormPos() != null ? p.getNormPos().getName() : "Norm Pos Undefined");
//
//                List<String> fileLinks = p.getFileLinks().stream()
//                        .map(l -> Paths.get(projectRoot, l).toUri().toString())
//                        .toList();
//
//                for (int i = 0; i < maxFileLinkColumns; i++) {
//                    Cell linkCell = row.createCell(fixedHeaders.length + i);
//                    if (i < fileLinks.size()) {
//                        addSingleHyperlink(workbook, (XSSFCell)linkCell, fileLinks.get(i), "File " + (i + 1));
//                    } else {
//                        linkCell.setCellValue("");
//                    }
//                }
//            }
//
//            // Create the table
//            XSSFTable table = sheet.createTable(new AreaReference(
//                    new CellReference(0, 0),
//                    new CellReference(data.size(), totalColumns - 1),
//                    SpreadsheetVersion.EXCEL2007
//            ));
//
//            // Set table style
//            table.setName("Table1");
//            table.setDisplayName("Table1");
//            table.setStyleName("TableStyleMedium2");
//
//            // Ensure the table structure matches the data
//            CTTable ctTable = table.getCTTable();
//            CTTableColumns columns = ctTable.getTableColumns();
//            columns.setCount(totalColumns);
//
//            // Remove existing column definitions
//            while (columns.getTableColumnList().size() > 0) {
//                columns.removeTableColumn(0);
//            }
//
//            // Add correct column definitions
//            for (int i = 0; i < totalColumns; i++) {
//                CTTableColumn column = columns.addNewTableColumn();
//                column.setId(i + 1);
//                if (i < fixedHeaders.length) {
//                    column.setName(fixedHeaders[i]);
//                } else {
//                    column.setName("File Link " + (i - fixedHeaders.length + 1));
//                }
//            }
//
//            // Adjust the table range
//            ctTable.setRef(new CellRangeAddress(0, data.size(), 0, totalColumns - 1).formatAsString());
//
//            // Add auto filter
//            ctTable.addNewAutoFilter().setRef(new CellRangeAddress(0, 0, 0, totalColumns - 1).formatAsString());
//
//            // Auto-size columns
//            for (int i = 0; i < totalColumns; i++) {
//                sheet.autoSizeColumn(i);
//            }
//
//            // Write the output to a file
//            try (FileOutputStream outputStream = new FileOutputStream(filePath)) {
//                workbook.write(outputStream);
//            }
//
//        } catch (IOException e) {
//            e.printStackTrace();
//        }
//
//        // Open the file
//        if (Desktop.isDesktopSupported()) {
//            Desktop desktop = Desktop.getDesktop();
//            File file = new File(filePath);
//            if (file.exists()) {
//                try {
//                    Thread.sleep(1000);
//                    desktop.open(file);
//                } catch (IOException | InterruptedException e) {
//                    throw new RuntimeException(e);
//                }
//            }
//        }
//    }

public void writeLotoPointsToExcelTableWithLinks(String filePath, List<LotoPoint> data) throws IOException {
    try (XSSFWorkbook workbook = new XSSFWorkbook()) {
        XSSFSheet sheetWithEquipment = workbook.createSheet("Processed");
        XSSFSheet sheetWithoutEquipment = workbook.createSheet("Unprocessed");

        // Separate the data into two lists
        List<LotoPoint> pointsWithEquipment = data.stream()
                .filter(p -> p.getEquipmentList() != null && !p.getEquipmentList().isEmpty())
                .collect(Collectors.toList());
        List<LotoPoint> pointsWithoutEquipment = data.stream()
                .filter(p -> p.getEquipmentList() == null || p.getEquipmentList().isEmpty())
                .collect(Collectors.toList());

        // Write data to respective sheets
        writeDataToSheet(workbook, sheetWithEquipment, pointsWithEquipment);
        writeDataToSheet(workbook, sheetWithoutEquipment, pointsWithoutEquipment);

        // Write the output to a file
        try (FileOutputStream outputStream = new FileOutputStream(filePath)) {
            workbook.write(outputStream);
        }
    }

    openExcelFile(filePath);
}

private void writeDataToSheet(XSSFWorkbook workbook, XSSFSheet sheet, List<LotoPoint> data) {
    // Create a cell style for hyperlinks
    XSSFCellStyle hlinkStyle = workbook.createCellStyle();
    XSSFFont hlinkFont = workbook.createFont();
    hlinkFont.setUnderline(XSSFFont.U_SINGLE);
    hlinkFont.setColor(IndexedColors.BLUE.getIndex());
    hlinkStyle.setFont(hlinkFont);

    // Determine the maximum number of file links
    int maxFileLinkColumns = data.stream()
            .mapToInt(p -> p.getFileLinks().size())
            .max()
            .orElse(0);

    // Create header row
    Row headerRow = sheet.createRow(0);
    String[] fixedHeaders = {"Tag Number", "Description", "General Location", "Specific Location", "Iso Pos", "Norm Pos"};
    int totalColumns = fixedHeaders.length + maxFileLinkColumns;

    for (int i = 0; i < totalColumns; i++) {
        Cell cell = headerRow.createCell(i);
        if (i < fixedHeaders.length) {
            cell.setCellValue(fixedHeaders[i]);
        } else {
            cell.setCellValue("File Link " + (i - fixedHeaders.length + 1));
        }
    }

    // Create data rows
    int rowNum = 1;
    for (LotoPoint p : data) {
        Row row = sheet.createRow(rowNum++);
        row.createCell(0).setCellValue(p.getTagNumber());
        row.createCell(1).setCellValue(p.getDescription());
        row.createCell(2).setCellValue(p.getGeneralLocation());
        row.createCell(3).setCellValue(p.getSpecificLocation());
        row.createCell(4).setCellValue(p.getIsoPos() != null ? p.getIsoPos().getName() : "Iso Pos Undefined");
        row.createCell(5).setCellValue(p.getNormPos() != null ? p.getNormPos().getName() : "Norm Pos Undefined");

        List<String> fileLinks = p.getFileLinks().stream()
                .map(this::resolveFileUri)
                .toList();

        for (int i = 0; i < maxFileLinkColumns; i++) {
            Cell linkCell = row.createCell(fixedHeaders.length + i);
            if (i < fileLinks.size()) {
                addSingleHyperlink(workbook, (XSSFCell)linkCell, fileLinks.get(i), "File " + (i + 1));
            } else {
                linkCell.setCellValue("");
            }
        }
    }

    // Only create table if there's data (POI requires at least 2 rows: header + 1 data row)
    if (!data.isEmpty()) {
        // Create the table and set its properties
        XSSFTable table = sheet.createTable(new AreaReference(
                new CellReference(0, 0),
                new CellReference(data.size(), totalColumns - 1),
                SpreadsheetVersion.EXCEL2007
        ));

        // Set table style
        table.setName("Table" + sheet.getSheetName().replaceAll("\\s+", ""));
        table.setDisplayName("Table" + sheet.getSheetName().replaceAll("\\s+", ""));
        table.setStyleName("TableStyleMedium2");

        // Ensure the table structure matches the data
        CTTable ctTable = table.getCTTable();
        CTTableColumns columns = ctTable.getTableColumns();
        columns.setCount(totalColumns);

        // Remove existing column definitions
        while (columns.getTableColumnList().size() > 0) {
            columns.removeTableColumn(0);
        }

        // Add correct column definitions
        for (int i = 0; i < totalColumns; i++) {
            CTTableColumn column = columns.addNewTableColumn();
            column.setId(i + 1);
            if (i < fixedHeaders.length) {
                column.setName(fixedHeaders[i]);
            } else {
                column.setName("File Link " + (i - fixedHeaders.length + 1));
            }
        }

        // Adjust the table range
        ctTable.setRef(new CellRangeAddress(0, data.size(), 0, totalColumns - 1).formatAsString());

        // Add auto filter
        ctTable.addNewAutoFilter().setRef(new CellRangeAddress(0, 0, 0, totalColumns - 1).formatAsString());
    }

    // Auto-size columns
    for (int i = 0; i < totalColumns; i++) {
        sheet.autoSizeColumn(i);
    }
}

    /**
     * Add a local-file hyperlink to a cell. Type FILE with a
     * {@code file:///} URI — POI's {@code XSSFHyperlink.setAddress}
     * runs the address through {@code new URI(...)}, which rejects
     * raw Windows paths ("Illegal character in opaque part" on the
     * first backslash). Compose the URI via
     * {@link #resolveFileUri(String)} first — it strips the logical
     * "uploads/" prefix, resolves against the profile-specific
     * storage root, and URI-encodes properly. Excel then opens the
     * link via the Windows shell in the recipient's default app
     * (browser for HTML, Acrobat for PDF, etc.).
     */
    private void addSingleHyperlink(XSSFWorkbook workbook, XSSFCell cell, String uri, String linkText) {
        XSSFCreationHelper createHelper = workbook.getCreationHelper();
        XSSFHyperlink link = createHelper.createHyperlink(HyperlinkType.FILE);
        link.setAddress(uri);

        cell.setCellValue(linkText);
        cell.setHyperlink(link);
        cell.setCellStyle(workbook.getCellStyleAt((short)1)); // Use the hyperlink style created earlier
    }

    // ==================== FILE EXPORT ====================

    public void writeFilesToExcel(String filePath, List<com.dk_power.power_plant_java.entities.files.FileObject> data) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            XSSFSheet sheet = workbook.createSheet("Files");

            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"File Number", "Name", "File Type", "System", "Related Systems", "Vendor", "File Link"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            // Create data rows
            int rowNum = 1;
            for (com.dk_power.power_plant_java.entities.files.FileObject file : data) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(file.getFileNumber() != null ? file.getFileNumber() : "");
                row.createCell(1).setCellValue(file.getName() != null ? file.getName() : "");
                row.createCell(2).setCellValue(file.getFileType() != null ? file.getFileType().getName() : "");
                row.createCell(3).setCellValue(file.getSystem() != null ? file.getSystem().getName() : "");
                row.createCell(4).setCellValue(file.getRelatedSystems() != null ? file.getRelatedSystems() : "");
                row.createCell(5).setCellValue(file.getVendor() != null ? file.getVendor().getName() : "");

                // Add file link as hyperlink
                Cell linkCell = row.createCell(6);
                if (file.getFileLink() != null && !file.getFileLink().isEmpty()) {
                    String url = resolveFileUri(file.getFileLink());
                    addSingleHyperlink(workbook, (XSSFCell) linkCell, url, "Open File");
                } else {
                    linkCell.setCellValue("");
                }
            }

            // Create table
            if (!data.isEmpty()) {
                XSSFTable table = sheet.createTable(new AreaReference(
                        new CellReference(0, 0),
                        new CellReference(data.size(), headers.length - 1),
                        SpreadsheetVersion.EXCEL2007
                ));
                table.setName("FilesTable");
                table.setDisplayName("FilesTable");
                table.setStyleName("TableStyleMedium2");
                table.getCTTable().addNewAutoFilter();
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // Write file
            try (FileOutputStream outputStream = new FileOutputStream(filePath)) {
                workbook.write(outputStream);
            }
        }

        openExcelFile(filePath);
    }

    // ==================== WORK REQUEST EXPORT ====================

    public void writeWorkRequestsToExcel(String filePath, List<com.dk_power.power_plant_java.entities.permits.WorkRequest> data) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            XSSFSheet sheet = workbook.createSheet("Work Requests");

            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {
                "ID", "Date", "Time", "Requested By", "Company", "Location",
                "Affected Equipment", "Work Scope", "Hot Work Required",
                "Foreman", "Fire Watch", "LOTO Required",
                "Confined Space Entry Required", "Space", "Status"
            };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            // Create data rows
            int rowNum = 1;
            for (com.dk_power.power_plant_java.entities.permits.WorkRequest wr : data) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(wr.getId() != null ? wr.getId().toString() : "");
                row.createCell(1).setCellValue(wr.getDateOfWorkToBePerformed() != null ? wr.getDateOfWorkToBePerformed() : "");
                row.createCell(2).setCellValue(wr.getTimeOfWorkToBePerformed() != null ? wr.getTimeOfWorkToBePerformed() : "");
                row.createCell(3).setCellValue(wr.getRequestedBy() != null ? wr.getRequestedBy() : "");
                row.createCell(4).setCellValue(wr.getCompany() != null ? wr.getCompany() : "");
                row.createCell(5).setCellValue(wr.getLocation() != null ? wr.getLocation() : "");
                row.createCell(6).setCellValue(wr.getAffectedEquipment() != null ? wr.getAffectedEquipment() : "");
                row.createCell(7).setCellValue(wr.getWorkScope() != null ? wr.getWorkScope() : "");
                row.createCell(8).setCellValue(wr.getIsHotWorkRequired() != null && wr.getIsHotWorkRequired() ? "Yes" : "No");
                row.createCell(9).setCellValue(wr.getForeman() != null ? wr.getForeman() : "");
                row.createCell(10).setCellValue(wr.getFireWatch() != null ? wr.getFireWatch() : "");
                row.createCell(11).setCellValue(wr.getIsLotoRequired() != null && wr.getIsLotoRequired() ? "Yes" : "No");
                row.createCell(12).setCellValue(wr.getIsConfinedSpaceEntryRequired() != null && wr.getIsConfinedSpaceEntryRequired() ? "Yes" : "No");
                row.createCell(13).setCellValue(wr.getSpace() != null ? wr.getSpace() : "");
                row.createCell(14).setCellValue(wr.getPermitStatus() != null ? wr.getPermitStatus().getName() : "");
            }

            // Create table
            if (!data.isEmpty()) {
                XSSFTable table = sheet.createTable(new AreaReference(
                        new CellReference(0, 0),
                        new CellReference(data.size(), headers.length - 1),
                        SpreadsheetVersion.EXCEL2007
                ));
                table.setName("WorkRequestsTable");
                table.setDisplayName("WorkRequestsTable");
                table.setStyleName("TableStyleMedium2");
                table.getCTTable().addNewAutoFilter();
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // Write file
            try (FileOutputStream outputStream = new FileOutputStream(filePath)) {
                workbook.write(outputStream);
            }
        }

        openExcelFile(filePath);
    }

    // ==================== LOTO STANDARD EXPORT ====================

    public void writeLotoStandardsToExcel(String filePath, List<com.dk_power.power_plant_java.entities.loto.LotoStandard> data) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            XSSFSheet sheet = workbook.createSheet("LOTO Standards");

            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"ID", "Description", "Groups", "LOTO Points Count"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            // Create data rows
            int rowNum = 1;
            for (com.dk_power.power_plant_java.entities.loto.LotoStandard standard : data) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(standard.getId() != null ? standard.getId().toString() : "");
                row.createCell(1).setCellValue(standard.getDescription() != null ? standard.getDescription() : "");

                // Groups as comma-separated names
                String groups = standard.getGroups() != null ?
                        standard.getGroups().stream()
                                .map(g -> g.getName() != null ? g.getName() : "")
                                .filter(name -> !name.isEmpty())
                                .collect(java.util.stream.Collectors.joining(", ")) : "";
                row.createCell(2).setCellValue(groups);

                // LOTO points count
                int lotoPointsCount = standard.getLotoPoints() != null ? standard.getLotoPoints().size() : 0;
                row.createCell(3).setCellValue(lotoPointsCount);
            }

            // Create table
            if (!data.isEmpty()) {
                XSSFTable table = sheet.createTable(new AreaReference(
                        new CellReference(0, 0),
                        new CellReference(data.size(), headers.length - 1),
                        SpreadsheetVersion.EXCEL2007
                ));
                table.setName("LotoStandardsTable");
                table.setDisplayName("LotoStandardsTable");
                table.setStyleName("TableStyleMedium2");
                table.getCTTable().addNewAutoFilter();
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // Write file
            try (FileOutputStream outputStream = new FileOutputStream(filePath)) {
                workbook.write(outputStream);
            }
        }

        openExcelFile(filePath);
    }

    // ==================== LOTO STANDARD COMPACT EXPORT ====================

    public void writeLotoStandardsCompact(String filePath, List<LotoStandard> data) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            writeSummarySheet(workbook, data);

            XSSFSheet detailSheet = workbook.createSheet("LOTO Points");

            // Determine max file link columns across ALL standards' points
            int maxFileLinks = 0;
            for (LotoStandard standard : data) {
                List<LotoPoint> points = standard.getLotoPoints();
                if (points != null) {
                    for (LotoPoint p : points) {
                        int count = p.getFileLinks().size();
                        if (count > maxFileLinks) maxFileLinks = count;
                    }
                }
            }

            // Fixed headers with standard reference columns
            String[] fixedHeaders = {"Standard ID", "Standard Description",
                    "Tag Number", "Description", "General Location", "Specific Location", "Iso Pos", "Norm Pos",
                    "Zero Energy"};
            int totalColumns = fixedHeaders.length + maxFileLinks;

            // Write header row
            Row headerRow = detailSheet.createRow(0);
            for (int i = 0; i < totalColumns; i++) {
                Cell cell = headerRow.createCell(i);
                if (i < fixedHeaders.length) {
                    cell.setCellValue(fixedHeaders[i]);
                } else {
                    cell.setCellValue("File Link " + (i - fixedHeaders.length + 1));
                }
            }

            // Write all LOTO points across all standards
            int rowNum = 1;
            for (LotoStandard standard : data) {
                List<LotoPoint> points = standard.getLotoPoints();
                if (points == null || points.isEmpty()) continue;
                rowNum = writeStandardLotoPointRows(workbook, detailSheet, standard, points, rowNum, fixedHeaders.length, maxFileLinks);
            }

            // Create table if there's data
            int dataRows = rowNum - 1;
            if (dataRows > 0) {
                createTableForSheet(detailSheet, "LotoPointsDetail", dataRows, totalColumns);
            }

            // Auto-size columns
            for (int i = 0; i < totalColumns; i++) {
                detailSheet.autoSizeColumn(i);
            }

            // Write file
            try (FileOutputStream outputStream = new FileOutputStream(filePath)) {
                workbook.write(outputStream);
            }
        }

        openExcelFile(filePath);
    }

    // ==================== LOTO STANDARD DETAILED EXPORT ====================

    public void writeLotoStandardsDetailed(String filePath, List<LotoStandard> data) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            writeSummarySheet(workbook, data);

            Set<String> usedSheetNames = new HashSet<>();
            int sheetIndex = 0;

            for (LotoStandard standard : data) {
                List<LotoPoint> points = standard.getLotoPoints();
                if (points == null || points.isEmpty()) continue;

                sheetIndex++;
                String sheetName = sanitizeSheetName(standard.getDescription(), sheetIndex, usedSheetNames);
                usedSheetNames.add(sheetName);

                XSSFSheet sheet = workbook.createSheet(sheetName);

                // Determine max file links for this standard's points
                int maxFileLinks = 0;
                for (LotoPoint p : points) {
                    int count = p.getFileLinks().size();
                    if (count > maxFileLinks) maxFileLinks = count;
                }

                String[] fixedHeaders = {"Standard ID", "Standard Description",
                        "Tag Number", "Description", "General Location", "Specific Location", "Iso Pos", "Norm Pos"};
                int totalColumns = fixedHeaders.length + maxFileLinks;

                // Write header row
                Row headerRow = sheet.createRow(0);
                for (int i = 0; i < totalColumns; i++) {
                    Cell cell = headerRow.createCell(i);
                    if (i < fixedHeaders.length) {
                        cell.setCellValue(fixedHeaders[i]);
                    } else {
                        cell.setCellValue("File Link " + (i - fixedHeaders.length + 1));
                    }
                }

                // Write LOTO point rows
                int rowNum = writeStandardLotoPointRows(workbook, sheet, standard, points, 1, fixedHeaders.length, maxFileLinks);

                // Create table
                int dataRows = rowNum - 1;
                if (dataRows > 0) {
                    String tableName = "Table_" + sheetIndex;
                    createTableForSheet(sheet, tableName, dataRows, totalColumns);
                }

                // Auto-size columns
                for (int i = 0; i < totalColumns; i++) {
                    sheet.autoSizeColumn(i);
                }
            }

            // Write file
            try (FileOutputStream outputStream = new FileOutputStream(filePath)) {
                workbook.write(outputStream);
            }
        }

        openExcelFile(filePath);
    }

    // ==================== SHARED HELPERS ====================

    private void writeSummarySheet(XSSFWorkbook workbook, List<LotoStandard> data) {
        XSSFSheet sheet = workbook.createSheet("Summary");

        Row headerRow = sheet.createRow(0);
        String[] headers = {"ID", "Description", "Groups", "LOTO Points Count"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
        }

        int rowNum = 1;
        for (LotoStandard standard : data) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(standard.getId() != null ? standard.getId().toString() : "");
            row.createCell(1).setCellValue(standard.getDescription() != null ? standard.getDescription() : "");

            String groups = standard.getGroups() != null ?
                    standard.getGroups().stream()
                            .map(g -> g.getName() != null ? g.getName() : "")
                            .filter(name -> !name.isEmpty())
                            .collect(Collectors.joining(", ")) : "";
            row.createCell(2).setCellValue(groups);

            int lotoPointsCount = standard.getLotoPoints() != null ? standard.getLotoPoints().size() : 0;
            row.createCell(3).setCellValue(lotoPointsCount);
        }

        if (!data.isEmpty()) {
            XSSFTable table = sheet.createTable(new AreaReference(
                    new CellReference(0, 0),
                    new CellReference(data.size(), headers.length - 1),
                    SpreadsheetVersion.EXCEL2007
            ));
            table.setName("SummaryTable");
            table.setDisplayName("SummaryTable");
            table.setStyleName("TableStyleMedium2");
            table.getCTTable().addNewAutoFilter();
        }

        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private int writeStandardLotoPointRows(XSSFWorkbook workbook, XSSFSheet sheet,
                                           LotoStandard standard, List<LotoPoint> points,
                                           int startRow, int fixedHeaderCount, int maxFileLinks) {
        String stdId = standard.getId() != null ? standard.getId().toString() : "";
        String stdDesc = standard.getDescription() != null ? standard.getDescription() : "";

        int rowNum = startRow;
        for (LotoPoint p : points) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(stdId);
            row.createCell(1).setCellValue(stdDesc);
            row.createCell(2).setCellValue(p.getTagNumber() != null ? p.getTagNumber() : "");
            row.createCell(3).setCellValue(p.getDescription() != null ? p.getDescription() : "");
            row.createCell(4).setCellValue(p.getGeneralLocation() != null ? p.getGeneralLocation() : "");
            row.createCell(5).setCellValue(p.getSpecificLocation() != null ? p.getSpecificLocation() : "");
            row.createCell(6).setCellValue(p.getIsoPos() != null ? p.getIsoPos().getName() : "");
            row.createCell(7).setCellValue(p.getNormPos() != null ? p.getNormPos().getName() : "");
            // Zero Energy: built phrase with equipment tag substitutions already resolved.
            // ZeroEnergy.getMethod() is the built phrase; falls back to the denormalized
            // LotoPoint.zeroEnergyMethod copy if the join isn't loaded.
            String zeroEnergy = "";
            if (p.getZeroEnergy() != null && p.getZeroEnergy().getMethod() != null) {
                zeroEnergy = p.getZeroEnergy().getMethod();
            } else if (p.getZeroEnergyMethod() != null) {
                zeroEnergy = p.getZeroEnergyMethod();
            }
            row.createCell(8).setCellValue(zeroEnergy);

            // File hyperlinks: HTTP URL to the file served by this
            // backend (via {@link #toFileHttpUrl}). Excel treats these
            // as URL hyperlinks — they open in the default browser
            // without a security prompt and work from ANY machine that
            // can reach the hub, not just the one that ran the export.
            // The earlier file:// / local-path attempts either got
            // blocked by Excel security or only worked when the
            // recipient had a local copy at the same path.
            List<String> fileLinks = p.getFileLinks().stream()
                    .map(this::resolveFileUri)
                    .toList();

            for (int i = 0; i < maxFileLinks; i++) {
                Cell linkCell = row.createCell(fixedHeaderCount + i);
                if (i < fileLinks.size()) {
                    addSingleHyperlink(workbook, (XSSFCell) linkCell, fileLinks.get(i), "File " + (i + 1));
                } else {
                    linkCell.setCellValue("");
                }
            }
        }
        return rowNum;
    }

    private void createTableForSheet(XSSFSheet sheet, String tableName, int dataRows, int totalColumns) {
        XSSFTable table = sheet.createTable(new AreaReference(
                new CellReference(0, 0),
                new CellReference(dataRows, totalColumns - 1),
                SpreadsheetVersion.EXCEL2007
        ));

        // Sanitize table name (Excel: no spaces, max 255 chars)
        String safeName = tableName.replaceAll("[^a-zA-Z0-9_]", "_");
        if (safeName.length() > 255) safeName = safeName.substring(0, 255);
        table.setName(safeName);
        table.setDisplayName(safeName);
        table.setStyleName("TableStyleMedium2");

        CTTable ctTable = table.getCTTable();
        CTTableColumns columns = ctTable.getTableColumns();
        columns.setCount(totalColumns);

        // Remove existing column definitions
        while (columns.getTableColumnList().size() > 0) {
            columns.removeTableColumn(0);
        }

        // Build header names from the first row of the sheet
        Row headerRow = sheet.getRow(0);
        for (int i = 0; i < totalColumns; i++) {
            CTTableColumn column = columns.addNewTableColumn();
            column.setId(i + 1);
            if (headerRow != null && headerRow.getCell(i) != null) {
                column.setName(headerRow.getCell(i).getStringCellValue());
            } else {
                column.setName("Column" + (i + 1));
            }
        }

        ctTable.setRef(new CellRangeAddress(0, dataRows, 0, totalColumns - 1).formatAsString());
        ctTable.addNewAutoFilter().setRef(new CellRangeAddress(0, 0, 0, totalColumns - 1).formatAsString());
    }

    private String sanitizeSheetName(String description, int index, Set<String> usedNames) {
        if (description == null || description.trim().isEmpty()) {
            description = "Standard " + index;
        }
        // Remove invalid sheet name characters
        String name = description.replaceAll("[\\\\/:*?\\[\\]]", " ").trim();
        // Truncate to 31 chars (Excel limit)
        if (name.length() > 31) {
            name = name.substring(0, 31);
        }
        // Deduplicate
        String baseName = name;
        int suffix = 2;
        while (usedNames.contains(name)) {
            String sfx = " (" + suffix + ")";
            int maxBase = 31 - sfx.length();
            name = (baseName.length() > maxBase ? baseName.substring(0, maxBase) : baseName) + sfx;
            suffix++;
        }
        return name;
    }

    private void openExcelFile(String filePath) {
        File file = new File(filePath);
        if (!file.exists()) return;
        try {
            if (System.getProperty("os.name", "").toLowerCase().contains("win")) {
                Runtime.getRuntime().exec(new String[]{"cmd", "/c", "start", "", file.getAbsolutePath()});
            } else if (Desktop.isDesktopSupported()) {
                Desktop.getDesktop().open(file);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

}