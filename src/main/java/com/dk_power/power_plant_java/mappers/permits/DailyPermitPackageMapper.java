package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.DailyPermitPackageDto;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.permits.*;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.mappers.LotoMapper;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.repository.permits.ConfinedSpaceRepo;
import com.dk_power.power_plant_java.repository.permits.HotWorkRepo;
import com.dk_power.power_plant_java.repository.permits.SafeWorkRepo;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
@RequiredArgsConstructor
@Component
public class DailyPermitPackageMapper implements BaseMapper {

    private final SafeWorkMapper safeWorkMapper;
    private final HotWorkMapper hotWorkMapper;
    private final ConfinedSpaceMapper confinedSpaceMapper;
    private final LotoMapper lotoMapper;
    private final WorkRequestMapper workRequestMapper;
    private final ModelMapper modelMapper;

    private final SafeWorkRepo safeWorkRepo;
    private final HotWorkRepo hotWorkRepo;
    private final ConfinedSpaceRepo confinedSpaceRepo;
    private final LotoRepo lotoRepo;
    private final WorkRequestRepo workRequestRepo;

    public DailyPermitPackageDto convertToDto(DailyPermitPackage entity) {
        if (entity == null) return null;

        DailyPermitPackageDto dto = new DailyPermitPackageDto();
        dto.setId(entity.getId());

        dto.setName(entity.getName());

        if(entity.getWorkRequests() != null && !entity.getWorkRequests().isEmpty()) {
            dto.setWorkRequests(
                entity.getWorkRequests()
                    .stream()
                    .map(workRequestMapper::convertToNgDto)
                    .collect(Collectors.toList())
            );
        }

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

        dto.setDate(entity.getDate());
        dto.setTime(entity.getTime());
        dto.setCompanyName(entity.getCompanyName());
        dto.setPersonName(entity.getPersonName());

        if (entity.getWorkRequests() != null && !entity.getWorkRequests().isEmpty()) {
            WorkRequest firstWorkRequest = entity.getWorkRequests().iterator().next();
            if (dto.getDate() == null) {
                dto.setDate(firstWorkRequest.getDateOfWorkToBePerformed());
            }
            if (dto.getTime() == null) {
                dto.setTime(firstWorkRequest.getTimeOfWorkToBePerformed());
            }
            if (dto.getCompanyName() == null || dto.getCompanyName().isEmpty()) {
                dto.setCompanyName(firstWorkRequest.getCompany());
            }
            if (dto.getPersonName() == null || dto.getPersonName().isEmpty()) {
                dto.setPersonName(firstWorkRequest.getRequestedBy());
            }
        }

        return dto;
    }

    public DailyPermitPackage convertToEntity(DailyPermitPackageDto dto) {
        if (dto == null) return null;

        DailyPermitPackage entity = new DailyPermitPackage();
        if(dto.getId()!=0)entity.setId(dto.getId());
        entity.setName(dto.getName());

        if(dto.getWorkRequestIds() != null && !dto.getWorkRequestIds().isEmpty()){
            List<WorkRequest> workRequests = workRequestRepo.findAllById(dto.getWorkRequestIds());
            entity.setWorkRequests(new HashSet<>(workRequests));
        } else if (dto.getWorkRequests() != null && !dto.getWorkRequests().isEmpty()) {
            entity.setWorkRequests(
                    dto.getWorkRequests()
                            .stream()
                            .map(workRequestMapper::convertNgDtoToEntity)
                            .collect(Collectors.toSet())
            );
        }

        if(dto.getSafeWorkIds()!= null &&!dto.getSafeWorkIds().isEmpty()) {
            List<SafeWork> safeWorks = safeWorkRepo.findAllById(dto.getSafeWorkIds());
            entity.setSafeWorks(new HashSet<>(safeWorks));
        }else if (dto.getSafeWorks() != null && !dto.getSafeWorks().isEmpty()) {
            entity.setSafeWorks(
                dto.getSafeWorks()
                    .stream()
                    .map(safeWorkMapper::convertToEntity)
                    .collect(Collectors.toSet())
            );
        }

        if(dto.getHotWorkIds()!= null && !dto.getHotWorkIds().isEmpty()){
            List<HotWork> hotWorks = hotWorkRepo.findAllById(dto.getHotWorkIds());
            entity.setHotWorks(new HashSet<>(hotWorks));
        } else if (dto.getHotWorks() != null && !dto.getHotWorks().isEmpty()) {
            entity.setHotWorks(
                    dto.getHotWorks()
                            .stream()
                            .map(hotWorkMapper::convertToEntity)
                            .collect(Collectors.toSet())
            );
        }

        if(dto.getConfinedSpaceIds()!= null && !dto.getConfinedSpaceIds().isEmpty()){
            List<ConfinedSpace> confinedSpaces = confinedSpaceRepo.findAllById(dto.getConfinedSpaceIds());
            entity.setConfinedSpaces(new HashSet<>(confinedSpaces));
        } else if (dto.getConfinedSpaces() != null && !dto.getConfinedSpaces().isEmpty()) {
            entity.setConfinedSpaces(
                    dto.getConfinedSpaces()
                            .stream()
                            .map(confinedSpaceMapper::convertToEntity)
                            .collect(Collectors.toSet())
            );
        }

        if(dto.getLotoIds()!= null && !dto.getLotoIds().isEmpty()){
            List<Loto> lotos = lotoRepo.findAllById(dto.getLotoIds());
            entity.setLotos(new HashSet<>(lotos));
        } else if (dto.getLotos() != null && !dto.getLotos().isEmpty()) {
            entity.setLotos(
                    dto.getLotos()
                            .stream()
                            .map(lotoMapper::convertToEntity)
                            .collect(Collectors.toSet())
            );
        }

        if(entity.getName() == null || entity.getName().isEmpty()) {
            String name = "No Work Scope Specified";
            if(entity.getWorkRequests() != null &&!entity.getWorkRequests().isEmpty()){
                String workScope = entity.getWorkRequests().iterator().next().getWorkScope();
                if(workScope!=null && !workScope.isEmpty()) name = workScope;
            }
            entity.setName(name);
        }

        if(dto.getDate()!=null) entity.setDate(dto.getDate());
        if(dto.getTime()!=null) entity.setTime(dto.getTime());
        if(dto.getCompanyName()!=null) entity.setCompanyName(dto.getCompanyName());
        if(dto.getPersonName()!=null) entity.setPersonName(dto.getPersonName());

        if (entity.getWorkRequests() != null && !entity.getWorkRequests().isEmpty()) {
            WorkRequest firstWorkRequest = entity.getWorkRequests().iterator().next();
            if (entity.getDate() == null) {
                entity.setDate(firstWorkRequest.getDateOfWorkToBePerformed());
            }
            if (entity.getTime() == null) {
                entity.setTime(firstWorkRequest.getTimeOfWorkToBePerformed());
            }
            if (entity.getCompanyName() == null || entity.getCompanyName().isEmpty()) {
                entity.setCompanyName(firstWorkRequest.getCompany());
            }
            if (entity.getPersonName() == null || entity.getPersonName().isEmpty()) {
                entity.setPersonName(firstWorkRequest.getRequestedBy());
            }
        }

        return entity;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
