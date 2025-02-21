package com.dk_power.power_plant_java.sevice.data_transfer.transfer_to_data_service_project;

import com.dk_power.power_plant_java.api.DataServiceClient;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.equipment.DS_LotoPointDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.files.DS_FileElementDto;
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
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
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
    private final FileElementTransferService fileElementTransferService;
    private final FileObjectTransferService fileObjectTransferService;
    /************************************************************************************
     *TRANSFER EXECUTION
     ***************************************************************************************/
    public void initialCleanup(){
        removeSpaces();
    }

    public void transferAllLotoPoints() throws IOException {
//        List<LotoPoint> all =  fileElementTransferService.getReadyForTransferPoints();
        List<LotoPoint> all =  lotoPointService.getActiveLotoPointEntities();
        int count = 0;
        int conflicts = 0;
        for (LotoPoint lotoPoint : all) {
            boolean b = transferOneLotoPointTransactional(lotoPoint);
            if(b){
                count++;
            } else {
                conflicts++;
            }
            if(count > 10){break;}
        }
        System.out.println("Total loto points transferred: " + count);
        System.out.println("Total conflicts: " + conflicts);
    }

    public boolean transferOneLotoPoint(String id) throws IOException {
        LotoPoint lotoPoint = lotoPointService.getEntityById(id);
        if(lotoPoint==null) return false;
        return transferOneLotoPointTransactional(lotoPoint);
    }

    public void testTransferOneLotoPoint(){
        for(LotoPoint lp : lotoPointService.getAll()){
            if(lp.getEquipmentList()!=null &&!lp.getEquipmentList().isEmpty() && lp.getEquipmentList().stream().anyMatch(e->e.getTagNumber().equals(lp.getTagNumber()))){

                try {
                    System.out.println("transfering loto point for test");
                    if( !transferOneLotoPoint(lp)) continue;
                    else return;
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
            }
        }
        return;
    }

    public void clearTransferStatus(){
        equipmentService.getAll().forEach(e ->{
            e.setRefactorNotes(null);
            equipmentService.save(e);
        } );
        lotoPointService.getAll().forEach(lp ->{
            lp.setDataServiceItemId(null);
            lp.setRefactorNotes(null);
            lotoPointService.save(lp);
        });
    }

    /************************************************************************************
        *TRANSFER LOGIC
     ***************************************************************************************/

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    private boolean transferOneLotoPointTransactional(LotoPoint lotoPoint) throws IOException {
        try {
            return transferOneLotoPoint(lotoPoint);
        } catch (Exception e) {
            System.err.println("Error transferring loto point with tag number: " + lotoPoint.getTagNumber());
            e.printStackTrace();
            return false;
        }
    }

    private boolean transferOneLotoPoint(LotoPoint lotoPoint) throws IOException {
        Set<Equipment> equipmentList = lotoPoint.getEquipmentList().stream().filter(e -> e.getTagNumber().equals(lotoPoint.getTagNumber())).collect(Collectors.toSet());
        if(equipmentList.isEmpty()){
            System.out.println("No equipment found for loto point with tag number: " + lotoPoint.getTagNumber());
             return false;
        }
        Set<FileObject> fileObjects = equipmentList.stream().map(equipment -> equipment.getMainFile()).collect(Collectors.toSet());
        if(fileObjects.isEmpty()){
            System.out.println("No main file found for equipment with tag number: " + lotoPoint.getTagNumber());
             return false;
        }

        for (FileObject fileObject : fileObjects) {
            if(!fileObjectTransferService.transferOneFile(fileObject)) {
                System.out.println("Failed to transfer file for equipment with tag number: " + lotoPoint.getTagNumber());
                return false;
            }
        }
        for (Equipment equipment : equipmentList) {
            if(!fileElementTransferService.transferOneFileElement(equipment)) {
                System.out.println("Failed to transfer file element for equipment with tag number: " + lotoPoint.getTagNumber());
                return false;
            }
            if(!transferOneLotoPoint(equipment)){
                System.out.println("Failed to transfer equipment for tag number: " + lotoPoint.getTagNumber());
                return false;
            }
        }

        return true;
    }

    private boolean transferOneLotoPoint(Equipment e){
        if(e==null) return false;
        if(e.getRefactorNotes()!=null && e.getRefactorNotes().contains("lpId")){
            LotoPoint lotoPoint = e.getLotoPoints().stream().filter(lp -> lp.getTagNumber().equals(e.getTagNumber())).findFirst().orElse(null);
            DS_LotoPointDto lp = dataServiceClient.getLotoPointById(lotoPoint.getDataServiceItemId());
            DS_FileElementDto fe = dataServiceClient.getFileElementByEqId(e.getDataServiceItemId());
            if(lp!=null && fe!=null && fe.getConnection().getId().equals(lp.getId())){
                System.out.println("Loto point already exists for equipment with id: " + e.getId() + ", tag number: " + e.getTagNumber());
                return false;
            }
        }

        UUID fileElementId = e.getDataServiceItemId();
        DS_LotoPointDto lotoPointDto = null;

        if(e.getLotoPoints()!=null &&!e.getLotoPoints().isEmpty()){
            LotoPoint lotoPoint = e.getLotoPoints().stream().filter(lp -> lp.getTagNumber().equals(e.getTagNumber())).findFirst().orElse(null);

            if(isLotoPointConflicted(lotoPoint)){
                return false;
            }

            try{
                lotoPointDto = dsLotoPointMapper.map(e);
            }catch (Exception ex){
                Conflict incompleteLpConflict = conflictService.createIncompleteLpConflict(lotoPoint);
                e.addConflictId(incompleteLpConflict.getId().toString());
                equipmentService.save(e);
                return false;
            }

            // Send POST request to create loto point
            String ds_lotoPointId = lotoPoint.getDataServiceItemId()!=null ? lotoPoint.getDataServiceItemId().toString() : null;
            lotoPointDto.setId(ds_lotoPointId!=null ? UUID.fromString(ds_lotoPointId) : null);
            lotoPointDto.setOldPidProjectItemId(lotoPoint.getId());
            String message = ds_lotoPointId==null ? "Loto point created successfully: " : "Loto point updated successfully: ";

            ResponseEntity<DS_LotoPointDto> responseLotoPoint = dataServiceClient.createOrUpdateLotoPoint(fileElementId.toString(), lotoPointDto);
            if (responseLotoPoint != null && responseLotoPoint.getStatusCode() == HttpStatus.OK) {
                UUID id = responseLotoPoint.getBody().getId();
                e.addRefactorNote("lpId" + id + "lpId");
                equipmentService.save(e);
                lotoPoint.setDataServiceItemId(id);
                lotoPointService.save(lotoPoint);
                System.out.println(message + responseLotoPoint.getBody());
            }else{
                throw new RuntimeException("Failed to create or update loto point for equipment with id: " + e.getId() + ", tag number: " + e.getTagNumber());
            }

        }else{
            Conflict saved = conflictService.save(Conflict.builder()
                    .entityId(e.getId().toString())
                    .entityType(e.getObjectType())
                    .conflictType(Conflict.ConflictType.equipment_lp_tag_mismatch)
                    .status(Conflict.ConflictStatus.OPEN)
                    .build());
            e.addConflictId(saved.getId().toString());
            equipmentService.save(e);
            return false;
        }
        return true;
    }




    /************************************************************************************
     *CONFLICT HANDLING METHODS
     ***************************************************************************************/

    public boolean isLotoPointConflicted(LotoPoint lotoPoint){
        if(
            lotoPoint==null ||
            !bothUnitsHaveMatchingLotoPoints(lotoPoint) ||
            !lotoPointHasMatchingEquipment(lotoPoint)||
            !isLotoPointComplete(lotoPoint)
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
            conflictService.createUnitMismatchConflict(lotoPoint, null, "Missing corresponding equipment");
            return false;
        } else if (lotoPoint.getDescription() == null || otherUnitLotoPoint.getDescription() == null) {
            conflictService.createUnitMismatchConflict(lotoPoint, otherUnitLotoPoint, "Missing corresponding equipment description");
            return false;
        } else {
            LotoPoint transformedLotoPoint = transformLotoPoint(lotoPoint, lotoPoint.getTagNumber().substring(0, 2), otherUnitPrefix);

            if (!compareLotoPoint(transformedLotoPoint, otherUnitLotoPoint)) {
                conflictService.createUnitMismatchConflict(lotoPoint, otherUnitLotoPoint, "Mismatch after transformation");
                return false;
            }
        }

        return true;
    }

    private boolean lotoPointHasMatchingEquipment(LotoPoint lotoPoint) {
        if (lotoPoint == null) return false;

        Set<Equipment> equipmentList = lotoPoint.getEquipmentList();
        if(equipmentList == null || equipmentList.isEmpty()){
            conflictService.createLpMissingEqConflict(lotoPoint);
            return false;
        }
        if (!equipmentList.stream().anyMatch(e -> e.getLotoPoints().contains(lotoPoint))){
            conflictService.createLpMissingEqConflict(lotoPoint);
             return false;
        }
        if(!equipmentList.stream().anyMatch(e -> e.getTagNumber().equals(lotoPoint.getTagNumber()))){
            conflictService.createLpMissingEqConflict(lotoPoint);
            return false;
        }
        return true;
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

        if(!isLotoPointComplete || !isEquipmentComplete){
            conflictService.createIncompleteLpConflict(lotoPoint);
            return false;
        }
        return true;
    }




    /************************************************************************************
     *HELPER METHODS
     ***************************************************************************************/


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

    private void removeSpaces() {
        for (Equipment e : equipmentService.getAll()) {
            if (e.getTagNumber() != null) {
                e.setTagNumber(e.getTagNumber().trim());
            }
            if (e.getDescription() != null) {
                e.setDescription(e.getDescription().trim());
            }
            equipmentService.save(e);
        }
        for (LotoPoint lp : lotoPointService.getAll()) {
            if (lp.getTagNumber() != null) {
                lp.setTagNumber(lp.getTagNumber().trim());
            }
            if (lp.getDescription() != null) {
                lp.setDescription(lp.getDescription().trim());
            }
            lotoPointService.save(lp);
        }
    }





}
