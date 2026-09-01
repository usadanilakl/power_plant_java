package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.HotWorkDto;
import com.dk_power.power_plant_java.entities.permits.HotWork;
import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.mappers.ValueMapper;
import com.dk_power.power_plant_java.repository.permits.HotWorkRepo;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class HotWorkMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final ValueMapper valueMapper;
    private final HotWorkRepo hotWorkRepo;
    private final WorkAreaRepo workAreaRepo;
    private final WorkAreaMapper workAreaMapper;

    public HotWorkDto convertToDto(HotWork entity) {
        if (entity == null) return null;
        HotWorkDto dto = new HotWorkDto();

        // Audit stamps, permit number, sync bookkeeping. Without this the hand mapper
        // returns a thinner object than the ModelMapper it replaced on get-by-id.
        copyBaseFields(entity, dto);
        // Status was carried by neither mapper direction, so the detail view showed blank.
        if (entity.getPermitStatus() != null) dto.setPermitStatus(valueMapper.convertToDto(entity.getPermitStatus()));

        dto.setId(entity.getId());
        dto.setDate(entity.getDate());
        dto.setForeman(entity.getForeman());
        dto.setFireWatch(entity.getFireWatch());
        dto.setMeterModel(entity.getMeterModel());
        dto.setMeterNum(entity.getMeterNum());
        dto.setMeterCalDate(entity.getMeterCalDate());
        dto.setSpecialInstructions(entity.getSpecialInstructions());
        dto.setLocation(entity.getLocation());
        dto.setWorkScope(entity.getWorkScope());
        dto.setRedTagNum(entity.getRedTagNum());
        dto.setPermitNumber(entity.getPermitNumber());
        dto.setIsAirMonitoringRegisteredOnConfinedSpace(entity.getIsAirMonitoringRegisteredOnConfinedSpace());
        dto.setIsFireWatchRequired(entity.getIsFireWatchRequired());
        dto.setTimeOfInitialTest(entity.getTimeOfInitialTest());
        dto.setInitialTestResult(entity.getInitialTestResult());

        // ---- 2026-08-27 revision ----
        dto.setInitialTestInitials(entity.getInitialTestInitials());
        dto.setFireProtectionApprovalDateTime(entity.getFireProtectionApprovalDateTime());
        dto.setContMeterModel(entity.getContMeterModel());
        dto.setContMeterNum(entity.getContMeterNum());
        dto.setContMeterCalDate(entity.getContMeterCalDate());
        dto.setFireWatch1Hour(entity.getFireWatch1Hour());
        dto.setFireWatch30Min(entity.getFireWatch30Min());
        dto.setFireWatchNotRequired(entity.getFireWatchNotRequired());
        dto.setIssuerSignature(entity.getIssuerSignature());
        dto.setApprovedDate(entity.getApprovedDate());
        dto.setApprovedTime(entity.getApprovedTime());
        dto.setActualStartTime(entity.getActualStartTime());
        dto.setActualEndTime(entity.getActualEndTime());
        dto.setCancelRequestorName(entity.getCancelRequestorName());
        dto.setCancelRequestorSignature(entity.getCancelRequestorSignature());
        dto.setCancelRequestorDate(entity.getCancelRequestorDate());
        dto.setCancelRequestorTime(entity.getCancelRequestorTime());
        dto.setCancelFireWatchName(entity.getCancelFireWatchName());
        dto.setCancelFireWatchSignature(entity.getCancelFireWatchSignature());
        dto.setCancelFireWatchDate(entity.getCancelFireWatchDate());
        dto.setCancelFireWatchTime(entity.getCancelFireWatchTime());
        dto.setFireMonitoringMethod(entity.getFireMonitoringMethod());
        dto.setFireMonitorName(entity.getFireMonitorName());
        dto.setFireMonitorSignature(entity.getFireMonitorSignature());
        dto.setFireMonitorDate(entity.getFireMonitorDate());
        dto.setFireMonitorTime(entity.getFireMonitorTime());
        dto.setCancelledBy(entity.getCancelledBy());
        dto.setCancelledDate(entity.getCancelledDate());
        dto.setCancelledTime(entity.getCancelledTime());
        dto.setFireProtectionInService(entity.getFireProtectionInService());
        dto.setFireProtectionNotInService(entity.getFireProtectionNotInService());
        dto.setWorkCompleted(entity.getWorkCompleted());

        try {
            dto.setWorkType(entity.getWorkType());
        } catch (Exception e) {
            // handle or log
        }

        try {
            dto.setMeasures(entity.getMeasures());
        } catch (Exception e) {
            // handle or log
        }

        if (entity.getWorkArea() != null) {
            dto.setWorkArea(workAreaMapper.convertToDto(entity.getWorkArea()));
            // Fallback, not an override: this used to clobber the operator-entered value that was
            // read a few lines above, so a typed location reverted on every reload.
            if (dto.getLocation() == null || dto.getLocation().isBlank()) {
                dto.setLocation(entity.getWorkArea().getName());
            }
        } else if (entity.getLocation() != null && !entity.getLocation().isEmpty()) {
            workAreaRepo.findFirstByNameIgnoreCase(entity.getLocation())
                .ifPresent(wa -> dto.setWorkArea(workAreaMapper.convertToDto(wa)));
        }

        return dto;
    }

    public HotWork convertToEntity(HotWorkDto dto) {
        if (dto == null) return null;
        HotWork entity = null;

        if(dto.getId()!=null && dto.getId()!=0) entity = hotWorkRepo.findById(dto.getId()).orElse(new HotWork());
        if(entity == null) entity = new HotWork();

        if (dto.getId() != null && dto.getId() != 0) entity.setId(dto.getId());
        entity.setDate(dto.getDate());
        entity.setForeman(dto.getForeman());
        entity.setFireWatch(dto.getFireWatch());
        entity.setMeterModel(dto.getMeterModel());
        entity.setMeterNum(dto.getMeterNum());
        entity.setMeterCalDate(dto.getMeterCalDate());
        entity.setSpecialInstructions(dto.getSpecialInstructions());
        entity.setLocation(dto.getLocation());
        entity.setWorkScope(dto.getWorkScope());
        if(dto.getRedTagNum()!=null && !dto.getRedTagNum().isEmpty())entity.setRedTagNum(dto.getRedTagNum());
        if (dto.getIsAirMonitoringRegisteredOnConfinedSpace() != null)
            entity.setIsAirMonitoringRegisteredOnConfinedSpace(dto.getIsAirMonitoringRegisteredOnConfinedSpace());
        if (dto.getIsFireWatchRequired() != null)
            entity.setIsFireWatchRequired(dto.getIsFireWatchRequired());
        if (dto.getTimeOfInitialTest() != null) entity.setTimeOfInitialTest(dto.getTimeOfInitialTest());
        if (dto.getInitialTestResult() != null) entity.setInitialTestResult(dto.getInitialTestResult());

        // ---- 2026-08-27 revision ----
        if (dto.getInitialTestInitials() != null) entity.setInitialTestInitials(dto.getInitialTestInitials());
        if (dto.getFireProtectionApprovalDateTime() != null) entity.setFireProtectionApprovalDateTime(dto.getFireProtectionApprovalDateTime());
        if (dto.getContMeterModel() != null) entity.setContMeterModel(dto.getContMeterModel());
        if (dto.getContMeterNum() != null) entity.setContMeterNum(dto.getContMeterNum());
        if (dto.getContMeterCalDate() != null) entity.setContMeterCalDate(dto.getContMeterCalDate());
        if (dto.getFireWatch1Hour() != null) entity.setFireWatch1Hour(dto.getFireWatch1Hour());
        if (dto.getFireWatch30Min() != null) entity.setFireWatch30Min(dto.getFireWatch30Min());
        if (dto.getFireWatchNotRequired() != null) entity.setFireWatchNotRequired(dto.getFireWatchNotRequired());
        if (dto.getIssuerSignature() != null) entity.setIssuerSignature(dto.getIssuerSignature());
        if (dto.getApprovedDate() != null) entity.setApprovedDate(dto.getApprovedDate());
        if (dto.getApprovedTime() != null) entity.setApprovedTime(dto.getApprovedTime());
        if (dto.getActualStartTime() != null) entity.setActualStartTime(dto.getActualStartTime());
        if (dto.getActualEndTime() != null) entity.setActualEndTime(dto.getActualEndTime());
        if (dto.getCancelRequestorName() != null) entity.setCancelRequestorName(dto.getCancelRequestorName());
        if (dto.getCancelRequestorSignature() != null) entity.setCancelRequestorSignature(dto.getCancelRequestorSignature());
        if (dto.getCancelRequestorDate() != null) entity.setCancelRequestorDate(dto.getCancelRequestorDate());
        if (dto.getCancelRequestorTime() != null) entity.setCancelRequestorTime(dto.getCancelRequestorTime());
        if (dto.getCancelFireWatchName() != null) entity.setCancelFireWatchName(dto.getCancelFireWatchName());
        if (dto.getCancelFireWatchSignature() != null) entity.setCancelFireWatchSignature(dto.getCancelFireWatchSignature());
        if (dto.getCancelFireWatchDate() != null) entity.setCancelFireWatchDate(dto.getCancelFireWatchDate());
        if (dto.getCancelFireWatchTime() != null) entity.setCancelFireWatchTime(dto.getCancelFireWatchTime());
        if (dto.getFireMonitoringMethod() != null) entity.setFireMonitoringMethod(dto.getFireMonitoringMethod());
        if (dto.getFireMonitorName() != null) entity.setFireMonitorName(dto.getFireMonitorName());
        if (dto.getFireMonitorSignature() != null) entity.setFireMonitorSignature(dto.getFireMonitorSignature());
        if (dto.getFireMonitorDate() != null) entity.setFireMonitorDate(dto.getFireMonitorDate());
        if (dto.getFireMonitorTime() != null) entity.setFireMonitorTime(dto.getFireMonitorTime());
        if (dto.getCancelledBy() != null) entity.setCancelledBy(dto.getCancelledBy());
        if (dto.getCancelledDate() != null) entity.setCancelledDate(dto.getCancelledDate());
        if (dto.getCancelledTime() != null) entity.setCancelledTime(dto.getCancelledTime());
        if (dto.getFireProtectionInService() != null) entity.setFireProtectionInService(dto.getFireProtectionInService());
        if (dto.getFireProtectionNotInService() != null) entity.setFireProtectionNotInService(dto.getFireProtectionNotInService());
        if (dto.getWorkCompleted() != null) entity.setWorkCompleted(dto.getWorkCompleted());

        if (dto.getWorkType() != null) {
            entity.setWorkType(dto.getWorkType());
        }

        // Null-guarded, matching SafeWorkMapper and ConfinedSpaceMapper. HotWork.setMeasures(null)
        // writes the literal string "null", which getMeasures() reads back as an all-false block — so
        // any save that omitted the measures silently wiped twelve precautions. Angular was safe only
        // by accident, because HotWorkDto.toJson() always emits the block.
        if (dto.getMeasures() != null) {
            try {
                entity.setMeasures(dto.getMeasures());
            } catch (Exception e) {
                // handle or log
            }
        }

        // id 0 is the Angular placeholder shape (BaseDto sets id = data.id || 0). It passes a
        // plain != null check, findById(0) is empty, and the old code then assigned that empty
        // result unconditionally -- silently UNLINKING the permit's work area. Also: the name is
        // now a FALLBACK, not an override, so an operator-typed value is no longer clobbered.
        if (dto.getWorkArea() != null && dto.getWorkArea().getId() != null && dto.getWorkArea().getId() != 0) {
            WorkArea workArea = workAreaRepo.findById(dto.getWorkArea().getId()).orElse(null);
            if (workArea != null) {
                entity.setWorkArea(workArea);
                if (entity.getLocation() == null || entity.getLocation().isBlank()) {
                    entity.setLocation(workArea.getName());
                }
            }
        }

        return entity;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
