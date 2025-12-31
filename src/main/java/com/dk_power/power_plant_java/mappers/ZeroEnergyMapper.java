
package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.zero_energy.ZeroEnergyDto;
import com.dk_power.power_plant_java.dto.permits.zero_energy.ZeroEnergyIdDto;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.ZeroEnergy;
import com.dk_power.power_plant_java.sevice.angular.loto.NgZeroEnergyService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Component
public class ZeroEnergyMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final ValueService valueService;
    private final LotoPointService lotoPointService;
    private final NgZeroEnergyService zeroEnergyService;

    public ZeroEnergyMapper(ModelMapper modelMapper,
                            ValueService valueService,
                            @Lazy LotoPointService lotoPointService,
                            @Lazy NgZeroEnergyService zeroEnergyService) {
        this.modelMapper = modelMapper;
        this.valueService = valueService;
        this.lotoPointService = lotoPointService;
        this.zeroEnergyService = zeroEnergyService;
    }

    /**
     * Converts ZeroEnergy entity to ZeroEnergyDto with full object references.
     */
    public ZeroEnergyDto convertToDto(ZeroEnergy entity) {
        if (entity == null) {
            return null;
        }

        ZeroEnergyDto dto = new ZeroEnergyDto();
        
        // Base fields
        if (entity.getId() != null) dto.setId(entity.getId());
        if (entity.getName() != null) dto.setName(entity.getName());
        if (entity.getNote() != null) dto.setNote(entity.getNote());
        if (entity.getDeleted() != null) dto.setDeleted(entity.getDeleted());
        if (entity.getCreatedBy() != null) dto.setCreatedBy(entity.getCreatedBy());
        if (entity.getObjectType() != null) dto.setObjectType(entity.getObjectType());
        if (entity.getDataServiceItemId() != null) dto.setDataServiceItemId(entity.getDataServiceItemId());
        if (entity.getRefactorNotes() != null) dto.setRefactorNotes(entity.getRefactorNotes());
        if (entity.getDateCreated() != null) dto.setDateCreated(entity.getDateCreated());
        if (entity.getDateModified() != null) dto.setDateModified(entity.getDateModified());

        // ZeroEnergy specific fields
        if (entity.getZeroEnergyTemplate() != null) {
            dto.setZeroEnergyTemplate(valueService.convertToDto(entity.getZeroEnergyTemplate()));
        }

        // Convert template LOTO point IDs to full DTOs
        if (entity.getTemplateLotoPointIds() != null && !entity.getTemplateLotoPointIds().isEmpty()) {
            java.util.List<LotoPointDto> templateLotoPoints = new java.util.ArrayList<>();
            for (Long lpId : entity.getTemplateLotoPointIds()) {
                LotoPoint lp = lotoPointService.getEntityById(lpId);
                if (lp != null) {
                    LotoPointDto lpDto = new LotoPointDto();
                    lpDto.setId(lp.getId());
                    lpDto.setTagNumber(lp.getTagNumber());
                    lpDto.setDescription(lp.getDescription());
                    templateLotoPoints.add(lpDto);
                }
            }
            dto.setTemplateLotoPoints(templateLotoPoints);
        }

        // Resolved method from @Transient getter
        if (entity.getMethod() != null) {
            dto.setMethod(entity.getMethod());
        }

        return dto;
    }

    /**
     * Converts ZeroEnergy entity to ZeroEnergyIdDto with ID references only.
     */
    public ZeroEnergyIdDto convertToIdDto(ZeroEnergy entity) {
        if (entity == null) {
            return null;
        }

        ZeroEnergyIdDto dto = new ZeroEnergyIdDto();
        
        // Base fields
        if (entity.getId() != null) dto.setId(entity.getId());
        if (entity.getName() != null) dto.setName(entity.getName());
        if (entity.getNote() != null) dto.setNote(entity.getNote());
        if (entity.getDeleted() != null) dto.setDeleted(entity.getDeleted());
        if (entity.getCreatedBy() != null) dto.setCreatedBy(entity.getCreatedBy());
        if (entity.getObjectType() != null) dto.setObjectType(entity.getObjectType());
        if (entity.getDataServiceItemId() != null) dto.setDataServiceItemId(entity.getDataServiceItemId());
        if (entity.getRefactorNotes() != null) dto.setRefactorNotes(entity.getRefactorNotes());
        if (entity.getDateCreated() != null) dto.setDateCreated(entity.getDateCreated());
        if (entity.getDateModified() != null) dto.setDateModified(entity.getDateModified());

        // ZeroEnergy specific fields - IDs only
        if (entity.getZeroEnergyTemplate() != null) {
            dto.setZeroEnergyTemplateId(entity.getZeroEnergyTemplate().getId());
        }

        // Set template LOTO point IDs
        if (entity.getTemplateLotoPointIds() != null && !entity.getTemplateLotoPointIds().isEmpty()) {
            dto.setTemplateLotoPointIds(new java.util.ArrayList<>(entity.getTemplateLotoPointIds()));
        }

        // Resolved method from @Transient getter
        if (entity.getMethod() != null) {
            dto.setMethod(entity.getMethod());
            dto.setResolvedMethod(entity.getMethod());
        }

        return dto;
    }

    /**
     * Converts ZeroEnergyDto to ZeroEnergy entity.
     */
    public ZeroEnergy convertToEntity(ZeroEnergyDto dto) {
        if (dto == null) {
            return null;
        }

        ZeroEnergy entity;
        if (dto.getId() == null || dto.getId() == 0) {
            entity = new ZeroEnergy();
        } else {
            entity = zeroEnergyService.getEntityById(dto.getId());
        }

        // Base fields
        if (dto.getName() != null) entity.setName(dto.getName());
        if (dto.getNote() != null) entity.setNote(dto.getNote());
        if (dto.getDeleted() != null) entity.setDeleted(dto.getDeleted());
        if (dto.getCreatedBy() != null) entity.setCreatedBy(dto.getCreatedBy());
        if (dto.getObjectType() != null) entity.setObjectType(dto.getObjectType());
        if (dto.getDataServiceItemId() != null) entity.setDataServiceItemId(dto.getDataServiceItemId());
        if (dto.getRefactorNotes() != null) entity.setRefactorNotes(dto.getRefactorNotes());
        if (dto.getDateCreated() != null) entity.setDateCreated(dto.getDateCreated());
        if (dto.getDateModified() != null) entity.setDateModified(dto.getDateModified());

        // ZeroEnergy specific fields
        if (dto.getZeroEnergyTemplate() != null) {
            entity.setZeroEnergyTemplate(valueService.convertToEntity(dto.getZeroEnergyTemplate()));
        }

        // Convert template LOTO point DTOs to IDs
        if (dto.getTemplateLotoPoints() != null && !dto.getTemplateLotoPoints().isEmpty()) {
            java.util.List<Long> lpIds = dto.getTemplateLotoPoints().stream()
                    .map(LotoPointDto::getId)
                    .filter(id -> id != null)
                    .collect(java.util.stream.Collectors.toList());
            entity.setTemplateLotoPointIdsList(lpIds);
        }

        return entity;
    }

    /**
     * Converts ZeroEnergyIdDto to ZeroEnergy entity.
     * Uses ID references to load related entities.
     */
    public ZeroEnergy convertIdDtoToEntity(ZeroEnergyIdDto dto) {
        if (dto == null) {
            return null;
        }

        ZeroEnergy entity;
        if (dto.getId() == null || dto.getId() == 0) {
            entity = new ZeroEnergy();
        } else {
            entity = zeroEnergyService.findById(dto.getId()).orElse(new ZeroEnergy());
        }

        // Base fields
        if (dto.getId() != null && dto.getId() != 0) entity.setId(dto.getId());
        if (dto.getName() != null) entity.setName(dto.getName());
        if (dto.getNote() != null) entity.setNote(dto.getNote());
        if (dto.getDeleted() != null) entity.setDeleted(dto.getDeleted());
        if (dto.getCreatedBy() != null) entity.setCreatedBy(dto.getCreatedBy());
        if (dto.getObjectType() != null) entity.setObjectType(dto.getObjectType());
        if (dto.getDataServiceItemId() != null) entity.setDataServiceItemId(dto.getDataServiceItemId());
        if (dto.getRefactorNotes() != null) entity.setRefactorNotes(dto.getRefactorNotes());
        if (dto.getDateCreated() != null) entity.setDateCreated(dto.getDateCreated());
        if (dto.getDateModified() != null) entity.setDateModified(dto.getDateModified());

        // ZeroEnergy specific fields
        if (dto.getZeroEnergyTemplateId() != null) {
            entity.setZeroEnergyTemplate(valueService.findById(dto.getZeroEnergyTemplateId()).orElse(null));
        }

        // Set template LOTO point IDs
        if (dto.getTemplateLotoPointIds() != null && !dto.getTemplateLotoPointIds().isEmpty()) {
            entity.setTemplateLotoPointIdsList(dto.getTemplateLotoPointIds());
        }

        return entity;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
