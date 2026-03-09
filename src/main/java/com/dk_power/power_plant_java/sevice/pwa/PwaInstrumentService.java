package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.dto.instrumentation.InstrumentDto;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.entities.instrumentation.Instrument;
import com.dk_power.power_plant_java.mappers.instrumentation.InstrumentMapper;
import com.dk_power.power_plant_java.repository.instrumentation.InstrumentRepo;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.InstrumentSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PwaInstrumentService {

    private final InstrumentSharePointAdapter instrumentAdapter;
    private final InstrumentRepo instrumentRepo;
    private final InstrumentMapper instrumentMapper;

    public List<InstrumentDto> getAllInstruments() {
        try {
            List<InstrumentDto> spItems = instrumentAdapter.getAll();
            syncToH2(spItems);
            log.info("[PWA-Instrument] Fetched {} instruments from SharePoint", spItems.size());
            return spItems;
        } catch (Exception e) {
            log.warn("[PWA-Instrument] SP fetch failed, returning H2 cache: {}", e.getMessage());
            return instrumentRepo.findAll().stream()
                    .map(instrumentMapper::convertToDto)
                    .toList();
        }
    }

    @Transactional
    public PwaSubmissionResult createInstrument(InstrumentDto dto) {
        // Dedup by tagNumber
        Optional<Instrument> existing = instrumentRepo.findByTagNumber(dto.getTagNumber());
        if (existing.isPresent()) {
            log.info("[PWA-Instrument] Instrument already exists for tagNumber={}", dto.getTagNumber());
            return PwaSubmissionResult.duplicate(existing.get().getSharepointId(), dto.getLocalUuid());
        }

        // Save to H2
        Instrument entity = instrumentMapper.fromSharePointDto(dto);
        if (entity.getCurrentStatus() == null || entity.getCurrentStatus().isEmpty()) {
            entity.setCurrentStatus("Normal Operation");
        }
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
