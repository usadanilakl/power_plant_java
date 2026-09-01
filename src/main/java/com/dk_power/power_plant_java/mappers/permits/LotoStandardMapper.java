package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardIdDto;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.mappers.ValueMapper;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import com.dk_power.power_plant_java.repository.loto.LotoStandardRepo;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class LotoStandardMapper implements BaseMapper {
    private final ModelMapper mapper;
    private final LotoStandardRepo lotoStandardRepo;
    private final LotoPointService lotoPointService;
    private final ValueMapper valueMapper;
    private final ValueRepo valueRepo;

    public LotoStandardMapper(ModelMapper mapper, LotoStandardRepo lotoStandardRepo, LotoPointService lotoPointService, ValueMapper valueMapper, ValueRepo valueRepo) {
        this.mapper = mapper;
        this.lotoStandardRepo = lotoStandardRepo;
        this.lotoPointService = lotoPointService;
        this.valueMapper = valueMapper;
        this.valueRepo = valueRepo;
    }

    @Override
    public ModelMapper getMapper() {
        return mapper;
    }

    public LotoStandardDto convertToDto(LotoStandard entity) {
        if (entity == null) {
            return null;
        }

        LotoStandardDto dto = new LotoStandardDto();
        dto.setId(entity.getId());
        dto.setName(Optional.ofNullable(entity.getName()).orElse(""));
        dto.setDescription(Optional.ofNullable(entity.getDescription()).orElse(""));
        dto.setLotoPoints(
                Optional.ofNullable(entity.getLotoPoints())
                        .map(points -> points.stream()
                                .filter(Objects::nonNull)
                                .map(lotoPointService::convertToDto)
                                .toList())
                        .orElse(new ArrayList<>())
        );
        dto.setGroups(
                Optional.ofNullable(entity.getGroups())
                        .map(groups -> groups.stream()
                                .filter(Objects::nonNull)
                                .map(valueMapper::convertToDto)
                                .collect(Collectors.toSet()))
                        .orElse(new HashSet<>())
        );

        // Development workflow — read-only on the DTO; mutated via service workflow methods
        dto.setDevelopmentStatus(entity.getDevelopmentStatus() != null ? valueMapper.convertToDto(entity.getDevelopmentStatus()) : null);
        dto.setCurrentVersion(entity.getCurrentVersion());
        dto.setSubmittedForVerificationBy(entity.getSubmittedForVerificationBy());
        dto.setSubmittedForVerificationAt(entity.getSubmittedForVerificationAt());
        dto.setVerifiedBy(entity.getVerifiedBy());
        dto.setVerifiedAt(entity.getVerifiedAt());
        dto.setWalkdownBy(entity.getWalkdownBy());
        dto.setWalkdownAt(entity.getWalkdownAt());
        dto.setReadyForTestingBy(entity.getReadyForTestingBy());
        dto.setReadyForTestingAt(entity.getReadyForTestingAt());
        dto.setManagerApprovedBy(entity.getManagerApprovedBy());
        dto.setManagerApprovedAt(entity.getManagerApprovedAt());
        dto.setPendingReviewSince(entity.getPendingReviewSince());

        dto.setPointPrerequisites(entity.getPointPrerequisites());

        dto.setInstallPrerequisitesText(entity.getInstallPrerequisitesText());
        dto.setInstallHazardControlText(entity.getInstallHazardControlText());
        dto.setInstallProcedureText(entity.getInstallProcedureText());
        dto.setRemovalPrerequisitesText(entity.getRemovalPrerequisitesText());
        dto.setRemovalHazardControlText(entity.getRemovalHazardControlText());
        dto.setRemovalProcedureText(entity.getRemovalProcedureText());
        dto.setRemovalReversesInstallOrder(entity.isRemovalReversesInstallOrder());

        return dto;

    }

    public LotoStandard convertToEntity(LotoStandardDto dto) {
        if (dto == null) {
            return null;
        }

        LotoStandard entity = null;
        if (dto.getId() != null) entity = lotoStandardRepo.findById(dto.getId()).orElse(null);
        if (entity == null) entity = new LotoStandard();
        entity.setName(Optional.ofNullable(dto.getName()).orElse(null));
        entity.setDescription(Optional.ofNullable(dto.getDescription()).orElse(null));
        entity.setLotoPoints(
                Optional.ofNullable(dto.getLotoPoints())
                        .map(points -> points.stream()
                                .filter(Objects::nonNull)
                                .map(ls -> lotoPointService.getEntityById(ls.getId()))
                                .filter(Objects::nonNull) // getEntityById returns null for a point not present locally
                                                          // (device-prefixed id not synced yet, or soft-deleted) — a
                                                          // null in the @ManyToMany list scrambles Hibernate's cascade
                                                          // and flushes join-inserts before the parent → FK violation.
                                .distinct()               // lotoPoints is a List: a duplicate point (e.g. two source
                                                          // points resolving to the same counterpart) makes Hibernate
                                                          // insert the same (standard, point) join row twice → composite
                                                          // PK violation. Same managed instance per id → distinct dedups.
                                .toList())
                        .orElse(new ArrayList<>())
        );
        entity.setGroups(
                Optional.ofNullable(dto.getGroups())
                        .map(groups -> groups.stream()
                                .filter(Objects::nonNull)
                                .map(valueMapper::convertToEntity)
                                .collect(Collectors.toSet()))
                        .orElse(new HashSet<>())
        );

        return entity;
    }

    public LotoStandard convertIdDtoToEntity(LotoStandardIdDto dto) {
        if (dto == null) {
            return null;
        }

        LotoStandard entity = null;
        if (dto.getId() != null) entity = lotoStandardRepo.findById(dto.getId()).orElse(new LotoStandard());
        if (entity == null) entity = new LotoStandard();

        if (dto.getName() != null && !dto.getName().isEmpty())
            entity.setName(Optional.ofNullable(dto.getName()).orElse(null));
        if (dto.getDescription() != null && !dto.getDescription().isEmpty())
            entity.setDescription(Optional.ofNullable(dto.getDescription()).orElse(null));
        if (dto.getLotoPoints() != null) entity.setLotoPoints(
                Optional.ofNullable(dto.getLotoPoints())
                        .map(points -> points.stream()
                                .filter(Objects::nonNull)
                                .map(lotoPointService::getEntityById)
                                .filter(Objects::nonNull) // drop unresolved point ids (not synced locally / soft-deleted);
                                                          // a null in the @ManyToMany list causes cascade-ordering FK
                                                          // violations on the parent LotoStandard insert.
                                .distinct()               // dedup: a repeated point id would insert the same
                                                          // (standard, point) join row twice → composite-PK violation
                                                          // (the actual counterpart-save failure). This is the counterpart
                                                          // path — the counterpart preview can map two sources to one point.
                                .toList())
                        .orElse(new ArrayList<>())
        );
        if (dto.getGroups() != null) {
            // Create a new mutable HashSet to avoid immutable collection issues with Hibernate
            Set<com.dk_power.power_plant_java.entities.categories.Value> newGroups = new HashSet<>(
                Optional.ofNullable(dto.getGroups())
                        .map(groups -> groups.stream()
                                .filter(Objects::nonNull)
                                .map(id -> valueRepo.findById(id).orElse(null))
                                .filter(Objects::nonNull)
                                .collect(Collectors.toSet()))
                        .orElse(new HashSet<>())
            );

            // Replace the entire collection instead of trying to modify it
            entity.setGroups(newGroups);
        }

        return entity;
    }
}
