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

    public BulkUploadResult uploadToSharePoint(List<InstrumentDto> instruments, String onConflictRaw) {
        BulkUploadResult result = new BulkUploadResult();
        result.setTotal(instruments.size());
        ConflictPolicy conflictPolicy = ConflictPolicy.from(onConflictRaw);

        // Fetch all existing SP items once for efficient lookup
        Map<String, InstrumentDto> existingByTag = new LinkedHashMap<>();
        try {
            List<InstrumentDto> existing = instrumentAdapter.getAll();
            for (InstrumentDto dto : existing) {
                if (dto.getTagNumber() != null) {
                    existingByTag.put(normalizeTag(dto.getTagNumber()), dto);
                }
            }
        } catch (Exception e) {
            log.warn("[BulkUpload] Could not fetch existing SP items, will attempt creates only: {}", e.getMessage());
        }

        for (InstrumentDto dto : instruments) {
            try {
                dto.setTagNumber(normalizeTag(dto.getTagNumber()));
                if (dto.getTagNumber().isEmpty()) {
                    result.incrementSkipped();
                    continue;
                }

                InstrumentDto existing = existingByTag.get(dto.getTagNumber());
                if (existing != null) {
                    if (conflictPolicy == ConflictPolicy.SKIP) {
                        result.incrementSkipped();
                        continue;
                    }

                    InstrumentDto merged = mergeDtos(existing, dto);
                    instrumentAdapter.update(existing.getSharepointId(), merged);
                    merged.setSharepointId(existing.getSharepointId());
                    existingByTag.put(merged.getTagNumber(), merged);
                    upsertToH2(merged);
                    result.incrementUpdated();
                } else {
                    String newSpId = instrumentAdapter.create(dto);
                    dto.setSharepointId(newSpId);
                    existingByTag.put(dto.getTagNumber(), dto);
                    upsertToH2(dto);
                    result.incrementCreated();
                }
            } catch (Exception e) {
                result.incrementFailed();
                result.addError(dto.getTagNumber() + ": " + e.getMessage());
                log.warn("[BulkUpload] Failed for tagNumber={}: {}", dto.getTagNumber(), e.getMessage());
            }
        }

        log.info("[BulkUpload] Complete: created={}, updated={}, skipped={}, failed={} of {} total",
                result.getCreated(), result.getUpdated(), result.getSkipped(), result.getFailed(), result.getTotal());
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
        setIfNotBlank(dto.getDescription(), entity::setDescription);
        setIfNotBlank(dto.getVendor(), entity::setVendor);
        setIfNotBlank(dto.getLocation(), entity::setLocation);
        setIfNotBlank(dto.getType(), entity::setType);
        setIfNotBlank(dto.getCurrentStatus(), entity::setCurrentStatus);
        setIfNotBlank(dto.getSharepointId(), entity::setSharepointId);
        instrumentRepo.save(entity);
    }

    private InstrumentDto mergeDtos(InstrumentDto base, InstrumentDto incoming) {
        InstrumentDto merged = new InstrumentDto();
        merged.setTagNumber(normalizeTag(base.getTagNumber()));
        merged.setSharepointId(base.getSharepointId());
        merged.setLocalUuid(firstNonBlank(incoming.getLocalUuid(), base.getLocalUuid()));
        merged.setDescription(firstNonBlank(incoming.getDescription(), base.getDescription()));
        merged.setVendor(firstNonBlank(incoming.getVendor(), base.getVendor()));
        merged.setLocation(firstNonBlank(incoming.getLocation(), base.getLocation()));
        merged.setType(firstNonBlank(incoming.getType(), base.getType()));
        merged.setCurrentStatus(firstNonBlank(incoming.getCurrentStatus(), base.getCurrentStatus()));
        merged.setLastUpdatedDate(firstNonBlank(incoming.getLastUpdatedDate(), base.getLastUpdatedDate()));
        merged.setLastUpdatedTime(firstNonBlank(incoming.getLastUpdatedTime(), base.getLastUpdatedTime()));
        merged.setLastUpdatedBy(firstNonBlank(incoming.getLastUpdatedBy(), base.getLastUpdatedBy()));
        merged.setLastComment(firstNonBlank(incoming.getLastComment(), base.getLastComment()));
        return merged;
    }

    private static void setIfNotBlank(String value, java.util.function.Consumer<String> setter) {
        if (value != null && !value.trim().isEmpty()) {
            setter.accept(value.trim());
        }
    }

    private static String firstNonBlank(String first, String fallback) {
        if (first != null && !first.trim().isEmpty()) return first.trim();
        return fallback;
    }

    private static String normalizeTag(String tag) {
        return tag == null ? "" : tag.trim().toUpperCase();
    }

    private enum ConflictPolicy {
        MERGE,
        SKIP;

        static ConflictPolicy from(String raw) {
            if (raw != null && raw.equalsIgnoreCase("skip")) return SKIP;
            return MERGE;
        }
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
