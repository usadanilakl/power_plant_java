package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.DailyPermitPackageDto;
import com.dk_power.power_plant_java.entities.permits.DailyPermitPackage;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.mappers.LotoMapper;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;
@RequiredArgsConstructor
@Component
public class DailyPermitPackageMapper implements BaseMapper {

    private final SafeWorkMapper safeWorkMapper;
    private final HotWorkMapper hotWorkMapper;
    private final ConfinedSpaceMapper confinedSpaceMapper;
    private final LotoMapper lotoMapper;
    private final ModelMapper modelMapper;

    public DailyPermitPackageDto convertToDto(DailyPermitPackage entity) {
        if (entity == null) return null;

        DailyPermitPackageDto dto = new DailyPermitPackageDto();
        dto.setId(entity.getId());

        if (entity.getSafeWorks() != null && !entity.getSafeWorks().isEmpty()) {
            dto.setSafeWorks(
                entity.getSafeWorks()
                    .stream()
                    .map(safeWorkMapper::convertToDto)
                    .toList()
            );
        }

        if (entity.getHotWorks() != null && !entity.getHotWorks().isEmpty()) {
            dto.setHotWorks(
                entity.getHotWorks()
                    .stream()
                    .map(hotWorkMapper::convertToDto)
                    .toList()
            );
        }

        if (entity.getConfinedSpaces() != null && !entity.getConfinedSpaces().isEmpty()) {
            dto.setConfinedSpaces(
                entity.getConfinedSpaces()
                    .stream()
                    .map(confinedSpaceMapper::convertToDto)
                    .toList()
            );
        }

        if (entity.getLotos() != null && !entity.getLotos().isEmpty()) {
            dto.setLotos(
                entity.getLotos()
                    .stream()
                    .map(lotoMapper::convertToDto)
                    .toList()
            );
        }

        return dto;
    }

    public DailyPermitPackage convertToEntity(DailyPermitPackageDto dto) {
        if (dto == null) return null;

        DailyPermitPackage entity = new DailyPermitPackage();
        entity.setId(dto.getId());

        if (dto.getSafeWorks() != null && !dto.getSafeWorks().isEmpty()) {
            entity.setSafeWorks(
                dto.getSafeWorks()
                    .stream()
                    .map(safeWorkMapper::convertToEntity)
                    .collect(Collectors.toSet())
            );
        }

        if (dto.getHotWorks() != null && !dto.getHotWorks().isEmpty()) {
            entity.setHotWorks(
                dto.getHotWorks()
                    .stream()
                    .map(hotWorkMapper::convertToEntity)
                    .collect(Collectors.toSet())
            );
        }

        if (dto.getConfinedSpaces() != null && !dto.getConfinedSpaces().isEmpty()) {
            entity.setConfinedSpaces(
                dto.getConfinedSpaces()
                    .stream()
                    .map(confinedSpaceMapper::convertToEntity)
                    .collect(Collectors.toSet())
            );
        }

        if (dto.getLotos() != null && !dto.getLotos().isEmpty()) {
            entity.setLotos(
                dto.getLotos()
                    .stream()
                    .map(lotoMapper::convertToEntity)
                    .collect(Collectors.toSet())
            );
        }

        return entity;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
