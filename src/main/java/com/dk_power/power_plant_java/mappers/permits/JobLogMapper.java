package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.JobLogDto;
import com.dk_power.power_plant_java.entities.permits.JobLog;
import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.mappers.ValueMapper;
import com.dk_power.power_plant_java.repository.permits.JobLogRepo;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;
@Component
@RequiredArgsConstructor
public class JobLogMapper implements BaseMapper {

    private final DailyPermitPackageMapper dailyPermitPackageMapper;
    private final WorkRequestMapper workRequestMapper;
    private final WorkAreaMapper workAreaMapper;
    private final ValueMapper valueMapper;
    private final JobLogRepo jobLogRepo;
    private final WorkRequestRepo workRequestRepo;
    private final WorkAreaRepo workAreaRepo;
    private final ModelMapper modelMapper;

    public JobLogDto convertToDto(JobLog entity) {
        if (entity == null) return null;

        JobLogDto dto = new JobLogDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());

        if (entity.getPackages() != null && !entity.getPackages().isEmpty()) {
            dto.setPackages(
                entity.getPackages()
                    .stream()
                    .map(dailyPermitPackageMapper::convertToDto)
                    .collect(Collectors.toSet())
            );
        }

        dto.setWorkScope(entity.getWorkScope());
        dto.setCompany(entity.getCompany());
        dto.setForeman(entity.getForeman());
        dto.setLocation(entity.getLocation());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        dto.setPermitNumber(entity.getPermitNumber());

        if (entity.getJobStatus() != null) {
            dto.setJobStatus(valueMapper.convertToDto(entity.getJobStatus()));
        }
        if (entity.getOriginatingWorkRequest() != null) {
            dto.setOriginatingWorkRequest(workRequestMapper.convertToNgDto(entity.getOriginatingWorkRequest()));
        }
        if (entity.getWorkArea() != null) {
            dto.setWorkArea(workAreaMapper.convertToDto(entity.getWorkArea()));
        }

        return dto;
    }

    public JobLogDto convertToListDto(JobLog entity) {
        if (entity == null) return null;

        JobLogDto dto = new JobLogDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setWorkScope(entity.getWorkScope());
        dto.setCompany(entity.getCompany());
        dto.setForeman(entity.getForeman());
        dto.setLocation(entity.getLocation());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        dto.setPermitNumber(entity.getPermitNumber());

        if (entity.getJobStatus() != null) {
            dto.setJobStatus(valueMapper.convertToDto(entity.getJobStatus()));
        }
        if (entity.getOriginatingWorkRequest() != null) {
            dto.setOriginatingWorkRequest(workRequestMapper.convertToNgDto(entity.getOriginatingWorkRequest()));
        }
        if (entity.getWorkArea() != null) {
            dto.setWorkArea(workAreaMapper.convertToDto(entity.getWorkArea()));
        }
        if (entity.getWorkCategory() != null) {
            dto.setWorkCategory(valueMapper.convertToDto(entity.getWorkCategory()));
        }

        return dto;
    }

    public JobLog convertToEntity(JobLogDto dto) {
        if (dto == null) return null;

        JobLog entity = null;
        if (dto.getId() != null && dto.getId() != 0) {
            entity = jobLogRepo.findById(dto.getId()).orElse(new JobLog());
        }
        if (entity == null) entity = new JobLog();

        if (dto.getId() != null) entity.setId(dto.getId());
        entity.setName(dto.getName());

        if (dto.getPackages() != null && !dto.getPackages().isEmpty()) {
            entity.setPackages(
                dto.getPackages()
                    .stream()
                    .map(dailyPermitPackageMapper::convertToEntity)
                    .collect(Collectors.toSet())
            );
        }

        if (dto.getWorkScope() != null) entity.setWorkScope(dto.getWorkScope());
        if (dto.getCompany() != null) entity.setCompany(dto.getCompany());
        if (dto.getForeman() != null) entity.setForeman(dto.getForeman());
        if (dto.getLocation() != null) entity.setLocation(dto.getLocation());
        if (dto.getStartDate() != null) entity.setStartDate(dto.getStartDate());
        if (dto.getEndDate() != null) entity.setEndDate(dto.getEndDate());
        if (dto.getPermitNumber() != null) entity.setPermitNumber(dto.getPermitNumber());

        if (dto.getJobStatus() != null) {
            entity.setJobStatus(valueMapper.convertToEntity(dto.getJobStatus()));
        }
        if (dto.getOriginatingWorkRequest() != null && dto.getOriginatingWorkRequest().getId() != null) {
            entity.setOriginatingWorkRequest(
                workRequestRepo.findById(dto.getOriginatingWorkRequest().getId()).orElse(null)
            );
        }
        if (dto.getWorkArea() != null && dto.getWorkArea().getId() != null) {
            WorkArea workArea = workAreaRepo.findById(dto.getWorkArea().getId()).orElse(null);
            entity.setWorkArea(workArea);
            if (workArea != null && entity.getLocation() == null) entity.setLocation(workArea.getName());
        }

        return entity;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
