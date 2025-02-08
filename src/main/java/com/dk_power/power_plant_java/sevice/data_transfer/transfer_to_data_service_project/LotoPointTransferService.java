package com.dk_power.power_plant_java.sevice.data_transfer.transfer_to_data_service_project;

import com.dk_power.power_plant_java.api.DataServiceClient;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_CategoryDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_ValueDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.equipment.DS_LotoPointDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.equipment.DS_TagNumberDto;
import com.dk_power.power_plant_java.entities.Conflict;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.mappers.transfer_to_data_service_project.DS_LotoPointMapper;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LotoPointTransferService {
    private final LotoPointService lotoPointService;
    private final EquipmentService equipmentService;
    private final ConflictService conflictService;
    private final DataServiceClient dataServiceClient;
    private final DS_LotoPointMapper dsLotoPointMapper;

    protected void transferOneLotoPoint(Equipment e){
        if(e==null || e.getDataServiceItemId()==null) return;

        UUID fileElementId = e.getDataServiceItemId();
        DS_LotoPointDto lotoPointDto = null;

        if(e.getLotoPoints()!=null &&!e.getLotoPoints().isEmpty()){
            LotoPoint lotoPoint = e.getLotoPoints().stream().filter(lp -> lp.getTagNumber().equals(e.getTagNumber())).findFirst().orElse(null);

            if(lotoPoint==null){
                conflictService.save(Conflict.builder()
                        .entityId(e.getId().toString())
                        .conflictType(Conflict.ConflictType.equipment_lp_tag_mismatch)
                        .status(Conflict.ConflictStatus.OPEN)
                        .build());
                return;
            }

            try{
                lotoPointDto = dsLotoPointMapper.map(e);
            }catch (Exception ex){
                conflictService.save(Conflict.builder()
                        .entityId(e.getId().toString())
                        .conflictType(Conflict.ConflictType.incomplete_loto_point)
                        .status(Conflict.ConflictStatus.OPEN)
                        .build());
                return;
            }

            // Send POST request to create loto point
            String ds_lotoPointId = lotoPoint.getDataServiceItemId()!=null ? lotoPoint.getDataServiceItemId().toString() : null;

            if(ds_lotoPointId==null) {
                ResponseEntity<DS_LotoPointDto> responseLotoPoint = dataServiceClient.createOrUpdateLotoPoint(fileElementId.toString(), lotoPointDto);
                if (responseLotoPoint != null && responseLotoPoint.getStatusCode() == HttpStatus.OK) {
                    UUID id = responseLotoPoint.getBody().getId();
                    e.addRefactorNote("Loto point id: " + id);
                    equipmentService.save(e);
                    lotoPoint.setDataServiceItemId(id);
                    lotoPointService.save(lotoPoint);
                    System.out.println("Loto point created successfully: " + responseLotoPoint.getBody());
                }
            }else {
                lotoPointDto.setId(UUID.fromString(ds_lotoPointId));
                ResponseEntity<DS_LotoPointDto> orUpdateLotoPoint = dataServiceClient.createOrUpdateLotoPoint(fileElementId.toString(),lotoPointDto);
                System.out.println("Loto point updated successfully: " + orUpdateLotoPoint.getBody());
            }
        }else{
            conflictService.save(Conflict.builder()
                    .entityId(e.getId().toString())
                    .conflictType(Conflict.ConflictType.equipment_lp_tag_mismatch)
                    .status(Conflict.ConflictStatus.OPEN)
                    .build());
            return;
        }
    }

    public boolean isLotoPointConflicted(LotoPoint lotoPoint){
        if(
            lotoPoint!=null ||
            !isLotoPointComplete(lotoPoint) ||
            !lotoPointHasMatchingEquipment(lotoPoint) ||
            !bothUnitsHaveMatchingLotoPoints(lotoPoint)
        ) return true;
        return false;
    }

    private boolean bothUnitsHaveMatchingLotoPoints(LotoPoint lotoPoint) {
        if (lotoPoint == null || !lotoPoint.getTagNumber().startsWith("01") && !lotoPoint.getTagNumber().startsWith("02")) {
            return false;
        }

        String baseTag = lotoPoint.getTagNumber().substring(2);
        String otherUnitPrefix = lotoPoint.getTagNumber().startsWith("01") ? "02" : "01";
        String otherUnitTag = otherUnitPrefix + baseTag;

        LotoPoint otherUnitLotoPoint = lotoPointService.getEntityByTagNumber(otherUnitTag).stream().findFirst().orElse(null);

        if (otherUnitLotoPoint == null) {
            conflictService.createMismatchConflict(lotoPoint, null, "Missing corresponding equipment");
            return false;
        } else if (lotoPoint.getDescription() == null || otherUnitLotoPoint.getDescription() == null) {
            conflictService.createMismatchConflict(lotoPoint, otherUnitLotoPoint, "Missing corresponding equipment description");
            return false;
        } else {
            LotoPoint transformedLotoPoint = transformLotoPoint(lotoPoint, lotoPoint.getTagNumber().substring(0, 2), otherUnitPrefix);

            if (!compareLotoPoint(transformedLotoPoint, otherUnitLotoPoint)) {
                conflictService.createMismatchConflict(lotoPoint, otherUnitLotoPoint, "Mismatch after transformation");
                return false;
            }
        }

        return true;
    }

    private boolean lotoPointHasMatchingEquipment(LotoPoint lotoPoint) {
        if (lotoPoint == null) return false;

        Set<Equipment> equipmentList = lotoPoint.getEquipmentList();
        if(equipmentList == null || equipmentList.isEmpty()) return false;
        if (!equipmentList.stream().anyMatch(e -> e.getLotoPoints().contains(lotoPoint))) return false;
        return equipmentList.stream().anyMatch(e -> e.getTagNumber().equals(lotoPoint.getTagNumber()));
    }

    private boolean isLotoPointComplete(LotoPoint lotoPoint) {
        boolean isLotoPointComplete = lotoPoint!= null  &&
                lotoPoint.getTagNumber()!= null &&
                lotoPoint.getDescription()!= null &&
                lotoPoint.getIsoPos()!= null &&
                lotoPoint.getNormPos()!= null &&
                lotoPoint.getSpecificLocation()!= null;
        Equipment eq = lotoPoint.getEquipmentList().stream().filter(e -> e.getTagNumber().equals(lotoPoint.getTagNumber())).findFirst().orElse(null);
        boolean isEquipmentComplete = eq!= null &&
                eq.getEqType()!= null && eq.getEqType().getName()!= null &&
                eq.getLocation()!= null && eq.getLocation().getName()!= null &&
                eq.getSystem()!= null && eq.getSystem().getName()!= null &&
                eq.getVendor()!= null && eq.getVendor().getName()!= null;

        return isLotoPointComplete && isEquipmentComplete;
    }







    private LotoPoint transformLotoPoint(LotoPoint source, String fromUnit, String toUnit) {
        LotoPoint transformed = new LotoPoint();
        transformed.setTagNumber(toUnit + source.getTagNumber().substring(2));

        if (source.getDescription() != null) {
            transformed.setDescription(transformText(source.getDescription(), fromUnit, toUnit));
        }

        if (source.getSpecificLocation() != null) {
            transformed.setSpecificLocation(transformText(source.getSpecificLocation(), fromUnit, toUnit));
        }


        return transformed;
    }

    private boolean compareLotoPoint(LotoPoint e1, LotoPoint e2) {
        if (e1 == null || e2 == null) return false;

        return Objects.equals(e1.getTagNumber().toLowerCase(), e2.getTagNumber().toLowerCase()) &&
                Objects.equals(e1.getDescription().toLowerCase(), e2.getDescription().toLowerCase());
    }

    private String transformText(String text, String fromUnit, String toUnit) {
        return Arrays.stream(text.split(" "))
                .map(word -> {
                    if (word.startsWith(fromUnit)) {
                        return toUnit + word.substring(2);
                    } else {
                        return word;
                    }
                })
                .collect(Collectors.joining(" "))
                .replace("Unit" + fromUnit.charAt(1), "Unit" + toUnit.charAt(1))
                .replace("UNIT " + fromUnit.charAt(1), "UNIT" + toUnit.charAt(1))
                .replace("UNIT" + fromUnit.charAt(1), "UNIT" + toUnit.charAt(1))
                .replace("Unit " + fromUnit.charAt(1), "Unit " + toUnit.charAt(1))
                .replace("U" + fromUnit.charAt(1), "U" + toUnit.charAt(1));
    }





}
