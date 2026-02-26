package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.dto.permits.WorkRequestDto;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.mappers.permits.WorkRequestMapper;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.data_transfer.ExcelReaderService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointCertificateAccess;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.WorkRequestSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Temporary scheduled service that downloads the old Work Request Excel file
 * from SharePoint and merges missing items into the current system (H2 DB + new SharePoint list).
 * Remove this service once the old Excel sheet is fully retired.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OldWorkRequestMigrationService {

    private final SharePointCertificateAccess certAccess;
    private final ExcelReaderService excelReaderService;
    private final WorkRequestRepo workRequestRepo;
    private final WorkRequestMapper workRequestMapper;
    private final NgValueService valueService;
    private final WorkRequestSharePointAdapter wrAdapter;
    private final SyncConfig syncConfig;
    @Lazy private final CentralSyncService centralSyncService;

    @Value("${sharepoint.old-wr-excel.file-id:}")
    private String oldWrExcelFileId;

    @Value("${sharepoint.old-wr-excel.sheet-name:Current}")
    private String oldWrExcelSheetName;

    private static final String LOCAL_UUID_PREFIX = "OLD_EXCEL_";

    @Scheduled(fixedDelay = 300000, initialDelay = 120000) // every 5 min, 2 min initial delay
    @Transactional
    public void migrateFromOldFlow() {
        if (oldWrExcelFileId == null || oldWrExcelFileId.isBlank()) return;
        if (!certAccess.isAvailable()) return;
        if (!syncConfig.isHubMode()) return;

        log.info("[Old WR Migration] Starting migration pull from SharePoint Excel file");

        byte[] fileBytes;
        try {
            fileBytes = certAccess.downloadFileByUniqueId(oldWrExcelFileId);
        } catch (Exception e) {
            log.error("[Old WR Migration] Failed to download Excel from SharePoint: {}", e.getMessage());
            return;
        }

        List<Map<String, String>> rows;
        try {
            rows = excelReaderService.readExcelFromBytes(fileBytes, oldWrExcelSheetName);
        } catch (Exception e) {
            log.error("[Old WR Migration] Failed to parse Excel file: {}", e.getMessage());
            return;
        }

        // Log column headers from first row to verify mapping
        if (!rows.isEmpty()) {
            log.info("[Old WR Migration] Excel columns: {}", rows.get(0).keySet());
            log.info("[Old WR Migration] First row sample: {}", rows.get(0));
        }

        int created = 0, skipped = 0, failed = 0;

        for (Map<String, String> row : rows) {
            String excelId = row.get("ID");
            if (excelId == null || excelId.isBlank()) {
                skipped++;
                continue;
            }

            // POI returns large numbers in scientific notation (e.g. "2.0260223E13")
            // Convert to plain string without decimals
            try {
                excelId = new BigDecimal(excelId).toBigInteger().toString();
            } catch (NumberFormatException ignored) {
                // Not a number — use as-is
            }

            String syntheticUuid = LOCAL_UUID_PREFIX + excelId;

            if (workRequestRepo.findFirstByLocalUuidOrderByIdAsc(syntheticUuid).isPresent()) {
                skipped++;
                continue;
            }

            try {
                WorkRequestDto dto = mapFromExcelRow(row);
                dto.setLocalUuid(syntheticUuid);

                String status = dto.getStatus();
                if (status == null || status.isBlank()) status = "Active";

                WorkRequest entity = workRequestMapper.fromSharePointDto(dto);
                entity.setPermitStatus(valueService.createValue("Permit Status", status));
                workRequestRepo.save(entity);

                // Push to new SharePoint list (only if DateOfWork is present — SP requires it)
                if (dto.getDateOfWorkToBePerformed() != null && !dto.getDateOfWorkToBePerformed().isBlank()) {
                    try {
                        String newSpId = wrAdapter.create(dto);
                        if (newSpId != null) {
                            entity.setSharepointId(newSpId);
                            workRequestRepo.save(entity);
                        }
                    } catch (Exception e) {
                        log.warn("[Old WR Migration] H2 created but SP push failed for OLD_EXCEL_{}: {}",
                                excelId, e.getMessage());
                    }
                } else {
                    log.debug("[Old WR Migration] Skipping SP push for OLD_EXCEL_{} — no DateOfWork", excelId);
                }

                created++;
                log.debug("[Old WR Migration] Created WR from old Excel id={}, localUuid={}",
                        excelId, syntheticUuid);
            } catch (Exception e) {
                failed++;
                log.error("[Old WR Migration] Failed to migrate old Excel id={}: {}",
                        excelId, e.getMessage());
            }
        }

        log.info("[Old WR Migration] Done. total={}, created={}, skipped={}, failed={}",
                rows.size(), created, skipped, failed);
    }

    private WorkRequestDto mapFromExcelRow(Map<String, String> row) {
        WorkRequestDto dto = new WorkRequestDto();

        // Date and time are separate columns in the Excel
        String dateRaw = row.get("Date of work to be performed");
        if (dateRaw != null && !dateRaw.isBlank()) {
            try {
                // POI returns Date.toString() for date cells (e.g. "Mon Feb 24 00:00:00 CST 2026")
                SimpleDateFormat javeDateFmt = new SimpleDateFormat("EEE MMM dd HH:mm:ss zzz yyyy", Locale.US);
                Date parsed = javeDateFmt.parse(dateRaw);
                dto.setDateOfWorkToBePerformed(new SimpleDateFormat("yyyy-MM-dd").format(parsed));
            } catch (ParseException e) {
                // Might be text like "2/24/2026"
                try {
                    SimpleDateFormat shortFmt = new SimpleDateFormat("M/d/yyyy", Locale.US);
                    Date parsed = shortFmt.parse(dateRaw);
                    dto.setDateOfWorkToBePerformed(new SimpleDateFormat("yyyy-MM-dd").format(parsed));
                } catch (ParseException e2) {
                    dto.setDateOfWorkToBePerformed(dateRaw);
                }
            }
        }

        String timeRaw = row.get("Time of work to be performed");
        dto.setTimeOfWorkToBePerformed(timeRaw != null ? timeRaw.trim() : "");

        dto.setRequestedBy(row.get("Work Requested By"));
        dto.setCompany(row.get("Company"));
        dto.setLocation(row.get("Location Of Work"));
        dto.setAffectedEquipment(row.get("Affected Equipment"));
        dto.setWorkScope(row.get("Work Scope"));
        dto.setIsLotoRequired(row.get("Is LOTO Required?"));
        dto.setIsHotWorkRequired(row.get("Is Hot Work Required (welding, cutting, griding, open flame, sparks)"));
        dto.setIsConfinedSpaceEntryRequired(row.get("Is Confined Space Entry Required?"));
        dto.setForeman(row.get("Foreman Name"));
        dto.setFireWatch(row.get("Fire-watch Name"));
        dto.setSpace(row.get("Space to be entered"));
        // Don't store old Excel ID as sharepointId — it's not a SP list item ID.
        // New SP ID will be set after wrAdapter.create() succeeds.
        dto.setStatus(row.get("Status"));
        return dto;
    }
}
