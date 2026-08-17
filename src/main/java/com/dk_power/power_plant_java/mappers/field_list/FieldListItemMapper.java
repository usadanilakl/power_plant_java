package com.dk_power.power_plant_java.mappers.field_list;

import com.dk_power.power_plant_java.dto.field_list.FieldListItemDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.field_list.FieldListItem;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class FieldListItemMapper {

    private final NgValueService valueService;
    private final EquipmentRepo equipmentRepo;
    private final LotoPointRepo lotoPointRepo;
    private final PermitAttachmentRepo attachmentRepo;
    private final WorkAreaRepo workAreaRepo;

    public FieldListItemDto convertToDto(FieldListItem entity) {
        if (entity == null) return null;
        FieldListItemDto dto = new FieldListItemDto();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setNotes(entity.getNotes());
        dto.setDateObserved(entity.getDateObserved());
        dto.setTimeObserved(entity.getTimeObserved());
        dto.setSpecificLocation(entity.getSpecificLocation());
        dto.setSharepointId(entity.getSharepointId());
        dto.setLocalUuid(entity.getLocalUuid());
        dto.setSpModifiedTime(entity.getSpModifiedTime());
        dto.setSubmitterName(entity.getSubmitterName());
        dto.setSubmitterEmail(entity.getSubmitterEmail());
        dto.setSubmitterPhone(entity.getSubmitterPhone());
        dto.setCreatedBy(entity.getCreatedBy());
        if (entity.getDateCreated() != null) dto.setDateCreated(entity.getDateCreated().toString());
        if (entity.getDateModified() != null) dto.setDateModified(entity.getDateModified().toString());

        if (entity.getListType() != null) {
            dto.setListTypeId(entity.getListType().getId());
            dto.setListTypeName(entity.getListType().getName());
        }
        if (entity.getStatus() != null) {
            dto.setStatusId(entity.getStatus().getId());
            dto.setStatusName(entity.getStatus().getName());
        }
        applyLocationFields(entity, dto);
        if (entity.getLotoPoint() != null) {
            dto.setLotoPointId(entity.getLotoPoint().getId());
            dto.setEquipmentTag(entity.getLotoPoint().getTagNumber());
        } else if (entity.getEquipment() != null) {
            dto.setEquipmentId(entity.getEquipment().getId());
            dto.setEquipmentTag(entity.getEquipment().getTagNumber());
        }
        if (entity.getId() != null) {
            dto.setAttachmentCount(
                (int) attachmentRepo.countByEntityTypeAndEntityId("FieldListItem", entity.getId()));
        }
        copyMaximoFields(entity, dto);
        return dto;
    }

    /**
     * Copies the Maximo bridge state onto the DTO. Extracted into a helper because there
     * are two nearly-identical convert paths (single vs batch) and forgetting to update
     * both is a real hazard — this keeps them in sync.
     */
    private static void copyMaximoFields(FieldListItem entity, FieldListItemDto dto) {
        dto.setMaximoRecordType(entity.getMaximoRecordType());
        dto.setMaximoRecordId(entity.getMaximoRecordId());
        dto.setMaximoStatus(entity.getMaximoStatus());
        dto.setMaximoSyncPending(entity.getMaximoSyncPending());
        dto.setMaximoCancelPending(entity.getMaximoCancelPending());
        dto.setMaximoCompletePending(entity.getMaximoCompletePending());
        dto.setMaximoLocation(entity.getMaximoLocation());
        dto.setMaximoAssetnum(entity.getMaximoAssetnum());
        dto.setContractorCompletedBy(entity.getContractorCompletedBy());
        dto.setContractorCompletedAt(entity.getContractorCompletedAt());
    }

    /**
     * Batch-optimized: converts a list using 1 query for attachment counts instead of N.
     */
    public List<FieldListItemDto> convertToDtos(List<FieldListItem> entities) {
        if (entities == null || entities.isEmpty()) return List.of();

        List<Long> ids = entities.stream().map(FieldListItem::getId).toList();
        Map<Long, Integer> attachmentCounts = new HashMap<>();
        attachmentRepo.countByEntityTypeGroupedByEntityId("FieldListItem", ids)
            .forEach(row -> attachmentCounts.put((Long) row[0], ((Number) row[1]).intValue()));

        return entities.stream().map(entity -> {
            FieldListItemDto dto = convertToDtoWithoutAttachmentCount(entity);
            dto.setAttachmentCount(attachmentCounts.getOrDefault(entity.getId(), 0));
            return dto;
        }).toList();
    }

    private FieldListItemDto convertToDtoWithoutAttachmentCount(FieldListItem entity) {
        if (entity == null) return null;
        FieldListItemDto dto = new FieldListItemDto();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setNotes(entity.getNotes());
        dto.setDateObserved(entity.getDateObserved());
        dto.setTimeObserved(entity.getTimeObserved());
        dto.setSpecificLocation(entity.getSpecificLocation());
        dto.setSharepointId(entity.getSharepointId());
        dto.setLocalUuid(entity.getLocalUuid());
        dto.setSpModifiedTime(entity.getSpModifiedTime());
        dto.setSubmitterName(entity.getSubmitterName());
        dto.setSubmitterEmail(entity.getSubmitterEmail());
        dto.setSubmitterPhone(entity.getSubmitterPhone());
        dto.setCreatedBy(entity.getCreatedBy());
        if (entity.getDateCreated() != null) dto.setDateCreated(entity.getDateCreated().toString());
        if (entity.getDateModified() != null) dto.setDateModified(entity.getDateModified().toString());
        if (entity.getListType() != null) {
            dto.setListTypeId(entity.getListType().getId());
            dto.setListTypeName(entity.getListType().getName());
        }
        if (entity.getStatus() != null) {
            dto.setStatusId(entity.getStatus().getId());
            dto.setStatusName(entity.getStatus().getName());
        }
        applyLocationFields(entity, dto);
        if (entity.getLotoPoint() != null) {
            dto.setLotoPointId(entity.getLotoPoint().getId());
            dto.setEquipmentTag(entity.getLotoPoint().getTagNumber());
        } else if (entity.getEquipment() != null) {
            dto.setEquipmentId(entity.getEquipment().getId());
            dto.setEquipmentTag(entity.getEquipment().getTagNumber());
        }
        copyMaximoFields(entity, dto);
        return dto;
    }

    /**
     * Read side of "where was this observed": expose the work area, and derive {@code locationName}
     * from it so the SharePoint "Location" column and the list view need no changes. Rows written
     * before the work-area link existed fall back to their legacy Location Value.
     */
    public void applyLocationFields(FieldListItem entity, FieldListItemDto dto) {
        if (entity.getWorkArea() != null) {
            dto.setWorkAreaId(entity.getWorkArea().getId());
            dto.setWorkAreaName(entity.getWorkArea().getName());
        }
        if (entity.getLocation() != null) {
            dto.setLocationId(entity.getLocation().getId());
            dto.setLocationName(entity.getLocation().getName());
        }
        if (dto.getWorkAreaName() != null && !dto.getWorkAreaName().isBlank()) {
            dto.setLocationName(dto.getWorkAreaName());
        }
    }

    /**
     * Write side: bind the picked work area, id first with a name fallback for a stale/absent id —
     * the same contract {@code PwaWorkRequestService} uses.
     *
     * <p>Deliberately resolve-only. The previous code ran {@code createValue("Location", name)},
     * which minted a Location Value for every work area name it saw and polluted the taxonomy that
     * LOTO points and work areas share. An unmatched name now leaves the link null rather than
     * inventing a record.
     */
    public void resolveWorkArea(FieldListItem entity, FieldListItemDto dto) {
        resolveWorkArea(entity, dto.getWorkAreaId(), dto.getWorkAreaName(), dto.getLocationName());
    }

    /**
     * Primitive overload — the /ng and PWA layers carry different DTO types for the same row, so the
     * resolution rule lives here once instead of being copied into each service.
     *
     * <p>{@code legacyLocationName} is the pre-work-area payload field: older PWA builds (and offline
     * drafts queued before this change) send only that, holding the work area's name.
     */
    public void resolveWorkArea(FieldListItem entity, Long workAreaId, String workAreaName, String legacyLocationName) {
        if (workAreaId != null) {
            workAreaRepo.findById(workAreaId).ifPresent(entity::setWorkArea);
        }
        if (entity.getWorkArea() == null) {
            String name = workAreaName != null && !workAreaName.isBlank() ? workAreaName : legacyLocationName;
            if (name != null && !name.isBlank()) {
                workAreaRepo.findFirstByNameIgnoreCase(name).ifPresent(entity::setWorkArea);
            }
        }
    }

    public FieldListItem convertToEntity(FieldListItemDto dto) {
        if (dto == null) return null;
        FieldListItem entity = new FieldListItem();
        entity.setTitle(dto.getTitle());
        entity.setNotes(dto.getNotes());
        entity.setDateObserved(dto.getDateObserved());
        entity.setTimeObserved(dto.getTimeObserved());
        entity.setSpecificLocation(dto.getSpecificLocation());
        entity.setSharepointId(dto.getSharepointId());
        entity.setLocalUuid(dto.getLocalUuid());
        entity.setSubmitterName(dto.getSubmitterName());
        entity.setSubmitterEmail(dto.getSubmitterEmail());
        entity.setSubmitterPhone(dto.getSubmitterPhone());

        if (dto.getListTypeName() != null) {
            entity.setListType(valueService.createValue("FieldListType", dto.getListTypeName()));
        }
        if (dto.getStatusName() != null) {
            entity.setStatus(valueService.createValue("FieldListStatus", dto.getStatusName()));
        }
        resolveWorkArea(entity, dto);

        resolveEquipmentReference(entity, dto.getEquipmentTag(), null);
        // Maximo location + assetnum from the picker (blank/null strings preserved as null
        // so the bridge sees "not provided" and skips setting spi:location / spi:assetnum).
        entity.setMaximoLocation(nullIfBlank(dto.getMaximoLocation()));
        entity.setMaximoAssetnum(nullIfBlank(dto.getMaximoAssetnum()));
        return entity;
    }

    private static String nullIfBlank(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    /**
     * Resolves equipment reference using the smart resolution logic:
     * 1. Search LotoPoint by tag — if found, set lotoPoint (and equipment from its linked equipment)
     * 2. If no LotoPoint, search Equipment by tag — set equipment only
     * 3. If neither found, leave both null
     */
    public void resolveEquipmentReference(FieldListItem entity, String equipmentTag, String lotoPointTag) {
        // If explicit lotoPointTag provided, use it
        if (lotoPointTag != null && !lotoPointTag.isBlank()) {
            List<LotoPoint> lps = lotoPointRepo.findByTagNumber(lotoPointTag);
            if (!lps.isEmpty()) {
                LotoPoint lp = lps.get(0);
                entity.setLotoPoint(lp);
                if (lp.getEquipmentList() != null && !lp.getEquipmentList().isEmpty()) {
                    entity.setEquipment(lp.getEquipmentList().iterator().next());
                }
                return;
            }
        }

        // Single tag resolution: try LotoPoint first, then Equipment
        if (equipmentTag != null && !equipmentTag.isBlank()) {
            List<LotoPoint> lps = lotoPointRepo.findByTagNumber(equipmentTag);
            if (!lps.isEmpty()) {
                LotoPoint lp = lps.get(0);
                entity.setLotoPoint(lp);
                if (lp.getEquipmentList() != null && !lp.getEquipmentList().isEmpty()) {
                    entity.setEquipment(lp.getEquipmentList().iterator().next());
                }
                return;
            }

            List<Equipment> eqs = equipmentRepo.findByTagNumber(equipmentTag);
            if (!eqs.isEmpty()) {
                entity.setEquipment(eqs.get(0));
            }
        }
    }
}
