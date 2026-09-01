package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.DailyPermitPackageDto;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.permits.*;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.mappers.LotoMapper;
import com.dk_power.power_plant_java.mappers.ValueMapper;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.repository.permits.*;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;
@RequiredArgsConstructor
@Component
public class DailyPermitPackageMapper implements BaseMapper {

    private final SafeWorkMapper safeWorkMapper;
    private final HotWorkMapper hotWorkMapper;
    private final ConfinedSpaceMapper confinedSpaceMapper;
    private final LotoMapper lotoMapper;
    private final WorkRequestMapper workRequestMapper;
    private final EnergizedWorkPermitMapper energizedWorkPermitMapper;
    private final ExcavationPermitMapper excavationPermitMapper;
    private final VentingPermitMapper ventingPermitMapper;
    private final ValueMapper valueMapper;
    private final ModelMapper modelMapper;

    private final SafeWorkRepo safeWorkRepo;
    private final HotWorkRepo hotWorkRepo;
    private final ConfinedSpaceRepo confinedSpaceRepo;
    private final LotoRepo lotoRepo;
    private final WorkRequestRepo workRequestRepo;
    private final EnergizedWorkPermitRepo energizedWorkPermitRepo;
    private final ExcavationPermitRepo excavationPermitRepo;
    private final VentingPermitRepo ventingPermitRepo;

    public DailyPermitPackageDto convertToDto(DailyPermitPackage entity) {
        if (entity == null) return null;

        DailyPermitPackageDto dto = new DailyPermitPackageDto();
        dto.setId(entity.getId());

        dto.setName(entity.getName());

        if(entity.getWorkRequests() != null && !entity.getWorkRequests().isEmpty()) {
            // Batch, not per-entity. The single-entity mapper runs a JHA existence check and an
            // attachment count per request, so a package with N requests cost 2N queries where the
            // batch mapper does it in 2.
            dto.setWorkRequests(workRequestMapper.convertToNgDtos(new java.util.ArrayList<>(entity.getWorkRequests())));
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

        if (entity.getEnergizedWorkPermits() != null && !entity.getEnergizedWorkPermits().isEmpty()) {
            dto.setEnergizedWorkPermits(
                entity.getEnergizedWorkPermits()
                    .stream()
                    .map(energizedWorkPermitMapper::convertToDto)
                    .toList()
            );
        }

        if (entity.getExcavationPermits() != null && !entity.getExcavationPermits().isEmpty()) {
            dto.setExcavationPermits(
                entity.getExcavationPermits()
                    .stream()
                    .map(excavationPermitMapper::convertToDto)
                    .toList()
            );
        }

        if (entity.getVentingPermits() != null && !entity.getVentingPermits().isEmpty()) {
            dto.setVentingPermits(
                entity.getVentingPermits()
                    .stream()
                    .map(ventingPermitMapper::convertToDto)
                    .toList()
            );
        }

        dto.setPermitNumber(entity.getPermitNumber());
        if (entity.getPackageStatus() != null) {
            dto.setPackageStatus(valueMapper.convertToDto(entity.getPackageStatus()));
        }
        dto.setModifications(entity.getModifications());
        dto.setPersonnel(entity.getPersonnel());
        dto.setForemanCloseOutCompleted(entity.getForemanCloseOutCompleted());
        dto.setModificationCount(entity.getModificationCount());
        dto.setWorkCompleted(entity.getWorkCompleted());
        dto.setClosureComments(entity.getClosureComments());
        dto.setScopeChanged(entity.getScopeChanged());
        dto.setClosureScopeDetails(entity.getClosureScopeDetails());
        dto.setContinueDate(entity.getContinueDate());
        dto.setContinueTime(entity.getContinueTime());

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

        if(dto.getEnergizedWorkPermitIds()!= null && !dto.getEnergizedWorkPermitIds().isEmpty()){
            List<EnergizedWorkPermit> permits = energizedWorkPermitRepo.findAllById(dto.getEnergizedWorkPermitIds());
            entity.setEnergizedWorkPermits(new HashSet<>(permits));
        } else if (dto.getEnergizedWorkPermits() != null && !dto.getEnergizedWorkPermits().isEmpty()) {
            entity.setEnergizedWorkPermits(
                    dto.getEnergizedWorkPermits()
                            .stream()
                            .map(energizedWorkPermitMapper::convertToEntity)
                            .collect(Collectors.toSet())
            );
        }

        if(dto.getExcavationPermitIds()!= null && !dto.getExcavationPermitIds().isEmpty()){
            List<ExcavationPermit> permits = excavationPermitRepo.findAllById(dto.getExcavationPermitIds());
            entity.setExcavationPermits(new HashSet<>(permits));
        } else if (dto.getExcavationPermits() != null && !dto.getExcavationPermits().isEmpty()) {
            entity.setExcavationPermits(
                    dto.getExcavationPermits()
                            .stream()
                            .map(excavationPermitMapper::convertToEntity)
                            .collect(Collectors.toSet())
            );
        }

        if(dto.getVentingPermitIds()!= null && !dto.getVentingPermitIds().isEmpty()){
            List<VentingPermit> permits = ventingPermitRepo.findAllById(dto.getVentingPermitIds());
            entity.setVentingPermits(new HashSet<>(permits));
        } else if (dto.getVentingPermits() != null && !dto.getVentingPermits().isEmpty()) {
            entity.setVentingPermits(
                    dto.getVentingPermits()
                            .stream()
                            .map(ventingPermitMapper::convertToEntity)
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
        if(dto.getPermitNumber()!=null) entity.setPermitNumber(dto.getPermitNumber());
        if(dto.getPackageStatus()!=null) entity.setPackageStatus(valueMapper.convertToEntity(dto.getPackageStatus()));
        if(dto.getModifications()!=null && !dto.getModifications().isEmpty()) entity.setModifications(dto.getModifications());
        if(dto.getPersonnel()!=null && !dto.getPersonnel().isEmpty()) entity.setPersonnel(dto.getPersonnel());

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
