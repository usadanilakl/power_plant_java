package com.dk_power.power_plant_java.sevice.instrumentation;

import com.dk_power.power_plant_java.dto.instrumentation.BulkUploadResult;
import com.dk_power.power_plant_java.dto.instrumentation.CounterpartCheckReportDto;
import com.dk_power.power_plant_java.dto.instrumentation.CounterpartCreateResultDto;
import com.dk_power.power_plant_java.dto.instrumentation.DuplicateCheckReportDto;
import com.dk_power.power_plant_java.dto.instrumentation.DuplicateMergeResultDto;
import com.dk_power.power_plant_java.dto.instrumentation.DuplicateTagGroupDto;
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
import java.time.Instant;
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
        return uploadToSharePoint(instruments, onConflictRaw, null);
    }

    public BulkUploadResult uploadToSharePoint(List<InstrumentDto> instruments, String onConflictRaw, String tagModeRaw) {
        BulkUploadResult result = new BulkUploadResult();
        List<InstrumentDto> transformedInstruments = transformByTagMode(instruments, tagModeRaw);
        result.setTotal(transformedInstruments.size());
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

        for (InstrumentDto dto : transformedInstruments) {
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

    public List<InstrumentDto> previewByTagMode(List<InstrumentDto> instruments, String tagModeRaw) {
        return transformByTagMode(instruments, tagModeRaw);
    }

    public CounterpartCheckReportDto checkCounterparts() {
        List<InstrumentDto> all = instrumentAdapter.getAll();
        return buildCounterpartReport(all);
    }

    public CounterpartCreateResultDto createMissingCounterparts() {
        CounterpartCreateResultDto result = new CounterpartCreateResultDto();

        List<InstrumentDto> all = instrumentAdapter.getAll();
        result.setReportBefore(buildCounterpartReport(all));

        Map<String, InstrumentDto> byTag = new LinkedHashMap<>();
        for (InstrumentDto dto : all) {
            String normalized = normalizeTag(dto.getTagNumber());
            if (!normalized.isBlank()) {
                byTag.put(normalized, dto);
            }
        }

        List<InstrumentDto> toCreate = computeMissingCounterparts(byTag);
        result.setAttempted(toCreate.size());

        for (InstrumentDto dto : toCreate) {
            try {
                String tag = normalizeTag(dto.getTagNumber());
                if (byTag.containsKey(tag)) {
                    result.setSkipped(result.getSkipped() + 1);
                    continue;
                }

                String spId = instrumentAdapter.create(dto);
                dto.setSharepointId(spId);
                byTag.put(tag, dto);
                upsertToH2(dto);
                result.setCreated(result.getCreated() + 1);
            } catch (Exception e) {
                result.setFailed(result.getFailed() + 1);
                result.getErrors().add(dto.getTagNumber() + ": " + e.getMessage());
                log.warn("[BulkUpload] Failed creating counterpart {}: {}", dto.getTagNumber(), e.getMessage());
            }
        }

        result.setReportAfter(buildCounterpartReport(new ArrayList<>(byTag.values())));
        return result;
    }

    public DuplicateCheckReportDto checkDuplicatesByTag() {
        List<InstrumentDto> all = instrumentAdapter.getAll();
        return buildDuplicateReport(all);
    }

    public DuplicateMergeResultDto mergeDuplicatesByTag() {
        DuplicateMergeResultDto result = new DuplicateMergeResultDto();
        List<InstrumentDto> all = instrumentAdapter.getAll();
        result.setReportBefore(buildDuplicateReport(all));

        Map<String, List<InstrumentDto>> groups = new LinkedHashMap<>();
        for (InstrumentDto dto : all) {
            String tag = normalizeTag(dto.getTagNumber());
            if (tag.isBlank()) continue;
            groups.computeIfAbsent(tag, ignored -> new ArrayList<>()).add(dto);
        }

        for (Map.Entry<String, List<InstrumentDto>> entry : groups.entrySet()) {
            String tag = entry.getKey();
            List<InstrumentDto> dupes = entry.getValue();
            if (dupes.size() <= 1) continue;

            try {
                InstrumentDto keeper = pickKeeper(dupes);
                InstrumentDto merged = mergeDuplicateGroup(dupes, keeper);
                instrumentAdapter.update(keeper.getSharepointId(), merged);
                upsertToH2(merged);

                for (InstrumentDto dto : dupes) {
                    if (Objects.equals(dto.getSharepointId(), keeper.getSharepointId())) continue;
                    instrumentAdapter.delete(dto.getSharepointId());
                    result.setDuplicatesDeleted(result.getDuplicatesDeleted() + 1);
                }

                result.setGroupsResolved(result.getGroupsResolved() + 1);
            } catch (Exception e) {
                result.setFailed(result.getFailed() + 1);
                result.getErrors().add(tag + ": " + e.getMessage());
                log.warn("[BulkUpload] Failed merging duplicate group '{}': {}", tag, e.getMessage());
            }
        }

        result.setReportAfter(buildDuplicateReport(instrumentAdapter.getAll()));
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

    private List<InstrumentDto> transformByTagMode(List<InstrumentDto> source, String tagModeRaw) {
        TagMode mode = TagMode.from(tagModeRaw);
        LinkedHashMap<String, InstrumentDto> deduped = new LinkedHashMap<>();

        for (InstrumentDto dto : source) {
            for (String tag : expandTagsByMode(normalizeTag(dto.getTagNumber()), mode)) {
                if (tag.isBlank()) continue;
                InstrumentDto copy = copyWithTag(dto, tag);
                deduped.merge(tag, copy, this::mergeDtos);
            }
        }
        log.info("[BulkUpload] Tag mode {} produced {} instruments from {} source rows",
                mode.name(), deduped.size(), source.size());
        return new ArrayList<>(deduped.values());
    }

    private DuplicateCheckReportDto buildDuplicateReport(List<InstrumentDto> source) {
        DuplicateCheckReportDto report = new DuplicateCheckReportDto();
        report.setTotalInstruments(source.size());

        Map<String, List<InstrumentDto>> byTag = new LinkedHashMap<>();
        for (InstrumentDto dto : source) {
            String tag = normalizeTag(dto.getTagNumber());
            if (tag.isBlank()) continue;
            byTag.computeIfAbsent(tag, ignored -> new ArrayList<>()).add(dto);
        }

        List<DuplicateTagGroupDto> groups = new ArrayList<>();
        int duplicateItems = 0;
        for (Map.Entry<String, List<InstrumentDto>> entry : byTag.entrySet()) {
            List<InstrumentDto> items = entry.getValue();
            if (items.size() <= 1) continue;
            DuplicateTagGroupDto group = new DuplicateTagGroupDto();
            group.setTagNumber(entry.getKey());
            group.setCount(items.size());
            List<String> ids = items.stream()
                    .map(InstrumentDto::getSharepointId)
                    .filter(Objects::nonNull)
                    .toList();
            group.getSharepointIds().addAll(ids);
            groups.add(group);
            duplicateItems += items.size();
        }

        report.setGroups(groups);
        report.setDuplicateGroupCount(groups.size());
        report.setDuplicateItemCount(duplicateItems);
        return report;
    }

    private InstrumentDto pickKeeper(List<InstrumentDto> dupes) {
        return dupes.stream()
                .min(Comparator.comparingInt(dto -> parseSpId(dto.getSharepointId())))
                .orElseThrow(() -> new IllegalStateException("No duplicate records to pick keeper"));
    }

    private InstrumentDto mergeDuplicateGroup(List<InstrumentDto> dupes, InstrumentDto keeper) {
        List<InstrumentDto> sorted = new ArrayList<>(dupes);
        sorted.sort((a, b) -> compareModifiedDesc(a.getSpModifiedTime(), b.getSpModifiedTime()));

        InstrumentDto merged = copyWithTag(keeper, normalizeTag(keeper.getTagNumber()));
        merged.setSharepointId(keeper.getSharepointId());
        merged.setLocalUuid(firstNonBlank(keeper.getLocalUuid(), null));

        merged.setDescription(firstNonBlankFrom(sorted, InstrumentDto::getDescription));
        merged.setVendor(firstNonBlankFrom(sorted, InstrumentDto::getVendor));
        merged.setLocation(firstNonBlankFrom(sorted, InstrumentDto::getLocation));
        merged.setType(firstNonBlankFrom(sorted, InstrumentDto::getType));
        merged.setCurrentStatus(firstNonBlankFrom(sorted, InstrumentDto::getCurrentStatus));
        merged.setLastUpdatedDate(firstNonBlankFrom(sorted, InstrumentDto::getLastUpdatedDate));
        merged.setLastUpdatedTime(firstNonBlankFrom(sorted, InstrumentDto::getLastUpdatedTime));
        merged.setLastUpdatedBy(firstNonBlankFrom(sorted, InstrumentDto::getLastUpdatedBy));
        merged.setLastComment(firstNonBlankFrom(sorted, InstrumentDto::getLastComment));
        return merged;
    }

    private static int compareModifiedDesc(Instant a, Instant b) {
        if (a == null && b == null) return 0;
        if (a == null) return 1;
        if (b == null) return -1;
        return b.compareTo(a);
    }

    private static int parseSpId(String raw) {
        if (raw == null || raw.isBlank()) return Integer.MAX_VALUE;
        try {
            return Integer.parseInt(raw.trim());
        } catch (Exception ignored) {
            return Integer.MAX_VALUE;
        }
    }

    private static String firstNonBlankFrom(List<InstrumentDto> source, java.util.function.Function<InstrumentDto, String> getter) {
        for (InstrumentDto dto : source) {
            String value = getter.apply(dto);
            if (value != null && !value.trim().isEmpty()) return value.trim();
        }
        return null;
    }

    private List<String> expandTagsByMode(String normalizedTag, TagMode mode) {
        if (normalizedTag.isBlank()) return List.of();

        return switch (mode) {
            case BASE_TO_U1_U2 -> List.of("01" + normalizedTag, "02" + normalizedTag);
            case COPY_U1_TO_U2 -> {
                if (normalizedTag.startsWith("01")) {
                    yield List.of(normalizedTag, "02" + normalizedTag.substring(2));
                }
                yield List.of(normalizedTag);
            }
            case COPY_U2_TO_U1 -> {
                if (normalizedTag.startsWith("02")) {
                    yield List.of(normalizedTag, "01" + normalizedTag.substring(2));
                }
                yield List.of(normalizedTag);
            }
            case AS_IS -> List.of(normalizedTag);
        };
    }

    private InstrumentDto copyWithTag(InstrumentDto dto, String tag) {
        InstrumentDto copy = new InstrumentDto();
        copy.setLocalUuid(dto.getLocalUuid());
        copy.setSharepointId(dto.getSharepointId());
        copy.setTagNumber(tag);
        copy.setDescription(dto.getDescription());
        copy.setVendor(dto.getVendor());
        copy.setLocation(dto.getLocation());
        copy.setType(dto.getType());
        copy.setCurrentStatus(dto.getCurrentStatus());
        copy.setLastUpdatedDate(dto.getLastUpdatedDate());
        copy.setLastUpdatedTime(dto.getLastUpdatedTime());
        copy.setLastUpdatedBy(dto.getLastUpdatedBy());
        copy.setLastComment(dto.getLastComment());
        return copy;
    }

    private CounterpartCheckReportDto buildCounterpartReport(List<InstrumentDto> source) {
        CounterpartCheckReportDto report = new CounterpartCheckReportDto();
        report.setTotalInstruments(source.size());

        Map<String, UnitPair> byBase = new LinkedHashMap<>();
        int totalUnitTagged = 0;

        for (InstrumentDto dto : source) {
            String tag = normalizeTag(dto.getTagNumber());
            if (!isUnitTag(tag)) continue;
            totalUnitTagged++;

            String base = tag.substring(2);
            UnitPair pair = byBase.computeIfAbsent(base, ignored -> new UnitPair());
            if (tag.startsWith("01")) {
                pair.unit01 = dto;
            } else if (tag.startsWith("02")) {
                pair.unit02 = dto;
            }
        }

        int pairedCount = 0;
        List<String> missing01 = new ArrayList<>();
        List<String> missing02 = new ArrayList<>();

        for (Map.Entry<String, UnitPair> entry : byBase.entrySet()) {
            String base = entry.getKey();
            UnitPair pair = entry.getValue();
            boolean has01 = pair.unit01 != null;
            boolean has02 = pair.unit02 != null;

            if (has01 && has02) {
                pairedCount++;
            } else if (has01) {
                missing02.add("02" + base);
            } else if (has02) {
                missing01.add("01" + base);
            }
        }

        report.setTotalUnitTagged(totalUnitTagged);
        report.setPairedBaseCount(pairedCount);
        report.setMissing01Count(missing01.size());
        report.setMissing02Count(missing02.size());
        report.setMissing01Tags(missing01);
        report.setMissing02Tags(missing02);
        return report;
    }

    private List<InstrumentDto> computeMissingCounterparts(Map<String, InstrumentDto> byTag) {
        Map<String, UnitPair> byBase = new LinkedHashMap<>();
        for (Map.Entry<String, InstrumentDto> entry : byTag.entrySet()) {
            String tag = normalizeTag(entry.getKey());
            if (!isUnitTag(tag)) continue;
            String base = tag.substring(2);
            UnitPair pair = byBase.computeIfAbsent(base, ignored -> new UnitPair());
            if (tag.startsWith("01")) {
                pair.unit01 = entry.getValue();
            } else if (tag.startsWith("02")) {
                pair.unit02 = entry.getValue();
            }
        }

        List<InstrumentDto> toCreate = new ArrayList<>();
        for (Map.Entry<String, UnitPair> entry : byBase.entrySet()) {
            String base = entry.getKey();
            UnitPair pair = entry.getValue();
            if (pair.unit01 != null && pair.unit02 == null) {
                toCreate.add(cloneForTag(pair.unit01, "02" + base));
            } else if (pair.unit02 != null && pair.unit01 == null) {
                toCreate.add(cloneForTag(pair.unit02, "01" + base));
            }
        }
        return toCreate;
    }

    private InstrumentDto cloneForTag(InstrumentDto source, String targetTag) {
        InstrumentDto dto = new InstrumentDto();
        dto.setTagNumber(normalizeTag(targetTag));
        dto.setDescription(source.getDescription());
        dto.setVendor(source.getVendor());
        dto.setLocation(source.getLocation());
        dto.setType(source.getType());
        dto.setCurrentStatus(source.getCurrentStatus());
        dto.setLastUpdatedDate(source.getLastUpdatedDate());
        dto.setLastUpdatedTime(source.getLastUpdatedTime());
        dto.setLastUpdatedBy(source.getLastUpdatedBy());
        dto.setLastComment(source.getLastComment());
        dto.setLocalUuid(null);
        dto.setSharepointId(null);
        return dto;
    }

    private static boolean isUnitTag(String tag) {
        return tag != null && tag.length() > 2 && (tag.startsWith("01") || tag.startsWith("02"));
    }

    private static class UnitPair {
        private InstrumentDto unit01;
        private InstrumentDto unit02;
    }

    private enum ConflictPolicy {
        MERGE,
        SKIP;

        static ConflictPolicy from(String raw) {
            if (raw != null && raw.equalsIgnoreCase("skip")) return SKIP;
            return MERGE;
        }
    }

    public enum TagMode {
        AS_IS,
        BASE_TO_U1_U2,
        COPY_U1_TO_U2,
        COPY_U2_TO_U1;

        static TagMode from(String raw) {
            if (raw == null || raw.isBlank()) return AS_IS;
            String val = raw.trim().toLowerCase(Locale.ROOT);
            return switch (val) {
                case "base_to_u1_u2", "base", "u1u2", "01_02" -> BASE_TO_U1_U2;
                case "copy_u1_to_u2", "01_to_02", "u1_to_u2" -> COPY_U1_TO_U2;
                case "copy_u2_to_u1", "02_to_01", "u2_to_u1" -> COPY_U2_TO_U1;
                default -> AS_IS;
            };
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
