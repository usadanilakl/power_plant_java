package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.JobLogDto;
import com.dk_power.power_plant_java.entities.permits.JobLog;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;
@Component
@RequiredArgsConstructor
public class JobLogMapper implements BaseMapper {

    private final DailyPermitPackageMapper dailyPermitPackageMapper;
    private final ModelMapper modelMapper;

    public JobLogDto convertToDto(JobLog entity) {
        if (entity == null) return null;

        JobLogDto dto = new JobLogDto();
        dto.setId(entity.getId());

        if (entity.getPackages() != null && !entity.getPackages().isEmpty()) {
            dto.setPackages(
                entity.getPackages()
                    .stream()
                    .map(dailyPermitPackageMapper::convertToDto)
                    .collect(Collectors.toSet())
            );
        }

        return dto;
    }

    public JobLog convertToEntity(JobLogDto dto) {
        if (dto == null) return null;

        JobLog entity = new JobLog();
        entity.setId(dto.getId());

        if (dto.getPackages() != null && !dto.getPackages().isEmpty()) {
            entity.setPackages(
                dto.getPackages()
                    .stream()
                    .map(dailyPermitPackageMapper::convertToEntity)
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
