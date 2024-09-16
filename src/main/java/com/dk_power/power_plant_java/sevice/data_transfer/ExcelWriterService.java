package com.dk_power.power_plant_java.sevice.data_transfer;

import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.FileOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ExcelWriterService {

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
            headerData.put("Tag Number",lp.getTagNumber());
            headerData.put("Description",lp.getDescription());
            headerData.put("General Location",lp.getGeneralLocation());
            headerData.put("Specific Location",lp.getSpecificLocation());
            headerData.put("Iso Pos", lp.getIsoPos()!=null ? lp.getIsoPos().getName() : "Iso Pos Undefined");
            headerData.put("Nomr Pos",lp.getNormPos()!=null ? lp.getNormPos().getName() : "Norm Pos Undefined");
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
            rowData.put("Tag Number",p.getTagNumber());
            rowData.put("Description",p.getDescription());
            rowData.put("General Location",p.getGeneralLocation());
            rowData.put("Specific Location",p.getSpecificLocation());
            rowData.put("Iso Pos", p.getIsoPos()!=null ? p.getIsoPos().getName() : "Iso Pos Undefined");
            rowData.put("Nomr Pos",p.getNormPos()!=null ? p.getNormPos().getName() : "Norm Pos Undefined");
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
}