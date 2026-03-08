package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.dto.instrumentation.InstrumentDto;
import com.dk_power.power_plant_java.dto.instrumentation.InstrumentLogDto;
import com.dk_power.power_plant_java.dto.pwa.PwaInstrumentLogDto;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.entities.instrumentation.Instrument;
import com.dk_power.power_plant_java.entities.instrumentation.InstrumentLog;
import com.dk_power.power_plant_java.mappers.instrumentation.InstrumentLogMapper;
import com.dk_power.power_plant_java.mappers.instrumentation.InstrumentMapper;
import com.dk_power.power_plant_java.repository.instrumentation.InstrumentLogRepo;
import com.dk_power.power_plant_java.repository.instrumentation.InstrumentRepo;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.InstrumentLogSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.InstrumentSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PwaInstrumentLogService {

    private final InstrumentLogRepo instrumentLogRepo;
    private final InstrumentRepo instrumentRepo;
    private final InstrumentLogMapper logMapper;
    private final InstrumentMapper instrumentMapper;
    private final InstrumentLogSharePointAdapter logAdapter;
    private final InstrumentSharePointAdapter instrumentAdapter;

    @Transactional
    public PwaSubmissionResult submitInstrumentLog(PwaInstrumentLogDto dto) {
        // 1. Dedup by localUuid
        if (dto.getLocalUuid() != null && !dto.getLocalUuid().isEmpty()) {
            Optional<InstrumentLog> existing = instrumentLogRepo.findFirstByLocalUuidOrderByIdAsc(dto.getLocalUuid());
            if (existing.isPresent()) {
                log.info("[Instrument Submit] Duplicate detected for localUuid={}", dto.getLocalUuid());
                return PwaSubmissionResult.duplicate(existing.get().getSharepointId(), dto.getLocalUuid());
            }
        }

        // 2. Save InstrumentLog to H2
        InstrumentLog logEntity = logMapper.fromPwaDto(dto);
        logEntity = instrumentLogRepo.saveAndFlush(logEntity);
        log.info("[Instrument Submit] Log saved locally: id={}, localUuid={}, tagNumber={}",
                logEntity.getId(), dto.getLocalUuid(), dto.getInstrumentTagNumber());

        // 3. Upsert Instrument in H2 by tagNumber
        upsertInstrumentLocally(dto);

        // 4. Push to "Instrument Log" SP list
        String sharepointId = null;
        String method = "local";
        try {
            InstrumentLogDto logDto = logMapper.convertToDto(logEntity);
            sharepointId = logAdapter.create(logDto);
            if (sharepointId != null) {
                logEntity.setSharepointId(sharepointId);
                instrumentLogRepo.save(logEntity);
                method = "sharepoint";
                log.info("[Instrument Submit] Log created in SharePoint: spId={}, localUuid={}",
                        sharepointId, dto.getLocalUuid());
            }
        } catch (Exception e) {
            log.error("[Instrument Submit] Failed to push log to SharePoint for localUuid={}: {}",
                    dto.getLocalUuid(), e.getMessage());
        }

        // 5. Upsert "Instruments" SP list item
        try {
            Instrument instrument = instrumentRepo.findByTagNumber(dto.getInstrumentTagNumber()).orElse(null);
            if (instrument != null) {
                InstrumentDto instrumentDto = instrumentMapper.convertToDto(instrument);
                instrumentAdapter.upsertByTagNumber(instrumentDto);
            }
        } catch (Exception e) {
            log.error("[Instrument Submit] Failed to upsert instrument in SharePoint for tagNumber={}: {}",
                    dto.getInstrumentTagNumber(), e.getMessage());
        }

        return PwaSubmissionResult.success(method, sharepointId, dto.getLocalUuid());
    }

    private void upsertInstrumentLocally(PwaInstrumentLogDto dto) {
        Optional<Instrument> existing = instrumentRepo.findByTagNumber(dto.getInstrumentTagNumber());
        Instrument instrument;
        if (existing.isPresent()) {
            instrument = existing.get();
        } else {
            instrument = new Instrument();
            instrument.setTagNumber(dto.getInstrumentTagNumber());
        }
        instrument.setDescription(dto.getInstrumentDescription());
        instrument.setCurrentStatus(dto.getStatus());
        instrument.setLastUpdatedDate(dto.getDate());
        instrument.setLastUpdatedTime(dto.getTime());
        instrument.setLastUpdatedBy(dto.getName());
        instrument.setLastComment(dto.getComment());
        instrumentRepo.saveAndFlush(instrument);
        log.info("[Instrument Submit] Instrument upserted locally: tagNumber={}, status={}",
                dto.getInstrumentTagNumber(), dto.getStatus());
    }
}
