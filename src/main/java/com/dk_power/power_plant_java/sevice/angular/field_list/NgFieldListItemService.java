package com.dk_power.power_plant_java.sevice.angular.field_list;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.dto.field_list.FieldListItemDto;
import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import com.dk_power.power_plant_java.entities.field_list.FieldListItem;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.mappers.field_list.FieldListItemMapper;
import com.dk_power.power_plant_java.repository.field_list.FieldListItemRepo;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.maximo.MaximoFieldListEvents;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.FieldListItemSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.util.Base64;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class NgFieldListItemService {

    private final FieldListItemRepo repo;
    private final FieldListItemMapper mapper;
    private final NgValueService valueService;
    private final PermitAttachmentRepo attachmentRepo;
    private final FieldListItemSharePointAdapter spAdapter;
    private final SyncConfig syncConfig;
    /**
     * Emits Maximo bridge events; MaximoFieldListEventListener handles them AFTER commit
     * so the bridge runs outside this service's tx. When the feature is off, the listener
     * bean is absent → events are no-ops → behavior matches pre-feature.
     */
    private final ApplicationEventPublisher events;

    public List<FieldListItemDto> getAll() {
        return mapper.convertToDtos(repo.findAll());
    }

    public List<FieldListItemDto> getByListType(String listTypeName) {
        return mapper.convertToDtos(repo.findByListType_NameIgnoreCase(listTypeName));
    }

    public List<FieldListItemDto> getByStatus(String statusName) {
        return mapper.convertToDtos(repo.findByStatus_NameIgnoreCase(statusName));
    }

    private static final List<String> OPEN_STATUSES = List.of("Open", "In Progress");

    public List<FieldListItemDto> getOpenItems() {
        return mapper.convertToDtos(repo.findByStatus_NameIn(OPEN_STATUSES));
    }

    public List<FieldListItemDto> getOpenItemsByListType(String listTypeName) {
        return mapper.convertToDtos(repo.findByListType_NameIgnoreCaseAndStatus_NameIn(listTypeName, OPEN_STATUSES));
    }

    public FieldListItemDto getDtoById(Long id) {
        return repo.findById(id).map(mapper::convertToDto).orElse(null);
    }

    public FieldListItem getEntity() {
        return new FieldListItem();
    }

    public FieldListItemDto save(FieldListItemDto dto) {
        boolean isNewRecord = dto.getId() == null;
        FieldListItem entity;
        if (dto.getId() != null) {
            entity = repo.findById(dto.getId()).orElse(new FieldListItem());
        } else {
            entity = new FieldListItem();
        }

        entity.setTitle(dto.getTitle());
        entity.setNotes(dto.getNotes());
        entity.setDateObserved(dto.getDateObserved());
        entity.setTimeObserved(dto.getTimeObserved());
        entity.setSpecificLocation(dto.getSpecificLocation());
        entity.setSubmitterName(dto.getSubmitterName());
        entity.setSubmitterEmail(dto.getSubmitterEmail());
        entity.setSubmitterPhone(dto.getSubmitterPhone());

        if (dto.getListTypeName() != null) {
            entity.setListType(valueService.createValue("FieldListType", dto.getListTypeName()));
        }
        if (dto.getStatusName() != null) {
            entity.setStatus(valueService.createValue("FieldListStatus", dto.getStatusName()));
        } else if (entity.getStatus() == null) {
            entity.setStatus(valueService.createValue("FieldListStatus", "Open"));
        }
        if (dto.getLocationName() != null) {
            entity.setLocation(valueService.createValue("Location", dto.getLocationName()));
        }

        mapper.resolveEquipmentReference(entity, dto.getEquipmentTag(), null);

        // Maximo picker fields — accepted from any /ng caller. Trim + null empty so the
        // bridge cleanly sees "not provided" instead of empty-string.
        entity.setMaximoLocation(nullIfBlankStr(dto.getMaximoLocation()));
        entity.setMaximoAssetnum(nullIfBlankStr(dto.getMaximoAssetnum()));

        entity = repo.save(entity);

        // Publish Submitted on NEW rows so the Maximo bridge routes them, same as the
        // PWA-mobile path. Otherwise desktop-created field lists never reach Maximo
        // and only mobile ones do — silent behavioral asymmetry between two frontends
        // that write the same entity. AFTER_COMMIT listener + hub-only bean, so this
        // is a no-op on desktops and when the feature is off.
        // Updates (dto.id was set) DON'T re-publish — the row is already routed, and
        // re-firing Submitted would either double-create (guarded by recordId
        // idempotency in bridge.submit, so safe) or churn — better to keep the
        // event's semantic as "brand new field list, evaluate for Maximo routing".
        if (isNewRecord) {
            events.publishEvent(new MaximoFieldListEvents.Submitted(entity.getId()));
        }

        return mapper.convertToDto(entity);
    }

    public FieldListItemDto changeStatus(Long id, String statusName) {
        FieldListItem entity = repo.findById(id).orElseThrow(() ->
                new RuntimeException("FieldListItem not found: " + id));
        entity.setStatus(valueService.createValue("FieldListStatus", statusName));
        entity = repo.save(entity);

        // Best-effort push to SharePoint. We send the FULL DTO (not just Status) because the
        // PA flow's Update item action maps every column — a partial payload would set every
        // omitted column to null on SP (Title/Location/Notes/etc. silently wiped). See
        // FieldListItemSharePointAdapter.changeStatus_removed for the full explanation.
        if (entity.getSharepointId() != null) {
            try {
                spAdapter.update(entity.getSharepointId(), mapper.convertToDto(entity));
            } catch (Exception e) {
                log.warn("[FieldList] SP status change failed for spId={}: {}", entity.getSharepointId(), e.getMessage());
            }
        }

        // Publish StatusChanged; MaximoFieldListEventListener checks the wo-completion-status
        // match on its own side (single source of truth for that config), then COMPs the WO
        // AFTER this tx commits. No-op when the listener bean is absent (feature off).
        events.publishEvent(new MaximoFieldListEvents.StatusChanged(entity.getId(), statusName, currentActor()));

        return mapper.convertToDto(entity);
    }

    /** Best-effort username from Spring Security for the Maximo memo string. */
    private static String currentActor() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        return (a == null || a.getName() == null || a.getName().isBlank()) ? null : a.getName();
    }

    public PermitAttachment uploadAttachment(Long entityId, String fileName, String contentType, String base64Content) {
        String hash = computeContentHash(base64Content);

        PermitAttachment att = new PermitAttachment();
        att.setEntityType("FieldListItem");
        att.setEntityId(entityId);
        att.setFileName(fileName);
        att.setContentType(contentType);
        att.setAttachmentType(contentType != null && contentType.startsWith("image/") ? "photo" : "document");
        att.setBase64Content(base64Content);
        att.setContentHash(hash);
        att.setOriginMachineId(syncConfig.getMachineId());
        att.setSyncedToServer(false);
        att = attachmentRepo.save(att);

        // Publish AttachmentAdded — hub listener uploads to the parent Maximo record
        // (WO doclink or SR doclink). No-op when the Maximo feature is off (listener
        // bean absent) or the parent hasn't been routed yet (uploadOne marks pending
        // and backfill retries).
        events.publishEvent(new MaximoFieldListEvents.AttachmentAdded(entityId, att.getId()));

        // Best-effort push to SharePoint
        FieldListItem entity = repo.findById(entityId).orElse(null);
        if (entity != null && entity.getSharepointId() != null) {
            try {
                PaAttachmentDto paAtt = new PaAttachmentDto();
                paAtt.setFileName(fileName);
                paAtt.setContentType(contentType);
                paAtt.setBase64Content(base64Content);
                spAdapter.addAttachment(entity.getSharepointId(), paAtt);
            } catch (Exception e) {
                log.warn("[FieldList] SP attachment upload failed: {}", e.getMessage());
            }
        }
        return att;
    }

    public void deleteAttachment(Long entityId, Long attachmentId) {
        attachmentRepo.deleteById(attachmentId);
        // Note: SP attachments are not deleted — SP list item attachments
        // will be orphaned but this matches the WR pattern (no SP delete API)
    }

    public void softDelete(Long id) {
        repo.findById(id).ifPresent(entity -> {
            log.info("[FieldList] Soft-deleting item id={} title={}", id, entity.getTitle());
            entity.setDeleted(true);
            repo.save(entity);
            log.info("[FieldList] Soft-delete saved for id={}", id);
            // Publish Cancelled; MaximoFieldListEventListener runs AFTER commit, re-fetches
            // the (now soft-deleted) row via findByIdIncludingDeleted, and cancels the
            // Maximo record if maximoHref is set. Bridge-absent = no-op.
            events.publishEvent(new MaximoFieldListEvents.Cancelled(id, "Retracted in PWA/hub"));
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

    private static String nullIfBlankStr(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}
