package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.NgWorkRequestDto;
import com.dk_power.power_plant_java.dto.permits.WorkRequestDto;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.repository.permits.JhaRepo;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@Slf4j
@RequiredArgsConstructor
public class WorkRequestMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final WorkRequestRepo workRequestRepo;
    private final JhaRepo jhaRepo;
    private final PermitAttachmentRepo permitAttachmentRepo;
    private final WorkAreaMapper workAreaMapper;
    private final WorkAreaRepo workAreaRepo;
    private final NgValueService valueService;

    public WorkRequestDto convertToDto(WorkRequest entity) {
        if (entity == null) return null;

        WorkRequestDto dto = new WorkRequestDto();

        dto.setDateOfWorkToBePerformed(entity.getDateOfWorkToBePerformed());
        dto.setTimeOfWorkToBePerformed(entity.getTimeOfWorkToBePerformed());
        dto.setRequestedBy(entity.getRequestedBy());
        dto.setCompany(entity.getCompany());
        dto.setLocation(entity.getLocation());
        dto.setAffectedEquipment(entity.getAffectedEquipment());
        dto.setWorkScope(entity.getWorkScope());
        dto.setBooleanIsHotWorkRequired(entity.getIsHotWorkRequired());
        dto.setForeman(entity.getForeman());
        dto.setFireWatch(entity.getFireWatch());
        dto.setBooleanIsLotoRequired(entity.getIsLotoRequired());
        dto.setBooleanIsConfinedSpaceEntryRequired(entity.getIsConfinedSpaceEntryRequired());
        dto.setSpace(entity.getSpace());
        dto.setSharepointId(entity.getSharepointId());
        dto.setLocalUuid(entity.getLocalUuid());
        dto.setWorkCategoryName(entity.getWorkCategory() != null ? entity.getWorkCategory().getName() : null);
        dto.setWorkAreaName(entity.getWorkArea() != null ? entity.getWorkArea().getName() : null);
        dto.setDeclaredHazards(entity.getDeclaredHazardsEnvelope());

        return dto;
    }

    public WorkRequest convertToEntity(WorkRequestDto dto) {
        if (dto == null) return null;

        WorkRequest entity = new WorkRequest();

        entity.setDateOfWorkToBePerformed(dto.getDateOfWorkToBePerformed());
        entity.setTimeOfWorkToBePerformed(dto.getTimeOfWorkToBePerformed());
        entity.setRequestedBy(dto.getRequestedBy());
        entity.setCompany(dto.getCompany());
        entity.setLocation(dto.getLocation());
        entity.setAffectedEquipment(dto.getAffectedEquipment());
        entity.setWorkScope(dto.getWorkScope());
        entity.setIsHotWorkRequired(dto.getIsHotWorkRequired());
        entity.setForeman(dto.getForeman());
        entity.setFireWatch(dto.getFireWatch());
        entity.setIsLotoRequired(dto.getIsLotoRequired());
        entity.setIsConfinedSpaceEntryRequired(dto.getIsConfinedSpaceEntryRequired());
        entity.setSpace(dto.getSpace());
        entity.setSharepointId(dto.getSharepointId());
        if (dto.getWorkCategoryName() != null && !dto.getWorkCategoryName().isBlank()) {
            entity.setWorkCategory(valueService.createValue("Work Category", dto.getWorkCategoryName()));
        }
        if (dto.getWorkAreaName() != null && !dto.getWorkAreaName().isBlank()) {
            workAreaRepo.findFirstByNameIgnoreCase(dto.getWorkAreaName()).ifPresent(entity::setWorkArea);
        }

        return entity;
    }

    public NgWorkRequestDto toNgWorkRequestDto(WorkRequestDto workRequestDto) {
        if (workRequestDto == null) {
            return null;
        }

        NgWorkRequestDto ngWorkRequestDto = new NgWorkRequestDto();
        ngWorkRequestDto.setDateOfWorkToBePerformed(workRequestDto.getDateOfWorkToBePerformed());
        ngWorkRequestDto.setTimeOfWorkToBePerformed(workRequestDto.getTimeOfWorkToBePerformed());
        ngWorkRequestDto.setRequestedBy(workRequestDto.getRequestedBy());
        ngWorkRequestDto.setCompany(workRequestDto.getCompany());
        ngWorkRequestDto.setLocation(workRequestDto.getLocation());
        ngWorkRequestDto.setAffectedEquipment(workRequestDto.getAffectedEquipment());
        ngWorkRequestDto.setWorkScope(workRequestDto.getWorkScope());
        ngWorkRequestDto.setIsHotWorkRequired(workRequestDto.getIsHotWorkRequired());
        ngWorkRequestDto.setForeman(workRequestDto.getForeman());
        ngWorkRequestDto.setFireWatch(workRequestDto.getFireWatch());
        ngWorkRequestDto.setIsLotoRequired(workRequestDto.getIsLotoRequired());
        ngWorkRequestDto.setIsConfinedSpaceEntryRequired(workRequestDto.getIsConfinedSpaceEntryRequired());
        ngWorkRequestDto.setSpace(workRequestDto.getSpace());
        ngWorkRequestDto.setSharepointId(workRequestDto.getSharepointId());
        if (workRequestDto.getWorkCategoryName() != null && !workRequestDto.getWorkCategoryName().isBlank()) {
            ngWorkRequestDto.setWorkCategory(valueService.valueToDto(valueService.createValue("Work Category", workRequestDto.getWorkCategoryName())));
        }
        if (workRequestDto.getWorkAreaName() != null && !workRequestDto.getWorkAreaName().isBlank()) {
            workAreaRepo.findFirstByNameIgnoreCase(workRequestDto.getWorkAreaName())
                .ifPresent(wa -> ngWorkRequestDto.setWorkArea(workAreaMapper.convertToDto(wa)));
        }

        return ngWorkRequestDto;
    }

    public WorkRequestDto toWorkRequestDto(NgWorkRequestDto ngWorkRequestDto) {
        if (ngWorkRequestDto == null) {
            return null;
        }

        WorkRequestDto workRequestDto = new WorkRequestDto();
        workRequestDto.setDateOfWorkToBePerformed(ngWorkRequestDto.getDateOfWorkToBePerformed());
        workRequestDto.setTimeOfWorkToBePerformed(ngWorkRequestDto.getTimeOfWorkToBePerformed());
        workRequestDto.setRequestedBy(ngWorkRequestDto.getRequestedBy());
        workRequestDto.setCompany(ngWorkRequestDto.getCompany());
        workRequestDto.setLocation(ngWorkRequestDto.getLocation());
        workRequestDto.setAffectedEquipment(ngWorkRequestDto.getAffectedEquipment());
        workRequestDto.setWorkScope(ngWorkRequestDto.getWorkScope());
        workRequestDto.setIsHotWorkRequired(yesNo(ngWorkRequestDto.getIsHotWorkRequired()));
        workRequestDto.setForeman(ngWorkRequestDto.getForeman());
        workRequestDto.setFireWatch(ngWorkRequestDto.getFireWatch());
        workRequestDto.setIsLotoRequired(yesNo(ngWorkRequestDto.getIsLotoRequired()));
        workRequestDto.setIsConfinedSpaceEntryRequired(yesNo(ngWorkRequestDto.getIsConfinedSpaceEntryRequired()));
        workRequestDto.setSpace(ngWorkRequestDto.getSpace());
        workRequestDto.setSharepointId(ngWorkRequestDto.getSharepointId());
        workRequestDto.setWorkCategoryName(ngWorkRequestDto.getWorkCategory() != null ? ngWorkRequestDto.getWorkCategory().getName() : null);
        workRequestDto.setWorkAreaName(ngWorkRequestDto.getWorkArea() != null ? ngWorkRequestDto.getWorkArea().getName() : null);

        return workRequestDto;
    }

    /** Unset reads as "No" — the Boolean flags are nullable, and unboxing one threw NPE. */
    private static String yesNo(Boolean flag) {
        return Boolean.TRUE.equals(flag) ? "Yes" : "No";
    }

    public NgWorkRequestDto convertToNgDto(WorkRequest entity) {
        if (entity == null) return null;

        // Single-entity path: use EXISTS/COUNT instead of loading full collections
        boolean hasJha = jhaRepo.existsByWorkRequestId(entity.getId());
        long attachmentCount = permitAttachmentRepo.countByEntityTypeAndEntityId("WorkRequest", entity.getId());
        return convertToNgDto(entity, hasJha, (int) attachmentCount);
    }

    /**
     * Batch-optimized: converts a list of WorkRequests using only 2 batch queries
     * for JHA existence and attachment counts, instead of 2N individual queries.
     */
    public List<NgWorkRequestDto> convertToNgDtos(List<WorkRequest> entities) {
        if (entities == null || entities.isEmpty()) return List.of();

        List<Long> ids = entities.stream().map(WorkRequest::getId).toList();

        // 1 query: which WR ids have at least one JHA?
        Set<Long> idsWithJha = jhaRepo.findWorkRequestIdsWithJha(ids);

        // 1 query: attachment counts grouped by entity id
        Map<Long, Integer> attachmentCounts = new HashMap<>();
        permitAttachmentRepo.countByEntityTypeGroupedByEntityId("WorkRequest", ids)
            .forEach(row -> attachmentCounts.put((Long) row[0], ((Number) row[1]).intValue()));

        // Per-row isolation: one unmappable row must not fail the whole page. The
        // caller turns any throw here into a 400, which the table renders as "no
        // items found" — so a single bad association used to look like a search
        // that legitimately matched nothing.
        List<NgWorkRequestDto> dtos = new ArrayList<>(entities.size());
        for (WorkRequest e : entities) {
            try {
                dtos.add(convertToNgDto(e, idsWithJha.contains(e.getId()), attachmentCounts.getOrDefault(e.getId(), 0)));
            } catch (Exception ex) {
                log.error("Work request {} could not be mapped; returning it without its associations", e.getId(), ex);
                dtos.add(minimalNgDto(e, idsWithJha.contains(e.getId()), attachmentCounts.getOrDefault(e.getId(), 0)));
            }
        }
        return dtos;
    }

    /**
     * Last-resort DTO built from scalar columns only — no association is touched,
     * so it cannot throw. The row still reaches the table (id, dates, requester,
     * scope), just without status/work area/category.
     */
    private NgWorkRequestDto minimalNgDto(WorkRequest entity, boolean hasJha, int attachmentCount) {
        NgWorkRequestDto dto = new NgWorkRequestDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDateOfWorkToBePerformed(entity.getDateOfWorkToBePerformed());
        dto.setTimeOfWorkToBePerformed(entity.getTimeOfWorkToBePerformed());
        dto.setRequestedBy(entity.getRequestedBy());
        dto.setCompany(entity.getCompany());
        dto.setLocation(entity.getLocation());
        dto.setWorkScope(entity.getWorkScope());
        dto.setSharepointId(entity.getSharepointId());
        dto.setLocalUuid(entity.getLocalUuid());
        dto.setHasJha(hasJha);
        dto.setAttachmentCount(attachmentCount);
        dto.setAreaNotSpecified(true);
        return dto;
    }

    /** Core DTO mapping — no extra queries, all derived data passed in. */
    private NgWorkRequestDto convertToNgDto(WorkRequest entity, boolean hasJha, int attachmentCount) {
        NgWorkRequestDto dto = new NgWorkRequestDto();

        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setNote(entity.getNote());
        dto.setDateOfWorkToBePerformed(entity.getDateOfWorkToBePerformed());
        dto.setTimeOfWorkToBePerformed(entity.getTimeOfWorkToBePerformed());
        dto.setRequestedBy(entity.getRequestedBy());
        dto.setCompany(entity.getCompany());
        dto.setLocation(entity.getLocation());
        dto.setAffectedEquipment(entity.getAffectedEquipment());
        dto.setWorkScope(entity.getWorkScope());
        dto.setIsHotWorkRequired(entity.getIsHotWorkRequired());
        dto.setForeman(entity.getForeman());
        dto.setFireWatch(entity.getFireWatch());
        dto.setIsLotoRequired(entity.getIsLotoRequired());
        dto.setIsConfinedSpaceEntryRequired(entity.getIsConfinedSpaceEntryRequired());
        dto.setSpace(entity.getSpace());
        dto.setSharepointId(entity.getSharepointId());
        dto.setLocalUuid(entity.getLocalUuid());
        if(entity.getPermitStatus()!=null && entity.getPermitStatus().getName()!=null)dto.setStatus(entity.getPermitStatus().getName());
        dto.setHasJha(hasJha);
        dto.setAttachmentCount(attachmentCount);

        if (entity.getWorkArea() != null) {
            dto.setWorkArea(workAreaMapper.convertToDto(entity.getWorkArea()));
        }
        if (entity.getWorkCategory() != null) {
            dto.setWorkCategory(valueService.valueToDto(entity.getWorkCategory()));
        }
        if (entity.getDailyPermitPackage() != null) {
            dto.setDailyPermitPackageId(entity.getDailyPermitPackage().getId());
        }

        dto.setAreaNotSpecified(entity.getWorkArea() == null);
        dto.setSuggestedJobLogId(entity.getSuggestedJobLogId());
        dto.setDeclaredHazards(entity.getDeclaredHazards());
        dto.setDeclaredHotWorkMeasures(entity.getDeclaredHotWorkMeasures());
        dto.setDeclaredConfinedSpaceHazards(entity.getDeclaredConfinedSpaceHazards());
        dto.setHotWorkProfile(entity.getHotWorkProfile());
        dto.setHotWorkExposureScore(entity.getHotWorkProfile().getExposureScore());

        return dto;
    }

    public WorkRequest convertNgDtoToEntity(NgWorkRequestDto dto) {
        if (dto == null) return null;

        WorkRequest entity = new WorkRequest();
        if(dto.getId()!=null && dto.getId()!=0) entity = workRequestRepo.findById(dto.getId()).orElse(new WorkRequest());

        if(dto.getId()!=null && dto.getId()!=0) entity.setId(dto.getId());
        entity.setName(dto.getName());
        entity.setNote(dto.getNote());
        entity.setDateOfWorkToBePerformed(dto.getDateOfWorkToBePerformed());
        entity.setTimeOfWorkToBePerformed(dto.getTimeOfWorkToBePerformed());
        entity.setRequestedBy(dto.getRequestedBy());
        entity.setCompany(dto.getCompany());
        entity.setLocation(dto.getLocation());
        entity.setAffectedEquipment(dto.getAffectedEquipment());
        entity.setWorkScope(dto.getWorkScope());
        entity.setIsHotWorkRequired(dto.getIsHotWorkRequired());
        entity.setForeman(dto.getForeman());
        entity.setFireWatch(dto.getFireWatch());
        entity.setIsLotoRequired(dto.getIsLotoRequired());
        entity.setIsConfinedSpaceEntryRequired(dto.getIsConfinedSpaceEntryRequired());
        entity.setSpace(dto.getSpace());
        entity.setSharepointId(dto.getSharepointId());
        entity.setLocalUuid(dto.getLocalUuid());

        // id 0 is the Angular placeholder shape (BaseDto sets id = data.id || 0). It passes a
        // plain != null check, findById(0) is empty, and the old code then assigned that empty
        // result unconditionally -- silently UNLINKING the permit's work area. Also: the name is
        // now a FALLBACK, not an override, so an operator-typed value is no longer clobbered.
        if (dto.getWorkArea() != null && dto.getWorkArea().getId() != null && dto.getWorkArea().getId() != 0) {
            WorkArea workArea = workAreaRepo.findById(dto.getWorkArea().getId()).orElse(null);
            if (workArea != null) {
                entity.setWorkArea(workArea);
                if (entity.getLocation() == null || entity.getLocation().isBlank()) {
                    entity.setLocation(workArea.getName());
                }
            }
        }
        if (dto.getWorkCategory() != null && dto.getWorkCategory().getName() != null) {
            entity.setWorkCategory(valueService.createValue("Work Category", dto.getWorkCategory().getName()));
        } else {
            entity.setWorkCategory(null);
        }

        // Null means "this DTO carries no opinion", not "clear it". The Angular work-request form
        // does not render the hazard blocks, so it round-trips them as null; an unguarded set would
        // erase the requester's declaration the first time an operator saved any other field.
        if (dto.getDeclaredHazards() != null) entity.setDeclaredHazards(dto.getDeclaredHazards());
        if (dto.getDeclaredHotWorkMeasures() != null) entity.setDeclaredHotWorkMeasures(dto.getDeclaredHotWorkMeasures());
        if (dto.getDeclaredConfinedSpaceHazards() != null) {
            entity.setDeclaredConfinedSpaceHazards(dto.getDeclaredConfinedSpaceHazards());
        }
        if (dto.getHotWorkProfile() != null) entity.setHotWorkProfile(dto.getHotWorkProfile());
        if (dto.getSuggestedJobLogId() != null) entity.setSuggestedJobLogId(dto.getSuggestedJobLogId());

        return entity;
    }

    /**
     * Maps SharePoint DTO (from external sync) to a new WorkRequest entity.
     * Used by WorkRequestSyncService when creating entities from SharePoint data.
     */
    public WorkRequest fromSharePointDto(WorkRequestDto spDto) {
        if (spDto == null) return null;

        WorkRequest entity = new WorkRequest();
        entity.setDateOfWorkToBePerformed(spDto.getDateOfWorkToBePerformed());
        entity.setTimeOfWorkToBePerformed(spDto.getTimeOfWorkToBePerformed());
        entity.setRequestedBy(spDto.getRequestedBy());
        entity.setCompany(spDto.getCompany());
        entity.setLocation(spDto.getLocation());
        entity.setAffectedEquipment(spDto.getAffectedEquipment());
        entity.setWorkScope(spDto.getWorkScope());
        entity.setIsHotWorkRequired(spDto.getIsHotWorkRequired());
        entity.setForeman(spDto.getForeman());
        entity.setFireWatch(spDto.getFireWatch());
        entity.setIsLotoRequired(spDto.getIsLotoRequired());
        entity.setIsConfinedSpaceEntryRequired(spDto.getIsConfinedSpaceEntryRequired());
        entity.setSpace(spDto.getSpace());
        entity.setSharepointId(spDto.getSharepointId());
        entity.setLocalUuid(spDto.getLocalUuid());
        entity.setTimeSubmitted(spDto.getTimeSubmitted());
        entity.setSubmitterName(spDto.getSubmitterName());
        entity.setSubmitterEmail(spDto.getSubmitterEmail());
        entity.setSubmitterPhone(spDto.getSubmitterPhone());
        entity.setSubmitterCompany(spDto.getSubmitterCompany());
        if (spDto.getWorkCategoryName() != null && !spDto.getWorkCategoryName().isBlank()) {
            entity.setWorkCategory(valueService.createValue("Work Category", spDto.getWorkCategoryName()));
        }
        if (spDto.getWorkAreaName() != null && !spDto.getWorkAreaName().isBlank()) {
            workAreaRepo.findFirstByNameIgnoreCase(spDto.getWorkAreaName()).ifPresent(entity::setWorkArea);
        } else if (spDto.getLocation() != null && !spDto.getLocation().isBlank()) {
            workAreaRepo.findFirstByNameIgnoreCase(spDto.getLocation()).ifPresent(entity::setWorkArea);
        }
        // The whole reason the SharePoint column exists: a request that reached SharePoint through
        // the Power Automate fallback (hub unreachable) carries its declaration here and nowhere
        // else. Without this line it would be lost the moment the hub polled the item in.
        entity.applyDeclaredHazardsEnvelope(spDto.getDeclaredHazards());

        return entity;
    }

    /**
     * Updates an existing entity's fields from SharePoint data (for sync updates).
     */
    public void updateEntityFromSharePoint(WorkRequest entity, WorkRequestDto spDto) {
        if (entity == null || spDto == null) return;

        entity.setDateOfWorkToBePerformed(spDto.getDateOfWorkToBePerformed());
        entity.setTimeOfWorkToBePerformed(spDto.getTimeOfWorkToBePerformed());
        entity.setRequestedBy(spDto.getRequestedBy());
        entity.setCompany(spDto.getCompany());
        entity.setLocation(spDto.getLocation());
        entity.setAffectedEquipment(spDto.getAffectedEquipment());
        entity.setWorkScope(spDto.getWorkScope());
        entity.setIsHotWorkRequired(spDto.getIsHotWorkRequired());
        entity.setForeman(spDto.getForeman());
        entity.setFireWatch(spDto.getFireWatch());
        entity.setIsLotoRequired(spDto.getIsLotoRequired());
        entity.setIsConfinedSpaceEntryRequired(spDto.getIsConfinedSpaceEntryRequired());
        entity.setSpace(spDto.getSpace());

        // Preserve submitter fields: fill from SharePoint if local value is missing
        if (entity.getSubmitterName() == null && spDto.getSubmitterName() != null) {
            entity.setSubmitterName(spDto.getSubmitterName());
        }
        if (entity.getSubmitterEmail() == null && spDto.getSubmitterEmail() != null) {
            entity.setSubmitterEmail(spDto.getSubmitterEmail());
        }
        if (entity.getSubmitterPhone() == null && spDto.getSubmitterPhone() != null) {
            entity.setSubmitterPhone(spDto.getSubmitterPhone());
        }
        if (entity.getSubmitterCompany() == null && spDto.getSubmitterCompany() != null) {
            entity.setSubmitterCompany(spDto.getSubmitterCompany());
        }
        if (entity.getLocalUuid() == null && spDto.getLocalUuid() != null) {
            entity.setLocalUuid(spDto.getLocalUuid());
        }
        if (entity.getTimeSubmitted() == null && spDto.getTimeSubmitted() != null) {
            entity.setTimeSubmitted(spDto.getTimeSubmitted());
        }
        if (spDto.getWorkCategoryName() != null && !spDto.getWorkCategoryName().isBlank()) {
            entity.setWorkCategory(valueService.createValue("Work Category", spDto.getWorkCategoryName()));
        }
        if (spDto.getWorkAreaName() != null && !spDto.getWorkAreaName().isBlank()) {
            workAreaRepo.findFirstByNameIgnoreCase(spDto.getWorkAreaName()).ifPresent(entity::setWorkArea);
        } else if (spDto.getLocation() != null && !spDto.getLocation().isBlank()) {
            workAreaRepo.findFirstByNameIgnoreCase(spDto.getLocation()).ifPresent(entity::setWorkArea);
        }
        entity.applyDeclaredHazardsEnvelope(spDto.getDeclaredHazards());
    }



    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
