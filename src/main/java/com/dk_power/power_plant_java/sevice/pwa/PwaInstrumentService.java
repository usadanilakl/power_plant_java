package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.dto.instrumentation.InstrumentDto;
import com.dk_power.power_plant_java.dto.pwa.PwaInstrumentStateDto;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.instrumentation.Instrument;
import com.dk_power.power_plant_java.mappers.instrumentation.InstrumentMapper;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.repository.instrumentation.InstrumentRepo;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.InstrumentSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PwaInstrumentService {

    private final InstrumentSharePointAdapter instrumentAdapter;
    private final InstrumentRepo instrumentRepo;
    private final EquipmentRepo equipmentRepo;
    private final InstrumentMapper instrumentMapper;
    private final Object bootstrapLock = new Object();

    /**
     * Serves the register from H2 — never from SharePoint on the request thread.
     *
     * <p>H2 is already the maintained mirror: {@code InstrumentSharePointSyncable} pulls SharePoint
     * changes on the hub's 30s orchestrator, and every non-hub node receives the same rows over
     * field-level CRDT sync. Probing SharePoint here (as this used to) duplicated that work on the
     * critical path of every phone opening the list, and serialized all callers behind one remote
     * round-trip. It also meant {@code /state} (computed from H2) could describe data that
     * {@code /get-all} did not serve; both now read the same source.</p>
     *
     * <p>The one case H2 cannot cover is a cold instance whose register was never populated — there
     * we bootstrap from SharePoint once, synchronously, so first run is not an empty list.</p>
     */
    public List<InstrumentDto> getAllInstruments() {
        if (instrumentRepo.count() == 0) {
            synchronized (bootstrapLock) {
                if (instrumentRepo.count() == 0) return bootstrapFromSharePoint();
            }
        }
        return getCachedInstruments();
    }

    /**
     * Instruments touched at or after {@code since} — the incremental half of the register sync.
     *
     * Every log submission rolls a summary onto its instrument row, which moves the register's
     * {@code lastModified} and therefore its version. Under the old full-pull-on-version-change rule
     * that meant one person logging anything forced every other device to re-download all ~3000 rows
     * on its next open (and, on the Power Automate fallback, to do it as a metered SharePoint sweep).
     * The delta carries only what actually moved — normally the single row that was just logged.
     *
     * <p>Deletions are deliberately not tracked here: soft-deleted rows vanish behind
     * {@code @Where(deleted IS NOT TRUE)} and would silently linger on the client. The client instead
     * compares its post-delta row count against {@code itemCount} from {@code /state} and falls back
     * to a full pull when they disagree, which covers deletes and any other drift for free.</p>
     */
    public List<InstrumentDto> getInstrumentsChangedSince(LocalDateTime since) {
        if (since == null) return getCachedInstruments();
        return instrumentRepo.findByDateModifiedGreaterThanEqualOrderByDateModifiedAsc(since).stream()
                .map(instrumentMapper::convertToDto)
                .toList();
    }

    public PwaInstrumentStateDto getInstrumentsState() {
        long count = instrumentRepo.count();
        String lastModified = instrumentRepo.findTopByOrderByDateModifiedDesc()
                .map(Instrument::getDateModified)
                .map(ldt -> ldt.atZone(ZoneOffset.UTC).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME))
                .orElse(null);
        String version = count + ":" + (lastModified != null ? lastModified : "none");
        return new PwaInstrumentStateDto(count, lastModified, version);
    }

    /**
     * Removes an instrument from SharePoint and soft-deletes it here.
     *
     * <p><b>Order is load-bearing.</b> SharePoint goes first: soft-deleting locally first would hide
     * the row behind {@code @Where(deleted = false)}, so the next SharePoint pull wouldn't find it by
     * tag and would cheerfully re-create it. If the SharePoint delete fails we abort without touching
     * the local row, for the same reason — a half-done delete resurrects itself.</p>
     *
     * <p>Locally this is the project's normal soft delete ({@code deleted = true} through JPA, so the
     * field-change listener fires and the removal reaches every desktop). In SharePoint it is a real
     * delete, which lands the item in the site Recycle Bin — restorable for 93 days, so the
     * recoverability a soft delete would buy is already there without teaching every consumer of the
     * list to filter a flag.</p>
     */
    @Transactional
    public void deleteInstrument(Long id) {
        Instrument entity = instrumentRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Instrument not found: " + id));

        String sharepointId = entity.getSharepointId();
        if (sharepointId != null && !sharepointId.isBlank()) {
            try {
                instrumentAdapter.delete(sharepointId);
                log.info("[PWA-Instrument] Deleted instrument from SharePoint: spId={}, tagNumber={}",
                        sharepointId, entity.getTagNumber());
            } catch (Exception e) {
                // Already gone remotely is success, not failure: a previous attempt that deleted in
                // SharePoint and then failed before committing the local flag would otherwise be
                // permanently unretryable, since every retry would 404 on the same missing item.
                if (isNotFound(e)) {
                    log.info("[PWA-Instrument] SharePoint item {} already absent; completing local delete", sharepointId);
                } else {
                    throw e;
                }
            }
        } else {
            log.info("[PWA-Instrument] Instrument {} has no SharePoint id; local soft delete only", id);
        }

        entity.setDeleted(true);
        instrumentRepo.save(entity);
        log.info("[PWA-Instrument] Soft-deleted instrument locally: id={}, tagNumber={}", id, entity.getTagNumber());
    }

    @Transactional
    public PwaSubmissionResult createInstrument(InstrumentDto dto) {
        String normalizedTag = normalizeTag(dto.getTagNumber());
        if (normalizedTag.isEmpty()) {
            return PwaSubmissionResult.failure("Tag number is required", dto.getLocalUuid());
        }

        dto.setTagNumber(normalizedTag);
        boolean mergeRequested = "merge".equalsIgnoreCase(dto.getMergePolicy());

        Optional<Instrument> existingInstrumentOpt = instrumentRepo.findByTagNumber(normalizedTag);
        Optional<Equipment> existingEquipmentOpt = equipmentRepo.findFirstActiveByTagNumberIgnoreCase(normalizedTag);

        if ((existingInstrumentOpt.isPresent() || existingEquipmentOpt.isPresent()) && !mergeRequested) {
            String conflictType = existingInstrumentOpt.isPresent() ? "instrument" : "equipment";
            String msg = existingInstrumentOpt.isPresent()
                    ? "Instrument with tag '" + normalizedTag + "' already exists. Merge to update existing record."
                    : "Equipment with tag '" + normalizedTag + "' exists. Merge is required to avoid duplicate tag collisions.";
            String spId = existingInstrumentOpt.map(Instrument::getSharepointId).orElse(null);
            return PwaSubmissionResult.mergeRequired(conflictType, msg, dto.getLocalUuid(), spId);
        }

        if (existingInstrumentOpt.isPresent()) {
            Instrument entity = existingInstrumentOpt.get();
            mergeInstrument(entity, dto);
            entity = instrumentRepo.saveAndFlush(entity);

            try {
                InstrumentDto mergedDto = instrumentMapper.convertToDto(entity);
                instrumentAdapter.upsertByTagNumber(mergedDto);
                log.info("[PWA-Instrument] Merged existing instrument and upserted to SP: tagNumber={}", normalizedTag);
            } catch (Exception e) {
                log.error("[PWA-Instrument] Merge saved locally but SP upsert failed for tagNumber={}: {}",
                        normalizedTag, e.getMessage());
            }

            PwaSubmissionResult merged = PwaSubmissionResult.success("merge", entity.getSharepointId(), dto.getLocalUuid());
            merged.setMessage("Instrument merged successfully");
            return merged;
        }

        // Save to H2 (new)
        Instrument entity = instrumentMapper.fromSharePointDto(dto);
        if (isBlank(entity.getCurrentStatus())) entity.setCurrentStatus("Normal Operation");
        entity = instrumentRepo.saveAndFlush(entity);
        log.info("[PWA-Instrument] Instrument saved locally: tagNumber={}", dto.getTagNumber());

        // Push to SP
        String sharepointId = null;
        String method = "local";
        try {
            sharepointId = instrumentAdapter.create(dto);
            if (sharepointId != null) {
                entity.setSharepointId(sharepointId);
                instrumentRepo.save(entity);
                method = "sharepoint";
                log.info("[PWA-Instrument] Instrument created in SP: tagNumber={}, spId={}",
                        dto.getTagNumber(), sharepointId);
            }
        } catch (Exception e) {
            log.error("[PWA-Instrument] Failed to push instrument to SP for tagNumber={}: {}",
                    dto.getTagNumber(), e.getMessage());
        }

        return PwaSubmissionResult.success(method, sharepointId, dto.getLocalUuid());
    }

    private static void mergeInstrument(Instrument entity, InstrumentDto dto) {
        setIfNotBlank(dto.getDescription(), entity::setDescription);
        setIfNotBlank(dto.getVendor(), entity::setVendor);
        setIfNotBlank(dto.getLocation(), entity::setLocation);
        setIfNotBlank(dto.getType(), entity::setType);
        setIfNotBlank(dto.getCurrentStatus(), entity::setCurrentStatus);
        setIfNotBlank(dto.getLastUpdatedDate(), entity::setLastUpdatedDate);
        setIfNotBlank(dto.getLastUpdatedTime(), entity::setLastUpdatedTime);
        setIfNotBlank(dto.getLastUpdatedBy(), entity::setLastUpdatedBy);
        setIfNotBlank(dto.getLastComment(), entity::setLastComment);
        setIfNotBlank(dto.getSharepointId(), entity::setSharepointId);
        setIfNotBlank(dto.getLocalUuid(), entity::setLocalUuid);
    }

    private static void setIfNotBlank(String value, java.util.function.Consumer<String> setter) {
        if (!isBlank(value)) setter.accept(value.trim());
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private static String normalizeTag(String tag) {
        return tag == null ? "" : tag.trim().toUpperCase();
    }

    /** True when a SharePoint failure means "the item isn't there", which a delete can treat as done. */
    private static boolean isNotFound(Throwable e) {
        for (Throwable t = e; t != null; t = t.getCause()) {
            String message = t.getMessage();
            if (message != null && (message.contains("404") || message.contains("Item does not exist"))) {
                return true;
            }
        }
        return false;
    }

    /**
     * One-time cold-start fill for an instance whose register is empty (fresh H2, no SharePoint
     * sync run yet, no CRDT catch-up yet). Steady-state refresh is the orchestrator's job.
     */
    private List<InstrumentDto> bootstrapFromSharePoint() {
        try {
            List<InstrumentDto> spItems = instrumentAdapter.getAll();
            syncToH2(spItems);
            log.info("[PWA-Instrument] Cold-start bootstrap from SharePoint: {} instruments", spItems.size());
            return getCachedInstruments();
        } catch (Exception e) {
            log.warn("[PWA-Instrument] Cold-start bootstrap failed, serving empty register: {}", e.getMessage());
            return getCachedInstruments();
        }
    }

    private List<InstrumentDto> getCachedInstruments() {
        return instrumentRepo.findAll(Sort.by(Sort.Direction.ASC, "tagNumber")).stream()
                .map(instrumentMapper::convertToDto)
                .toList();
    }

    private void syncToH2(List<InstrumentDto> spItems) {
        for (InstrumentDto dto : spItems) {
            if (dto.getTagNumber() == null || dto.getTagNumber().isEmpty()) continue;
            try {
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
                entity.setCurrentStatus(dto.getCurrentStatus());
                entity.setLastUpdatedDate(dto.getLastUpdatedDate());
                entity.setLastUpdatedTime(dto.getLastUpdatedTime());
                entity.setLastUpdatedBy(dto.getLastUpdatedBy());
                entity.setLastComment(dto.getLastComment());
                if (dto.getSharepointId() != null) {
                    entity.setSharepointId(dto.getSharepointId());
                }
                if (dto.getLocalUuid() != null) {
                    entity.setLocalUuid(dto.getLocalUuid());
                }
                instrumentRepo.save(entity);
            } catch (Exception e) {
                log.warn("[PWA-Instrument] Failed to sync instrument to H2: tagNumber={}, error={}",
                        dto.getTagNumber(), e.getMessage());
            }
        }
    }
}
