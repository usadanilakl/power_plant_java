package com.dk_power.power_plant_java.mappers.sds;

import com.dk_power.power_plant_java.dto.sds.SdsChemicalDto;
import com.dk_power.power_plant_java.entities.sds.SdsChemical;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class SdsChemicalMapper {

    public static final String ENTITY_TYPE = "SdsChemical";

    private final NgValueService valueService;
    private final PermitAttachmentRepo attachmentRepo;

    public SdsChemicalDto convertToDto(SdsChemical entity) {
        if (entity == null) return null;
        SdsChemicalDto dto = convertToDtoBase(entity);
        if (entity.getId() != null) {
            dto.setAttachmentCount(
                (int) attachmentRepo.countByEntityTypeAndEntityId(ENTITY_TYPE, entity.getId()));
        }
        return dto;
    }

    /** Batch-optimized: 1 query for attachment counts instead of N. */
    public List<SdsChemicalDto> convertToDtos(List<SdsChemical> entities) {
        if (entities == null || entities.isEmpty()) return List.of();

        List<Long> ids = entities.stream().map(SdsChemical::getId).toList();
        Map<Long, Integer> attachmentCounts = new HashMap<>();
        attachmentRepo.countByEntityTypeGroupedByEntityId(ENTITY_TYPE, ids)
            .forEach(row -> attachmentCounts.put((Long) row[0], ((Number) row[1]).intValue()));

        return entities.stream().map(entity -> {
            SdsChemicalDto dto = convertToDtoBase(entity);
            dto.setAttachmentCount(attachmentCounts.getOrDefault(entity.getId(), 0));
            return dto;
        }).toList();
    }

    private SdsChemicalDto convertToDtoBase(SdsChemical entity) {
        SdsChemicalDto dto = new SdsChemicalDto();
        dto.setId(entity.getId());
        dto.setNames(entity.getNames());
        dto.setPrimaryName(primaryName(entity.getNames()));
        dto.setLocations(entity.getLocations());
        dto.setBookNumber(entity.getBookNumber());
        dto.setSectionNumber(entity.getSectionNumber());
        dto.setNotes(entity.getNotes());
        dto.setProcessedByName(entity.getProcessedByName());
        dto.setProcessedByEmail(entity.getProcessedByEmail());
        dto.setProcessedAt(entity.getProcessedAt());
        dto.setLastAuditedAt(entity.getLastAuditedAt());
        dto.setSharepointId(entity.getSharepointId());
        dto.setLocalUuid(entity.getLocalUuid());
        dto.setSpModifiedTime(entity.getSpModifiedTime());
        dto.setSubmitterName(entity.getSubmitterName());
        dto.setSubmitterEmail(entity.getSubmitterEmail());
        dto.setSubmitterPhone(entity.getSubmitterPhone());
        dto.setCreatedBy(entity.getCreatedBy());
        if (entity.getDateCreated() != null) dto.setDateCreated(entity.getDateCreated().toString());
        if (entity.getDateModified() != null) dto.setDateModified(entity.getDateModified().toString());

        if (entity.getStatus() != null) {
            dto.setStatusId(entity.getStatus().getId());
            dto.setStatusName(entity.getStatus().getName());
        }
        return dto;
    }

    public SdsChemical convertToEntity(SdsChemicalDto dto) {
        if (dto == null) return null;
        SdsChemical entity = new SdsChemical();
        entity.setNames(dto.getNames());
        entity.setLocations(dto.getLocations());
        entity.setBookNumber(dto.getBookNumber());
        entity.setSectionNumber(dto.getSectionNumber());
        entity.setNotes(dto.getNotes());
        entity.setProcessedByName(dto.getProcessedByName());
        entity.setProcessedByEmail(dto.getProcessedByEmail());
        entity.setProcessedAt(dto.getProcessedAt());
        entity.setLastAuditedAt(dto.getLastAuditedAt());
        entity.setSharepointId(dto.getSharepointId());
        entity.setLocalUuid(dto.getLocalUuid());
        entity.setSubmitterName(dto.getSubmitterName());
        entity.setSubmitterEmail(dto.getSubmitterEmail());
        entity.setSubmitterPhone(dto.getSubmitterPhone());

        if (dto.getStatusName() != null) {
            entity.setStatus(valueService.createValue("SdsStatus", dto.getStatusName()));
        }
        return entity;
    }

    /** First non-blank line of the newline-delimited names. */
    public static String primaryName(String names) {
        if (names == null) return null;
        for (String line : names.split("\\r?\\n")) {
            String trimmed = line.trim();
            if (!trimmed.isEmpty()) return trimmed;
        }
        return null;
    }
}
