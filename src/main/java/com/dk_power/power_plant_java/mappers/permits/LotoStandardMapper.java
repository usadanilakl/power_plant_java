package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.browser.BrLotoStandard;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardIdDto;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.mappers.LotoPointMapper;
import com.dk_power.power_plant_java.repository.loto.LotoStandardRepo;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class LotoStandardMapper implements BaseMapper {
    private final ModelMapper mapper;
    private final LotoStandardRepo lotoStandardRepo;
    private final LotoPointService lotoPointService;

    public LotoStandardMapper(ModelMapper mapper, LotoStandardRepo lotoStandardRepo, LotoPointService lotoPointService) {
        this.mapper = mapper;
        this.lotoStandardRepo = lotoStandardRepo;
        this.lotoPointService = lotoPointService;
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
                                .collect(Collectors.toSet()))
                        .orElse(Collections.emptySet())
        );

        return dto;

    }

    public LotoStandard convertToEntity(LotoStandardDto dto) {
        if (dto == null) {
            return null;
        }

        LotoStandard entity = null;
        if(dto.getId()!=null) entity = lotoStandardRepo.findById(dto.getId()).orElse(null);
        if(entity==null) entity = new LotoStandard();
        entity.setName(Optional.ofNullable(dto.getName()).orElse(null));
        entity.setDescription(Optional.ofNullable(dto.getDescription()).orElse(null));
        entity.setLotoPoints(
                Optional.ofNullable(dto.getLotoPoints())
                       .map(points -> points.stream()
                               .filter(Objects::nonNull)
                               .map(ls->lotoPointService.getEntityById(ls.getId()))
                               .collect(Collectors.toSet()))
                       .orElse(Collections.emptySet())
        );

        return entity;
    }

    public LotoStandard convertIdDtoToEntity(LotoStandardIdDto dto) {
        if (dto == null) {
            return null;
        }

        LotoStandard entity = null;
        if(dto.getId()!=null) entity = lotoStandardRepo.findById(dto.getId()).orElse(new LotoStandard());
        if(entity==null) entity = new LotoStandard();

        if(dto.getName()!=null && !dto.getName().isEmpty())entity.setName(Optional.ofNullable(dto.getName()).orElse(null));
        if(dto.getDescription()!=null && !dto.getDescription().isEmpty())entity.setDescription(Optional.ofNullable(dto.getDescription()).orElse(null));
        if(dto.getLotoPoints()!=null)entity.setLotoPoints(
                Optional.ofNullable(dto.getLotoPoints())
                        .map(points -> points.stream()
                                .filter(Objects::nonNull)
                                .map(lotoPointService::getEntityById)
                                .collect(Collectors.toSet()))
                        .orElse(Collections.emptySet())
        );

        return entity;
    }
}
