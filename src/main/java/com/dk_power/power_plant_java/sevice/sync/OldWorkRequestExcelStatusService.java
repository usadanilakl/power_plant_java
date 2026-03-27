package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointCertificateAccess;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;

/**
 * Best-effort status write-back for WRs that originated from the legacy
 * SharePoint-hosted Excel workbook.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OldWorkRequestExcelStatusService {

    private final SharePointCertificateAccess certAccess;

    @Value("${sharepoint.old-wr-excel.file-id:}")
    private String oldWrExcelFileId;

    @Value("${sharepoint.old-wr-excel.sheet-name:Current}")
    private String oldWrExcelSheetName;

    private static final String LOCAL_UUID_PREFIX = "OLD_EXCEL_";
    private static final String ID_COLUMN = "ID";
    private static final String STATUS_COLUMN = "Status";

    public void updateStatusIfBackedByOldExcel(WorkRequest workRequest, String newStatus) {
        if (workRequest == null || newStatus == null || newStatus.isBlank()) {
            return;
        }

        String localUuid = workRequest.getLocalUuid();
        if (localUuid == null || !localUuid.startsWith(LOCAL_UUID_PREFIX)) {
            return;
        }
        if (oldWrExcelFileId == null || oldWrExcelFileId.isBlank()) {
            return;
        }
        if (!certAccess.isAvailable()) {
            log.debug("[Old WR Excel] SharePoint certificate access unavailable, skipping status write-back");
            return;
        }

        String excelId = localUuid.substring(LOCAL_UUID_PREFIX.length());
        try {
            byte[] workbookBytes = certAccess.downloadFileByUniqueId(oldWrExcelFileId);
            byte[] updatedBytes = updateWorkbookStatus(workbookBytes, excelId, newStatus);
            certAccess.updateFileByUniqueId(oldWrExcelFileId, updatedBytes);
            log.info("[Old WR Excel] Updated old Excel WR id={} to status={}", excelId, newStatus);
        } catch (Exception e) {
            log.warn("[Old WR Excel] Failed to update status for old Excel WR id={} to {}: {}",
                excelId, newStatus, e.getMessage());
        }
    }

    private byte[] updateWorkbookStatus(byte[] workbookBytes, String excelId, String newStatus) throws Exception {
        try (ByteArrayInputStream bis = new ByteArrayInputStream(workbookBytes);
             Workbook workbook = new XSSFWorkbook(bis);
             ByteArrayOutputStream bos = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.getSheet(oldWrExcelSheetName);
            if (sheet == null) {
                throw new IllegalArgumentException("Sheet '" + oldWrExcelSheetName + "' not found");
            }

            Row headerRow = sheet.getRow(sheet.getFirstRowNum());
            if (headerRow == null) {
                throw new IllegalArgumentException("Workbook is missing a header row");
            }

            int idColumnIndex = findColumnIndex(headerRow, ID_COLUMN);
            int statusColumnIndex = findColumnIndex(headerRow, STATUS_COLUMN);
            if (idColumnIndex < 0 || statusColumnIndex < 0) {
                throw new IllegalArgumentException("Required columns not found in old WR Excel");
            }

            boolean updated = false;
            for (int i = headerRow.getRowNum() + 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) {
                    continue;
                }

                String rowId = normalizeExcelId(readCellAsString(row.getCell(idColumnIndex, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK)));
                if (!excelId.equals(rowId)) {
                    continue;
                }

                Cell statusCell = row.getCell(statusColumnIndex, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
                statusCell.setCellType(CellType.STRING);
                statusCell.setCellValue(newStatus);
                updated = true;
                break;
            }

            if (!updated) {
                throw new IllegalArgumentException("Old WR Excel row not found for ID=" + excelId);
            }

            workbook.write(bos);
            return bos.toByteArray();
        }
    }

    private int findColumnIndex(Row headerRow, String columnName) {
        for (Cell cell : headerRow) {
            if (columnName.equalsIgnoreCase(readCellAsString(cell).trim())) {
                return cell.getColumnIndex();
            }
        }
        return -1;
    }

    private String readCellAsString(Cell cell) {
        if (cell == null) {
            return "";
        }
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> DateUtil.isCellDateFormatted(cell)
                ? cell.getDateCellValue().toString()
                : String.valueOf(cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> cell.getCellFormula();
            default -> "";
        };
    }

    private String normalizeExcelId(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return "";
        }
        try {
            return new BigDecimal(rawValue).toBigInteger().toString();
        } catch (NumberFormatException ignored) {
            return rawValue.trim();
        }
    }
}
