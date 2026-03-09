package com.dk_power.power_plant_java.sevice.instrumentation;

import com.dk_power.power_plant_java.dto.instrumentation.BulkUploadResult;
import com.dk_power.power_plant_java.dto.instrumentation.InstrumentDto;
import com.dk_power.power_plant_java.entities.instrumentation.Instrument;
import com.dk_power.power_plant_java.mappers.instrumentation.InstrumentMapper;
import com.dk_power.power_plant_java.repository.instrumentation.InstrumentRepo;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.InstrumentSharePointAdapter;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class InstrumentBulkUploadService {

    private final InstrumentSharePointAdapter instrumentAdapter;
    private final InstrumentRepo instrumentRepo;
    private final InstrumentMapper instrumentMapper;

    public List<InstrumentDto> parseCSV(InputStream inputStream) throws Exception {
        List<InstrumentDto> results = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null) return results;

            String[] headers = headerLine.split(",");
            Map<String, Integer> headerMap = new LinkedHashMap<>();
            for (int i = 0; i < headers.length; i++) {
                headerMap.put(headers[i].trim().toLowerCase(), i);
            }

            String line;
            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] values = line.split(",", -1);
                InstrumentDto dto = mapRowToDto(headerMap, values);
                if (dto.getTagNumber() != null && !dto.getTagNumber().isEmpty()) {
                    results.add(dto);
                }
            }
        }
        log.info("[BulkUpload] Parsed {} instruments from CSV", results.size());
        return results;
    }

    public List<InstrumentDto> parseExcel(InputStream inputStream) throws Exception {
        List<InstrumentDto> results = new ArrayList<>();
        try (Workbook workbook = new XSSFWorkbook(inputStream)) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) return results;

            Row headerRow = sheet.getRow(0);
            if (headerRow == null) return results;

            Map<String, Integer> headerMap = new LinkedHashMap<>();
            for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                Cell cell = headerRow.getCell(i);
                if (cell != null) {
                    headerMap.put(getCellString(cell).trim().toLowerCase(), i);
                }
            }

            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                String[] values = new String[headerRow.getLastCellNum()];
                for (int c = 0; c < values.length; c++) {
                    Cell cell = row.getCell(c);
                    values[c] = cell != null ? getCellString(cell) : "";
                }
                InstrumentDto dto = mapRowToDto(headerMap, values);
                if (dto.getTagNumber() != null && !dto.getTagNumber().isEmpty()) {
                    results.add(dto);
                }
            }
        }
        log.info("[BulkUpload] Parsed {} instruments from Excel", results.size());
        return results;
    }

    public BulkUploadResult uploadToSharePoint(List<InstrumentDto> instruments) {
        BulkUploadResult result = new BulkUploadResult();
        result.setTotal(instruments.size());

        // Fetch all existing SP items once for efficient lookup
        Map<String, String> tagToSpId = new LinkedHashMap<>();
        try {
            List<InstrumentDto> existing = instrumentAdapter.getAll();
            for (InstrumentDto dto : existing) {
                if (dto.getTagNumber() != null) {
                    tagToSpId.put(dto.getTagNumber(), dto.getSharepointId());
                }
            }
        } catch (Exception e) {
            log.warn("[BulkUpload] Could not fetch existing SP items, will attempt creates only: {}", e.getMessage());
        }

        for (InstrumentDto dto : instruments) {
            try {
                String existingSpId = tagToSpId.get(dto.getTagNumber());
                if (existingSpId != null) {
                    instrumentAdapter.update(existingSpId, dto);
                    result.incrementUpdated();
                } else {
                    String newSpId = instrumentAdapter.create(dto);
                    dto.setSharepointId(newSpId);
                    result.incrementCreated();
                }
                // Also upsert to H2
                upsertToH2(dto);
            } catch (Exception e) {
                result.incrementFailed();
                result.addError(dto.getTagNumber() + ": " + e.getMessage());
                log.warn("[BulkUpload] Failed for tagNumber={}: {}", dto.getTagNumber(), e.getMessage());
            }
        }

        log.info("[BulkUpload] Complete: created={}, updated={}, failed={} of {} total",
                result.getCreated(), result.getUpdated(), result.getFailed(), result.getTotal());
        return result;
    }

    private void upsertToH2(InstrumentDto dto) {
        Optional<Instrument> existing = instrumentRepo.findByTagNumber(dto.getTagNumber());
        Instrument entity;
        if (existing.isPresent()) {
            entity = existing.get();
        } else {
            entity = new Instrument();
            entity.setTagNumber(dto.getTagNumber());
        }
        entity.setDescription(dto.getDescription());
        entity.setVendor(dto.getVendor());
        entity.setLocation(dto.getLocation());
        entity.setType(dto.getType());
        if (dto.getCurrentStatus() != null) entity.setCurrentStatus(dto.getCurrentStatus());
        if (dto.getSharepointId() != null) entity.setSharepointId(dto.getSharepointId());
        instrumentRepo.save(entity);
    }

    private InstrumentDto mapRowToDto(Map<String, Integer> headerMap, String[] values) {
        InstrumentDto dto = new InstrumentDto();
        dto.setTagNumber(getField(headerMap, values, "tagnumber", "tag number", "tag_number", "tagno"));
        dto.setDescription(getField(headerMap, values, "description", "desc"));
        dto.setVendor(getField(headerMap, values, "vendor", "manufacturer"));
        dto.setLocation(getField(headerMap, values, "location", "loc"));
        dto.setType(getField(headerMap, values, "type", "instrument type"));
        return dto;
    }

    private String getField(Map<String, Integer> headerMap, String[] values, String... possibleNames) {
        for (String name : possibleNames) {
            Integer idx = headerMap.get(name);
            if (idx != null && idx < values.length) {
                String val = values[idx].trim();
                if (!val.isEmpty()) return val;
            }
        }
        return "";
    }

    private String getCellString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }
}
