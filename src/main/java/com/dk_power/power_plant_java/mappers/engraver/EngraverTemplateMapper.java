package com.dk_power.power_plant_java.mappers.engraver;

import com.dk_power.power_plant_java.dto.engraver.EngraverTemplateDto;
import com.dk_power.power_plant_java.entities.engraver.EngraverTemplate;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.repository.engraver.EngraverTemplateRepo;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EngraverTemplateMapper implements BaseMapper {
    private final EngraverTemplateRepo repo;

    @Override
    public ModelMapper getMapper() {
        return new ModelMapper();
    }

    public EngraverTemplateDto convertToDto(EngraverTemplate entity) {
        if (entity == null) return null;
        EngraverTemplateDto dto = new EngraverTemplateDto();
        if (entity.getId() != null) dto.setId(entity.getId());
        if (entity.getName() != null) dto.setName(entity.getName());
        if (entity.getDescription() != null) dto.setDescription(entity.getDescription());
        if (entity.getTagSize() != null) dto.setTagSize(entity.getTagSize());
        if (entity.getDataStructure() != null) dto.setDataStructure(entity.getDataStructure());
        if (entity.getBatchSize() != null) dto.setBatchSize(entity.getBatchSize());
        if (entity.getFilename() != null) dto.setFilename(entity.getFilename());
        if (entity.getIsDefault() != null) dto.setIsDefault(entity.getIsDefault());
        if (entity.getDateCreated() != null) dto.setDateCreated(entity.getDateCreated());
        if (entity.getDateModified() != null) dto.setDateModified(entity.getDateModified());
        if (entity.getCreatedBy() != null) dto.setCreatedBy(entity.getCreatedBy());
        return dto;
    }

    public EngraverTemplate convertToEntity(EngraverTemplateDto dto) {
        if (dto == null) return null;
        EngraverTemplate entity = null;
        if (dto.getId() != null && dto.getId() != 0) {
            entity = repo.findById(dto.getId()).orElse(new EngraverTemplate());
        }
        if (entity == null) entity = new EngraverTemplate();

        if (dto.getId() != null && dto.getId() != 0) entity.setId(dto.getId());
        if (dto.getName() != null) entity.setName(dto.getName());
        if (dto.getDescription() != null) entity.setDescription(dto.getDescription());
        if (dto.getTagSize() != null) entity.setTagSize(dto.getTagSize());
        if (dto.getDataStructure() != null) entity.setDataStructure(dto.getDataStructure());
        if (dto.getBatchSize() != null) entity.setBatchSize(dto.getBatchSize());
        if (dto.getFilename() != null) entity.setFilename(dto.getFilename());
        if (dto.getIsDefault() != null) entity.setIsDefault(dto.getIsDefault());
        return entity;
    }
}
