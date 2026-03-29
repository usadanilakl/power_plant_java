package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.permits.WorkCategoryProfileDto;
import com.dk_power.power_plant_java.entities.permits.WorkCategoryProfile;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.repository.permits.WorkCategoryProfileRepo;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class WorkCategoryProfileMapper implements BaseMapper {
    private final WorkCategoryProfileRepo profileRepo;

    @Override
    public ModelMapper getMapper() {
        return new ModelMapper();
    }

    public WorkCategoryProfileDto convertToDto(WorkCategoryProfile entity) {
        if (entity == null) return null;

        WorkCategoryProfileDto dto = new WorkCategoryProfileDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDateCreated(entity.getDateCreated());
        dto.setDateModified(entity.getDateModified());

        if (entity.getWorkCategory() != null) {
            ValueDto categoryDto = new ValueDto();
            categoryDto.setId(entity.getWorkCategory().getId());
            categoryDto.setName(entity.getWorkCategory().getName());
            dto.setWorkCategory(categoryDto);
        }

        try {
            dto.setStandardHazards(entity.getStandardHazards());
        } catch (Exception e) {
            // handle deserialization issue
        }

        try {
            dto.setStandardHotWorkMeasures(entity.getStandardHotWorkMeasures());
        } catch (Exception e) {
            // handle deserialization issue
        }

        try {
            dto.setStandardConfinedSpaceHazards(entity.getStandardConfinedSpaceHazards());
        } catch (Exception e) {
            // handle deserialization issue
        }

        return dto;
    }

    public WorkCategoryProfile convertToEntity(WorkCategoryProfileDto dto) {
        if (dto == null) return null;

        WorkCategoryProfile entity;
        if (dto.getId() != null && dto.getId() != 0) {
            entity = profileRepo.findById(dto.getId()).orElse(new WorkCategoryProfile());
        } else {
            entity = new WorkCategoryProfile();
        }

        if (dto.getName() != null) entity.setName(dto.getName());

        try {
            if (dto.getStandardHazards() != null) {
                entity.setStandardHazards(dto.getStandardHazards());
            }
        } catch (Exception e) {
            // handle serialization issue
        }

        try {
            if (dto.getStandardHotWorkMeasures() != null) {
                entity.setStandardHotWorkMeasures(dto.getStandardHotWorkMeasures());
            }
        } catch (Exception e) {
            // handle serialization issue
        }

        try {
            if (dto.getStandardConfinedSpaceHazards() != null) {
                entity.setStandardConfinedSpaceHazards(dto.getStandardConfinedSpaceHazards());
            }
        } catch (Exception e) {
            // handle serialization issue
        }

        return entity;
    }
}
