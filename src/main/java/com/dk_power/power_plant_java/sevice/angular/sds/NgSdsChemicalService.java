package com.dk_power.power_plant_java.sevice.angular.sds;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import com.dk_power.power_plant_java.dto.sds.SdsChemicalDto;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.entities.sds.SdsChemical;
import com.dk_power.power_plant_java.mappers.sds.SdsChemicalMapper;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.repository.sds.SdsChemicalRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.SdsChemicalSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class NgSdsChemicalService {

    public static final String STATUS_CATEGORY = "SdsStatus";
    public static final String STATUS_INCOMING = "Incoming";
    public static final String STATUS_PENDING = "Pending";
    public static final String STATUS_FILED = "Filed";
    public static final String STATUS_REMOVED = "Removed";

    private static final List<String> ACTIVE_STATUSES = List.of(STATUS_INCOMING, STATUS_PENDING, STATUS_FILED);
    private static final List<String> UNPROCESSED_STATUSES = List.of(STATUS_INCOMING, STATUS_PENDING);

    private final SdsChemicalRepo repo;
    private final SdsChemicalMapper mapper;
    private final NgValueService valueService;
    private final PermitAttachmentRepo attachmentRepo;
    private final SdsChemicalSharePointAdapter spAdapter;
    private final SyncConfig syncConfig;

    public List<SdsChemicalDto> getAll() {
        return mapper.convertToDtos(repo.findAll());
    }

    public List<SdsChemicalDto> getActive() {
        return mapper.convertToDtos(repo.findByStatus_NameIn(ACTIVE_STATUSES));
    }

    public List<SdsChemicalDto> getByStatus(String statusName) {
        return mapper.convertToDtos(repo.findByStatus_NameIgnoreCase(statusName));
    }

    /** Items that still need processing — Incoming (raw PDF dump) + Pending (intake started). */
    public List<SdsChemicalDto> getUnprocessed() {
        return mapper.convertToDtos(repo.findByStatus_NameIn(UNPROCESSED_STATUSES));
    }

    public SdsChemicalDto getDtoById(Long id) {
        return repo.findById(id).map(mapper::convertToDto).orElse(null);
    }

    public SdsChemical getEntity() {
        return new SdsChemical();
    }

    public SdsChemicalDto save(SdsChemicalDto dto) {
        SdsChemical entity;
        if (dto.getId() != null) {
            entity = repo.findById(dto.getId()).orElse(new SdsChemical());
        } else {
            entity = new SdsChemical();
        }

        entity.setNames(dto.getNames());
        entity.setLocations(dto.getLocations());
        entity.setNotes(dto.getNotes());
        entity.setProcessedByName(dto.getProcessedByName());
        entity.setProcessedByEmail(dto.getProcessedByEmail());
        entity.setProcessedAt(dto.getProcessedAt());
        entity.setSubmitterName(dto.getSubmitterName());
        entity.setSubmitterEmail(dto.getSubmitterEmail());
        entity.setSubmitterPhone(dto.getSubmitterPhone());
        if (dto.getBookNumber() != null) entity.setBookNumber(dto.getBookNumber());
        if (dto.getSectionNumber() != null) entity.setSectionNumber(dto.getSectionNumber());

        if (dto.getStatusName() != null) {
            entity.setStatus(valueService.createValue(STATUS_CATEGORY, dto.getStatusName()));
        } else if (entity.getStatus() == null) {
            entity.setStatus(valueService.createValue(STATUS_CATEGORY, STATUS_PENDING));
        }

        entity = repo.save(entity);

        // Best-effort SP push for updates that already have a SP id
        if (entity.getSharepointId() != null) {
            try {
                spAdapter.update(entity.getSharepointId(), mapper.convertToDto(entity));
            } catch (Exception e) {
                log.warn("[SDS] SP update failed for spId={}: {}", entity.getSharepointId(), e.getMessage());
            }
        }
        return mapper.convertToDto(entity);
    }

    public SdsChemicalDto changeStatus(Long id, String statusName) {
        SdsChemical entity = repo.findById(id).orElseThrow(() ->
                new RuntimeException("SdsChemical not found: " + id));
        entity.setStatus(valueService.createValue(STATUS_CATEGORY, statusName));
        entity = repo.save(entity);

        if (entity.getSharepointId() != null) {
            try {
                spAdapter.changeStatus(entity.getSharepointId(), statusName);
            } catch (Exception e) {
                log.warn("[SDS] SP status change failed for spId={}: {}", entity.getSharepointId(), e.getMessage());
            }
        }
        return mapper.convertToDto(entity);
    }

    /**
     * Admin bulk dump: create one Incoming chemical per uploaded PDF (no metadata yet).
     * The file name (sans extension) becomes a placeholder primary name for operators to refine.
     */
    public int dumpIncoming(List<Map<String, String>> files) {
        if (files == null) return 0;
        int created = 0;
        for (Map<String, String> f : files) {
            String fileName = f.get("fileName");
            String base64 = f.get("base64Content");
            if (base64 == null || base64.isBlank()) continue;
            String contentType = f.getOrDefault("contentType", "application/pdf");

            SdsChemical entity = new SdsChemical();
            entity.setLocalUuid(UUID.randomUUID().toString());
            entity.setStatus(valueService.createValue(STATUS_CATEGORY, STATUS_INCOMING));
            entity.setNames(stripExtension(fileName));
            entity = repo.saveAndFlush(entity);

            uploadAttachment(entity.getId(), fileName, contentType, base64);
            created++;
        }
        return created;
    }

    private static String stripExtension(String fileName) {
        if (fileName == null) return "";
        int dot = fileName.lastIndexOf('.');
        return dot > 0 ? fileName.substring(0, dot) : fileName;
    }

    // ============ Attachments ============

    public PermitAttachment uploadAttachment(Long entityId, String fileName, String contentType, String base64Content) {
        String hash = computeContentHash(base64Content);

        PermitAttachment att = new PermitAttachment();
        att.setEntityType(SdsChemicalMapper.ENTITY_TYPE);
        att.setEntityId(entityId);
        att.setFileName(fileName);
        att.setContentType(contentType);
        att.setAttachmentType(contentType != null && contentType.startsWith("image/") ? "photo" : "document");
        att.setBase64Content(base64Content);
        att.setContentHash(hash);
        att.setOriginMachineId(syncConfig.getMachineId());
        att.setSyncedToServer(false);
        att = attachmentRepo.save(att);

        SdsChemical entity = repo.findById(entityId).orElse(null);
        if (entity != null && entity.getSharepointId() != null) {
            try {
                PaAttachmentDto paAtt = new PaAttachmentDto();
                paAtt.setFileName(fileName);
                paAtt.setContentType(contentType);
                paAtt.setBase64Content(base64Content);
                spAdapter.addAttachment(entity.getSharepointId(), paAtt);
            } catch (Exception e) {
                log.warn("[SDS] SP attachment upload failed: {}", e.getMessage());
            }
        }
        return att;
    }

    public void deleteAttachment(Long entityId, Long attachmentId) {
        attachmentRepo.deleteById(attachmentId);
    }

    public void softDelete(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    private String computeContentHash(String base64Content) {
        if (base64Content == null || base64Content.isEmpty()) return null;
        try {
            byte[] bytes = Base64.getDecoder().decode(base64Content);
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(bytes);
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }
}
