package com.dk_power.power_plant_java.sevice.data_transfer.transfer_to_data_service_project;

import com.dk_power.power_plant_java.api.DataServiceClient;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.files.DS_FileElementDto;
import com.dk_power.power_plant_java.entities.Conflict;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.mappers.transfer_to_data_service_project.DS_FileElementMapper;
import com.dk_power.power_plant_java.repository.ConflictRepo;
import com.dk_power.power_plant_java.sevice.equipment.impl.EquipmentServiceImpl;
import com.dk_power.power_plant_java.sevice.file.FileServiceImpl;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointServiceImpl;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class FileElementTransferService {

    private final EquipmentServiceImpl equipmentService;
    private final LotoPointServiceImpl lotoPointService;
    private final ConflictRepo conflictRepo;
    private final FileServiceImpl fileService;

    private final DS_FileElementMapper fileElementMapper;
    private final ConflictService conflictService;
    private final DataServiceClient dataServiceClient;
    /******************************************************
     * INITIAL CLEANUP
     *******************************************************/
    public void initialCleanup(){
        removeQuotesFromCoordinates();
    }

    private void removeQuotesFromCoordinates(){
        List<Equipment> all = equipmentService.getAll();
        for (Equipment e : all) {
            e.setCoordinates(e.getCoordinates().replaceAll("\"", ""));
            equipmentService.save(e);
        }
    }

    /******************************************************
     * TRANSFER
     *******************************************************/

    public boolean transferOneFileElement(Equipment e) {
        if(e==null) return false;
        if(e.getDataServiceItemId()!=null){
            DS_FileElementDto element = dataServiceClient.getFileElementByEqId(e.getDataServiceItemId());
            if(element!=null){
                System.out.println("File element exists for eq with id: " + e.getId() + ", tag number: " + e.getTagNumber());
                return true;
            }
        }
        FileObject mainFile = e.getMainFile();
        if(mainFile!=null && mainFile.getDataServiceItemId()!= null){

            DS_FileElementDto fileElement = null;
            try {
                fileElement = fileElementMapper.map(e);
            } catch (Exception ex) {
                System.err.println("Error mapping equipment to DS_FileElementDto: " + ex.getMessage());
                ex.printStackTrace();
                Conflict confflict = conflictService.save(Conflict.builder()
                                .entityId(e.getId().toString())
                                .entityType(e.getObjectType())
                                .conflictType(Conflict.ConflictType.equipment_coordinates)
                                .build());
                e.addConflictId(confflict.getId().toString());
                equipmentService.save(e);
                return false;
            }

            // Send POST request to create file element
            UUID fileId = mainFile.getDataServiceItemId();
            ResponseEntity<DS_FileElementDto> response = dataServiceClient.createFileElement(fileId.toString(), fileElement);

            if (response != null && response.getStatusCode() == HttpStatus.OK) {
                UUID id = response.getBody().getId();
                e.setDataServiceItemId(id);
                System.out.println("File element created successfully: " + response.getBody());
            } else {
                System.out.println("Failed to create file element");
            }
        }
        return true;
    }

    public void clearTransferStatus(){
        equipmentService.getAll().forEach(e ->{
            e.setDataServiceItemId(null);
            equipmentService.save(e);
        } );
    }


}
