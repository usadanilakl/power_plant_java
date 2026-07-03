package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.permits.WorkAreaDto;
import com.dk_power.power_plant_java.dto.permits.WorkAreaMapShapeDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.entities.permits.WorkAreaMapShape;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.repository.permits.WorkAreaMapShapeRepo;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class WorkAreaMapper implements BaseMapper {
    private final WorkAreaRepo workAreaRepo;
    private final WorkAreaMapShapeRepo shapeRepo;

    @Override
    public ModelMapper getMapper() {
        return new ModelMapper();
    }

    public WorkAreaDto convertToDto(WorkArea entity) {
        if (entity == null) return null;

        WorkAreaDto dto = new WorkAreaDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setDateCreated(entity.getDateCreated());
        dto.setDateModified(entity.getDateModified());

        if (entity.getAreaType() != null) {
            ValueDto areaTypeDto = new ValueDto();
            areaTypeDto.setId(entity.getAreaType().getId());
            areaTypeDto.setName(entity.getAreaType().getName());
            dto.setAreaType(areaTypeDto);
        }

        try {
            dto.setConstantHazards(entity.getConstantHazards());
        } catch (Exception e) {
            // handle deserialization issue
        }

        try {
            dto.setConstantHotWorkMeasures(entity.getConstantHotWorkMeasures());
        } catch (Exception e) {
            // handle deserialization issue
        }

        try {
            dto.setConstantConfinedSpaceHazards(entity.getConstantConfinedSpaceHazards());
        } catch (Exception e) {
            // handle deserialization issue
        }

        if (entity.getConstantLotos() != null) {
            dto.setConstantLotoIds(
                    entity.getConstantLotos().stream()
                            .map(LotoStandard::getId)
                            .collect(Collectors.toList())
            );
        }

        if (entity.getLocations() != null) {
            dto.setLocationIds(
                    entity.getLocations().stream()
                            .map(Value::getId)
                            .collect(Collectors.toList())
            );
        }

        if (entity.getShape() != null) {
            dto.setShapeId(entity.getShape().getId());
        }

        dto.setPhysicalObjectId(entity.getPhysicalObjectId());

        return dto;
    }

    public WorkArea convertToEntity(WorkAreaDto dto) {
        if (dto == null) return null;

        WorkArea entity;
        if (dto.getId() != null && dto.getId() != 0) {
            entity = workAreaRepo.findById(dto.getId()).orElse(new WorkArea());
        } else {
            entity = new WorkArea();
        }

        if (dto.getName() != null) entity.setName(dto.getName());
        if (dto.getDescription() != null) entity.setDescription(dto.getDescription());

        try {
            if (dto.getConstantHazards() != null) {
                entity.setConstantHazards(dto.getConstantHazards());
            }
        } catch (Exception e) {
            // handle serialization issue
        }

        try {
            if (dto.getConstantHotWorkMeasures() != null) {
                entity.setConstantHotWorkMeasures(dto.getConstantHotWorkMeasures());
            }
        } catch (Exception e) {
            // handle serialization issue
        }

        try {
            if (dto.getConstantConfinedSpaceHazards() != null) {
                entity.setConstantConfinedSpaceHazards(dto.getConstantConfinedSpaceHazards());
            }
        } catch (Exception e) {
            // handle serialization issue
        }

        if (dto.getShapeId() != null) {
            shapeRepo.findById(dto.getShapeId()).ifPresent(entity::setShape);
        }

        // Nullable plant-tree anchor: set only when the DTO carries it, so an edit that omits it can't wipe the
        // binding. Unbinding goes through the node's DELETE /{id}/work-areas/{workAreaId} endpoint.
        if (dto.getPhysicalObjectId() != null) {
            entity.setPhysicalObjectId(dto.getPhysicalObjectId());
        }

        return entity;
    }

    public WorkAreaMapShapeDto convertShapeToDto(WorkAreaMapShape entity) {
        if (entity == null) return null;

        WorkAreaMapShapeDto dto = new WorkAreaMapShapeDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setCoordinates(entity.getCoordinates());
        dto.setOriginalPictureSize(entity.getOriginalPictureSize());
        dto.setLabel(entity.getLabel());
        dto.setDateCreated(entity.getDateCreated());
        dto.setDateModified(entity.getDateModified());

        List<WorkArea> areasForShape = workAreaRepo.findByShape_Id(entity.getId());
        dto.setWorkAreaIds(
                areasForShape.stream()
                        .map(WorkArea::getId)
                        .collect(Collectors.toList())
        );

        return dto;
    }

    public WorkAreaMapShape convertShapeToEntity(WorkAreaMapShapeDto dto) {
        if (dto == null) return null;

        WorkAreaMapShape entity;
        if (dto.getId() != null && dto.getId() != 0) {
            entity = shapeRepo.findById(dto.getId()).orElse(new WorkAreaMapShape());
        } else {
            entity = new WorkAreaMapShape();
        }

        if (dto.getCoordinates() != null) entity.setCoordinates(dto.getCoordinates());
        if (dto.getOriginalPictureSize() != null) entity.setOriginalPictureSize(dto.getOriginalPictureSize());
        if (dto.getLabel() != null) entity.setLabel(dto.getLabel());

        return entity;
    }
}
