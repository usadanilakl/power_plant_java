package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.dto.instrumentation.InstrumentDto;
import com.dk_power.power_plant_java.dto.instrumentation.InstrumentLogDto;
import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import com.dk_power.power_plant_java.dto.pwa.PwaInstrumentLogDto;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.entities.instrumentation.Instrument;
import com.dk_power.power_plant_java.entities.instrumentation.InstrumentLog;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.mappers.instrumentation.InstrumentLogMapper;
import com.dk_power.power_plant_java.mappers.instrumentation.InstrumentMapper;
import com.dk_power.power_plant_java.repository.instrumentation.InstrumentLogRepo;
import com.dk_power.power_plant_java.repository.instrumentation.InstrumentRepo;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.InstrumentLogSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.InstrumentSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
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
    private final PermitAttachmentRepo attachmentRepo;

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

        // 3. Save attachments locally
        if (dto.getAttachments() != null) {
            for (PaAttachmentDto att : dto.getAttachments()) {
                PermitAttachment attachment = new PermitAttachment();
                attachment.setEntityType("InstrumentLog");
                attachment.setEntityId(logEntity.getId());
                attachment.setFileName(att.getFileName());
                attachment.setContentType(att.getContentType());
                attachment.setBase64Content(att.getBase64Content());
                attachment.setAttachmentType(guessAttachmentType(att.getContentType()));
                attachment.setContentHash(computeContentHash(att.getBase64Content()));
                attachmentRepo.save(attachment);
            }
            log.info("[Instrument Submit] Saved {} attachments for localUuid={}", dto.getAttachments().size(), dto.getLocalUuid());
        }

        // 4. Upsert Instrument in H2 by tagNumber
        upsertInstrumentLocally(dto);

        // 5. Push to "Instrumentation Log" SP list
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

                // Upload attachments to SharePoint
                if (dto.getAttachments() != null) {
                    for (PaAttachmentDto att : dto.getAttachments()) {
                        try {
                            logAdapter.addAttachment(sharepointId, att);
                        } catch (Exception attEx) {
                            log.warn("[Instrument Submit] Failed to upload attachment {} to SharePoint: {}",
                                    att.getFileName(), attEx.getMessage());
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("[Instrument Submit] Failed to push log to SharePoint for localUuid={}: {}",
                    dto.getLocalUuid(), e.getMessage());
        }

        // 6. Upsert "Instrumentation" SP list item
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

    public List<InstrumentLogDto> getLogsByInstrument(String tagNumber) {
        if (tagNumber == null || tagNumber.isBlank()) return List.of();
        return instrumentLogRepo.findAllByInstrumentTagNumber(tagNumber).stream()
                .map(logMapper::convertToDto)
                .toList();
    }

    public List<InstrumentLogDto> getAllLogs() {
        return instrumentLogRepo.findAll().stream()
                .map(logMapper::convertToDto)
                .toList();
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

    private String guessAttachmentType(String contentType) {
        if (contentType == null) return "document";
        if (contentType.startsWith("image/")) return "photo";
        if (contentType.contains("pdf") || contentType.contains("document")) return "document";
        return "document";
    }

    private String computeContentHash(String base64Content) {
        if (base64Content == null || base64Content.isEmpty()) return null;
        try {
            byte[] bytes = java.util.Base64.getDecoder().decode(base64Content);
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(bytes);
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception decodeError) {
            try {
                byte[] hash = MessageDigest.getInstance("SHA-256")
                        .digest(base64Content.getBytes(StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder(hash.length * 2);
                for (byte b : hash) sb.append(String.format("%02x", b));
                return sb.toString();
            } catch (Exception hashError) {
                log.warn("[Instrument Submit] Could not hash attachment payload: {}", hashError.getMessage());
                return null;
            }
        }
    }
}
