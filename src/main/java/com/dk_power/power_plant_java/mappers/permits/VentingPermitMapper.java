package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.VentingPermitDto;
import com.dk_power.power_plant_java.entities.permits.VentingPermit;
import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.mappers.ValueMapper;
import com.dk_power.power_plant_java.repository.permits.VentingPermitRepo;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class VentingPermitMapper implements BaseMapper {
    private final VentingPermitRepo repo;
    private final WorkAreaRepo workAreaRepo;
    private final WorkAreaMapper workAreaMapper;
    private final ValueMapper valueMapper;

    @Override
    public ModelMapper getMapper() {
        return new ModelMapper();
    }

    public VentingPermitDto convertToDto(VentingPermit entity) {
        if (entity == null) return null;
        VentingPermitDto dto = new VentingPermitDto();

        // Audit stamps, permit number, sync bookkeeping. Without this the hand mapper
        // returns a thinner object than the ModelMapper it replaced on get-by-id.
        copyBaseFields(entity, dto);
        // Status was carried by neither mapper direction, so the detail view showed blank.
        if (entity.getPermitStatus() != null) dto.setPermitStatus(valueMapper.convertToDto(entity.getPermitStatus()));

        if (entity.getId() != null) dto.setId(entity.getId());
        if (entity.getDate() != null) dto.setDate(entity.getDate());
        if (entity.getTime() != null) dto.setTime(entity.getTime());
        if (entity.getLocation() != null) dto.setLocation(entity.getLocation());
        if (entity.getIssuedTo() != null) dto.setIssuedTo(entity.getIssuedTo());
        if (entity.getWorkScope() != null) dto.setWorkScope(entity.getWorkScope());
        if (entity.getRedTagNum() != null) dto.setRedTagNum(entity.getRedTagNum());
        if (entity.getPermitNumber() != null) dto.setPermitNumber(entity.getPermitNumber());

        if (entity.getPlantName() != null) dto.setPlantName(entity.getPlantName());
        if (entity.getSystemName() != null) dto.setSystemName(entity.getSystemName());
        if (entity.getRequestingIndividual() != null) dto.setRequestingIndividual(entity.getRequestingIndividual());
        if (entity.getPurpose() != null) dto.setPurpose(entity.getPurpose());
        if (entity.getTimeCommence() != null) dto.setTimeCommence(entity.getTimeCommence());
        if (entity.getTimeConclude() != null) dto.setTimeConclude(entity.getTimeConclude());
        if (entity.getIndividualIssuing() != null) dto.setIndividualIssuing(entity.getIndividualIssuing());
        if (entity.getGasType() != null) dto.setGasType(entity.getGasType());
        if (entity.getLel() != null) dto.setLel(entity.getLel());
        if (entity.getUel() != null) dto.setUel(entity.getUel());
        if (entity.getCalculatedVolume() != null) dto.setCalculatedVolume(entity.getCalculatedVolume());
        if (entity.getPressure() != null) dto.setPressure(entity.getPressure());
        if (entity.getGasIndicatorModel() != null) dto.setGasIndicatorModel(entity.getGasIndicatorModel());
        if (entity.getGasIndicatorSerial() != null) dto.setGasIndicatorSerial(entity.getGasIndicatorSerial());
        if (entity.getCalibrationDate() != null) dto.setCalibrationDate(entity.getCalibrationDate());
        if (entity.getSdsProvided() != null) dto.setSdsProvided(entity.getSdsProvided());
        if (entity.getSdsInitials() != null) dto.setSdsInitials(entity.getSdsInitials());
        if (entity.getGeneralArrangementProvided() != null) dto.setGeneralArrangementProvided(entity.getGeneralArrangementProvided());
        if (entity.getGeneralArrangementInitials() != null) dto.setGeneralArrangementInitials(entity.getGeneralArrangementInitials());
        if (entity.getHazardousClassificationDrawing() != null) dto.setHazardousClassificationDrawing(entity.getHazardousClassificationDrawing());
        if (entity.getHazardousClassificationInitials() != null) dto.setHazardousClassificationInitials(entity.getHazardousClassificationInitials());
        if (entity.getPidWithValves() != null) dto.setPidWithValves(entity.getPidWithValves());
        if (entity.getPidInitials() != null) dto.setPidInitials(entity.getPidInitials());
        if (entity.getDrawingNumbers() != null) dto.setDrawingNumbers(entity.getDrawingNumbers());
        if (entity.getStackDescription() != null) dto.setStackDescription(entity.getStackDescription());
        if (entity.getEquipmentToBeDeenergized() != null) dto.setEquipmentToBeDeenergized(entity.getEquipmentToBeDeenergized());
        if (entity.getLotoDescription() != null) dto.setLotoDescription(entity.getLotoDescription());
        if (entity.getRadioChannel() != null) dto.setRadioChannel(entity.getRadioChannel());
        if (entity.getControlRoom() != null) dto.setControlRoom(entity.getControlRoom());
        if (entity.getOsmSupervisor() != null) dto.setOsmSupervisor(entity.getOsmSupervisor());
        if (entity.getOsmDate() != null) dto.setOsmDate(entity.getOsmDate());
        if (entity.getPlantManager() != null) dto.setPlantManager(entity.getPlantManager());
        if (entity.getPlantManagerDate() != null) dto.setPlantManagerDate(entity.getPlantManagerDate());
        if (entity.getDivisionDirector() != null) dto.setDivisionDirector(entity.getDivisionDirector());
        if (entity.getDivisionDirectorDate() != null) dto.setDivisionDirectorDate(entity.getDivisionDirectorDate());
        try { dto.setChecklist(entity.getChecklist()); } catch (Exception e) { /* ignore */ }

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

    public VentingPermit convertToEntity(VentingPermitDto dto) {
        if (dto == null) return null;
        VentingPermit entity = null;

        if (dto.getId() != null && dto.getId() != 0) {
            entity = repo.findById(dto.getId()).orElse(new VentingPermit());
        }
        if (entity == null) entity = new VentingPermit();

        if (dto.getId() != null && dto.getId() != 0) entity.setId(dto.getId());
        if (dto.getDate() != null) entity.setDate(dto.getDate());
        if (dto.getTime() != null) entity.setTime(dto.getTime());
        if (dto.getLocation() != null) entity.setLocation(dto.getLocation());
        if (dto.getIssuedTo() != null) entity.setIssuedTo(dto.getIssuedTo());
        if (dto.getWorkScope() != null) entity.setWorkScope(dto.getWorkScope());
        if (dto.getRedTagNum() != null) entity.setRedTagNum(dto.getRedTagNum());
        if (dto.getPermitNumber() != null) entity.setPermitNumber(dto.getPermitNumber());

        if (dto.getPlantName() != null) entity.setPlantName(dto.getPlantName());
        if (dto.getSystemName() != null) entity.setSystemName(dto.getSystemName());
        if (dto.getRequestingIndividual() != null) entity.setRequestingIndividual(dto.getRequestingIndividual());
        if (dto.getPurpose() != null) entity.setPurpose(dto.getPurpose());
        if (dto.getTimeCommence() != null) entity.setTimeCommence(dto.getTimeCommence());
        if (dto.getTimeConclude() != null) entity.setTimeConclude(dto.getTimeConclude());
        if (dto.getIndividualIssuing() != null) entity.setIndividualIssuing(dto.getIndividualIssuing());
        if (dto.getGasType() != null) entity.setGasType(dto.getGasType());
        if (dto.getLel() != null) entity.setLel(dto.getLel());
        if (dto.getUel() != null) entity.setUel(dto.getUel());
        if (dto.getCalculatedVolume() != null) entity.setCalculatedVolume(dto.getCalculatedVolume());
        if (dto.getPressure() != null) entity.setPressure(dto.getPressure());
        if (dto.getGasIndicatorModel() != null) entity.setGasIndicatorModel(dto.getGasIndicatorModel());
        if (dto.getGasIndicatorSerial() != null) entity.setGasIndicatorSerial(dto.getGasIndicatorSerial());
        if (dto.getCalibrationDate() != null) entity.setCalibrationDate(dto.getCalibrationDate());
        if (dto.getSdsProvided() != null) entity.setSdsProvided(dto.getSdsProvided());
        if (dto.getSdsInitials() != null) entity.setSdsInitials(dto.getSdsInitials());
        if (dto.getGeneralArrangementProvided() != null) entity.setGeneralArrangementProvided(dto.getGeneralArrangementProvided());
        if (dto.getGeneralArrangementInitials() != null) entity.setGeneralArrangementInitials(dto.getGeneralArrangementInitials());
        if (dto.getHazardousClassificationDrawing() != null) entity.setHazardousClassificationDrawing(dto.getHazardousClassificationDrawing());
        if (dto.getHazardousClassificationInitials() != null) entity.setHazardousClassificationInitials(dto.getHazardousClassificationInitials());
        if (dto.getPidWithValves() != null) entity.setPidWithValves(dto.getPidWithValves());
        if (dto.getPidInitials() != null) entity.setPidInitials(dto.getPidInitials());
        if (dto.getDrawingNumbers() != null) entity.setDrawingNumbers(dto.getDrawingNumbers());
        if (dto.getStackDescription() != null) entity.setStackDescription(dto.getStackDescription());
        if (dto.getEquipmentToBeDeenergized() != null) entity.setEquipmentToBeDeenergized(dto.getEquipmentToBeDeenergized());
        if (dto.getLotoDescription() != null) entity.setLotoDescription(dto.getLotoDescription());
        if (dto.getRadioChannel() != null) entity.setRadioChannel(dto.getRadioChannel());
        if (dto.getControlRoom() != null) entity.setControlRoom(dto.getControlRoom());
        if (dto.getOsmSupervisor() != null) entity.setOsmSupervisor(dto.getOsmSupervisor());
        if (dto.getOsmDate() != null) entity.setOsmDate(dto.getOsmDate());
        if (dto.getPlantManager() != null) entity.setPlantManager(dto.getPlantManager());
        if (dto.getPlantManagerDate() != null) entity.setPlantManagerDate(dto.getPlantManagerDate());
        if (dto.getDivisionDirector() != null) entity.setDivisionDirector(dto.getDivisionDirector());
        if (dto.getDivisionDirectorDate() != null) entity.setDivisionDirectorDate(dto.getDivisionDirectorDate());
        if (dto.getChecklist() != null) entity.setChecklist(dto.getChecklist());

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
}
