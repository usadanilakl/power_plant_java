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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PwaInstrumentService {

    private final InstrumentSharePointAdapter instrumentAdapter;
    private final InstrumentRepo instrumentRepo;
    private final EquipmentRepo equipmentRepo;
    private final InstrumentMapper instrumentMapper;
    private final Object instrumentRefreshLock = new Object();

    @Value("${pwa.instrument.full-refresh-hours:24}")
    private long fullRefreshHours;

    private volatile Instant lastFullRefreshAt;
    private volatile InstrumentSharePointAdapter.ProbeState lastProbeState;

    public List<InstrumentDto> getAllInstruments() {
        synchronized (instrumentRefreshLock) {
            if (mustFullRefreshByAge()) {
                return fetchFullFromSharePoint("age-window");
            }

            try {
                InstrumentSharePointAdapter.ProbeState currentProbe = instrumentAdapter.getProbeState();
                if (probeIndicatesChange(currentProbe)) {
                    return fetchFullFromSharePoint("probe-change");
                }

                log.info("[PWA-Instrument] Probe unchanged (count={}, lastModified={}); serving H2 cache",
                        currentProbe.itemCount(), currentProbe.lastModified());
                return getCachedInstruments();
            } catch (Exception e) {
                log.warn("[PWA-Instrument] Probe failed, serving H2 cache: {}", e.getMessage());
                return getCachedInstruments();
            }
        }
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

    private boolean mustFullRefreshByAge() {
        if (lastFullRefreshAt == null) return true;
        long hours = Math.max(1, fullRefreshHours);
        return Instant.now().isAfter(lastFullRefreshAt.plus(Duration.ofHours(hours)));
    }

    private boolean probeIndicatesChange(InstrumentSharePointAdapter.ProbeState currentProbe) {
        if (currentProbe == null) return true;
        if (lastProbeState == null) return true;
        if (currentProbe.itemCount() != lastProbeState.itemCount()) return true;
        return !Objects.equals(currentProbe.lastModified(), lastProbeState.lastModified());
    }

    private List<InstrumentDto> fetchFullFromSharePoint(String reason) {
        try {
            List<InstrumentDto> spItems = instrumentAdapter.getAll();
            syncToH2(spItems);

            lastFullRefreshAt = Instant.now();
            lastProbeState = buildProbeState(spItems);

            log.info("[PWA-Instrument] Full refresh complete (reason={}): {} instruments, probe={}/{}",
                    reason, spItems.size(), lastProbeState.itemCount(), lastProbeState.lastModified());
            return spItems;
        } catch (Exception e) {
            log.warn("[PWA-Instrument] Full refresh failed (reason={}), serving H2 cache: {}", reason, e.getMessage());
            return getCachedInstruments();
        }
    }

    private InstrumentSharePointAdapter.ProbeState buildProbeState(List<InstrumentDto> items) {
        Instant maxModified = items.stream()
                .map(InstrumentDto::getSpModifiedTime)
                .filter(Objects::nonNull)
                .max(Instant::compareTo)
                .orElse(null);
        return new InstrumentSharePointAdapter.ProbeState(items.size(), maxModified);
    }

    private List<InstrumentDto> getCachedInstruments() {
        return instrumentRepo.findAll().stream()
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
