package com.dk_power.power_plant_java.sevice.data_transfer;

import com.dk_power.power_plant_java.entities.loto.LotoPoint;
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
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ExcelWriterService {

    @Value("${project.root}")
    private String projectRoot;

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

public void writeLotoPointsToExcelTableWithLinks(String filePath, List<LotoPoint> data) {
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

    } catch (IOException e) {
        e.printStackTrace();
    }

    // Open the file (unchanged)
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
                .map(l -> Paths.get(projectRoot, l).toUri().toString())
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

    // Auto-size columns
    for (int i = 0; i < totalColumns; i++) {
        sheet.autoSizeColumn(i);
    }
}

    private void addSingleHyperlink(XSSFWorkbook workbook, XSSFCell cell, String fileLink, String linkText) {
        XSSFCreationHelper createHelper = workbook.getCreationHelper();
        XSSFHyperlink link = createHelper.createHyperlink(HyperlinkType.FILE);
        link.setAddress(fileLink);

        cell.setCellValue(linkText);
        cell.setHyperlink(link);
        cell.setCellStyle(workbook.getCellStyleAt((short)1)); // Use the hyperlink style created earlier
    }

    // ==================== FILE EXPORT ====================

    public void writeFilesToExcel(String filePath, List<com.dk_power.power_plant_java.entities.files.FileObject> data) {
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
                    String fullPath = Paths.get(projectRoot, file.getFileLink()).toUri().toString();
                    addSingleHyperlink(workbook, (XSSFCell) linkCell, fullPath, "Open File");
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

        } catch (IOException e) {
            e.printStackTrace();
        }

        // Open the file
        openExcelFile(filePath);
    }

    // ==================== LOTO STANDARD EXPORT ====================

    public void writeLotoStandardsToExcel(String filePath, List<com.dk_power.power_plant_java.entities.loto.LotoStandard> data) {
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

        } catch (IOException e) {
            e.printStackTrace();
        }

        // Open the file
        openExcelFile(filePath);
    }

    private void openExcelFile(String filePath) {
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

}