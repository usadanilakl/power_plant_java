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
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.FieldListItemSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

        entity = repo.save(entity);
        return mapper.convertToDto(entity);
    }

    public FieldListItemDto changeStatus(Long id, String statusName) {
        FieldListItem entity = repo.findById(id).orElseThrow(() ->
                new RuntimeException("FieldListItem not found: " + id));
        entity.setStatus(valueService.createValue("FieldListStatus", statusName));
        entity = repo.save(entity);

        // Best-effort push to SharePoint
        if (entity.getSharepointId() != null) {
            try {
                spAdapter.changeStatus(entity.getSharepointId(), statusName);
            } catch (Exception e) {
                log.warn("[FieldList] SP status change failed for spId={}: {}", entity.getSharepointId(), e.getMessage());
            }
        }
        return mapper.convertToDto(entity);
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
