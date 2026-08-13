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
        // 0. Normalize the tag the same way the register does (trim + uppercase). Without this a log
        //    for "pt-101" would miss the "PT-101" row in step 4 and mint a duplicate instrument.
        if (dto.getInstrumentTagNumber() != null) {
            dto.setInstrumentTagNumber(dto.getInstrumentTagNumber().trim().toUpperCase());
        }

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
                    dto.getLocalUuid(), e.getMessage(), e);
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
                    dto.getInstrumentTagNumber(), e.getMessage(), e);
        }

        return PwaSubmissionResult.success(method, sharepointId, dto.getLocalUuid());
    }

    public List<InstrumentLogDto> getLogsByInstrument(String tagNumber) {
        if (tagNumber == null || tagNumber.isBlank()) return List.of();
        return instrumentLogRepo.findTop50ByInstrumentTagNumberOrderByIdDesc(tagNumber.trim()).stream()
                .map(logMapper::convertToDto)
                .toList();
    }

    public List<InstrumentLogDto> getAllLogs() {
        return instrumentLogRepo.findAll().stream()
                .map(logMapper::convertToDto)
                .toList();
    }

    /**
     * Rolls the submitted log up onto the instrument row (its "last log" summary, which step 6 then
     * pushes to the SharePoint register).
     *
     * <p>Blank-guarded on every field the log merely <em>echoes</em> — description above all. The log
     * form renders description read-only from the instrument, so a log arriving with it empty means
     * the client didn't have it (offline replay, an older cached row, the Power Automate path), NOT
     * that the user cleared it. Writing that blank through used to erase the description locally and
     * then propagate the erasure to SharePoint. {@code lastComment} is the deliberate exception: it
     * means "comment on the most recent log", so an empty comment must clear a stale one rather than
     * leave an older comment masquerading as current.</p>
     */
    private void upsertInstrumentLocally(PwaInstrumentLogDto dto) {
        Optional<Instrument> existing = instrumentRepo.findByTagNumber(dto.getInstrumentTagNumber());
        Instrument instrument;
        if (existing.isPresent()) {
            instrument = existing.get();
        } else {
            instrument = new Instrument();
            instrument.setTagNumber(dto.getInstrumentTagNumber());
        }
        setIfNotBlank(dto.getInstrumentDescription(), instrument::setDescription);
        setIfNotBlank(dto.getStatus(), instrument::setCurrentStatus);
        setIfNotBlank(dto.getDate(), instrument::setLastUpdatedDate);
        setIfNotBlank(dto.getTime(), instrument::setLastUpdatedTime);
        setIfNotBlank(dto.getName(), instrument::setLastUpdatedBy);
        instrument.setLastComment(dto.getComment() == null ? "" : dto.getComment().trim());
        instrumentRepo.saveAndFlush(instrument);
        log.info("[Instrument Submit] Instrument upserted locally: tagNumber={}, status={}",
                dto.getInstrumentTagNumber(), dto.getStatus());
    }

    private static void setIfNotBlank(String value, java.util.function.Consumer<String> setter) {
        if (value != null && !value.trim().isEmpty()) setter.accept(value.trim());
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
