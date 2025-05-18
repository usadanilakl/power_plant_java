package com.dk_power.power_plant_java.sevice;

import com.dk_power.power_plant_java.entities.EtaProPoint;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class EtaProService {

    public EtaProPoint getPoint(String startTime, String endTime, String point) {

        EtaProPoint etaProPoint = new EtaProPoint();
        etaProPoint.setTagNumber(point);

        this.setPointData(startTime, endTime, point);
        this.openExcel("eta_pro.xlsm");
        Map<LocalDateTime, Long> pointData = this.getPointData("eta_pro.xlsm");
        etaProPoint.setData(pointData);
        return etaProPoint;

    }

    private void openExcel(String path) {
        File originalFile = new File(path);

        if (!originalFile.exists()) {
            System.err.println("File does not exist: " + originalFile.getAbsolutePath());
            return;
        }

        try {
            if (Desktop.isDesktopSupported()) {
                Desktop desktop = Desktop.getDesktop();
                if (desktop.isSupported(Desktop.Action.OPEN)) {
                    desktop.open(originalFile);
                    System.out.println("Excel file opened successfully.");
                } else {
                    System.err.println("Opening files is not supported on this platform.");
                }
            } else {
                System.err.println("Desktop is not supported on this platform.");
            }
        } catch (IOException e) {
            System.err.println("Error opening Excel file: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void setPointData(String startTime, String endTime, String point) {
        File file = new File("eta_pro.xlsm");
        FileInputStream fis = null;
        Workbook workbook = null;
        FileOutputStream fos = null;

        try {
            fis = new FileInputStream(file);
            workbook = new XSSFWorkbook(fis);
            Sheet sheet = workbook.getSheetAt(0);

            // Set A1 cell (startTime)
            setCellValue(sheet, 0, 0, startTime);

            // Set A2 cell (endTime)
            setCellValue(sheet, 1, 0, endTime);

            // Set B3 cell (point)
            setCellValue(sheet, 2, 1, point);

            // Save the changes
            fos = new FileOutputStream(file);
            workbook.write(fos);

            System.out.println("Excel file updated successfully.");

        } catch (IOException e) {
            System.err.println("Error updating Excel file: " + e.getMessage());
            e.printStackTrace();
        } finally {
            try {
                if (fis != null) fis.close();
                if (workbook != null) workbook.close();
                if (fos != null) fos.close();
            } catch (IOException e) {
                System.err.println("Error closing resources: " + e.getMessage());
            }
        }
    }

    private Map<LocalDateTime, Long> getPointData(String path) {
        Map<LocalDateTime, Long> data = new HashMap<>();
        File file = new File(path);
        FileInputStream fis = null;
        Workbook workbook = null;

        try {
            fis = new FileInputStream(file);
            workbook = WorkbookFactory.create(fis);
            Sheet sheet = workbook.getSheetAt(0);

            for (int rowNum = 3; rowNum <= sheet.getLastRowNum(); rowNum++) { // Start from row 4 (index 3)
                Row row = sheet.getRow(rowNum);
                if (row != null) {
                    Cell dateCell = row.getCell(0); // Column A
                    Cell valueCell = row.getCell(1); // Column B

                    if (dateCell != null && valueCell != null) {
                        LocalDateTime dateTime = null;
                        Long value = null;

                        // Parse date
                        if (dateCell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(dateCell)) {
                            dateTime = dateCell.getLocalDateTimeCellValue();
                        }

                        // Parse value
                        if (valueCell.getCellType() == CellType.NUMERIC) {
                            value = (long) valueCell.getNumericCellValue();
                        }

                        if (dateTime != null && value != null) {
                            data.put(dateTime, value);
                        }
                    }
                }
            }

        } catch (IOException e) {
            System.err.println("Error reading Excel file: " + e.getMessage());
            e.printStackTrace();
        } finally {
            try {
                if (workbook != null) workbook.close();
                if (fis != null) fis.close();
            } catch (IOException e) {
                System.err.println("Error closing resources: " + e.getMessage());
            }
        }

        return data;
    }

    private void setCellValue(Sheet sheet, int rowIndex, int colIndex, String value) {
        Row row = sheet.getRow(rowIndex);
        if (row == null) {
            row = sheet.createRow(rowIndex);
        }
        Cell cell = row.getCell(colIndex);
        if (cell == null) {
            cell = row.createCell(colIndex);
        }
        cell.setCellValue(value);
    }

}