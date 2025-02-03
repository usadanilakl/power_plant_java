package com.dk_power.power_plant_java.sevice.data_transfer.transfer_to_data_service_project;

import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_ValueDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.equipment.DS_LotoPointDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.equipment.DS_TagNumberDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.files.DS_FileElementDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.files.DS_FileObjectDtoDS;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.sevice.equipment.impl.EquipmentServiceImpl;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.util.*;

@Service
@Transactional
@RequiredArgsConstructor
public class TransferToDataServiceProject {

    /*****************************************************************************************
     * POSSIBLE CONFLICTS AND CONFLICT RESOLUTION
     ****************************************************************************************/
    /**
     * MAIN OBJECTIVE:
     *      1. Each file contains file elements
     *      2. Each file element is linked to a file or equipment
     *      3. Loto point is child of Equipment so if loto point is created, equipment will be automatically created.
     *      4. Each equipment will have connections From and To other equipment.
     * POSSIBLE CONFLICTS:
     *     Duplicate equipment (excluding pipes) 371 - MEANS that same equipment is shown multiple times in a file(s), or tagNumber is not unique - SOLUTION: create file element for each instance, merge duplicates into one equipment, in case if it is 2 different equipment with matching tag - mark to indicate it.
     *     780 out of 5060 Equipment with multiple loto points found - MEANS that equipment has assosiations with other equipment - SOLUTION: create loto point for each instance and establish connections using To and From fields
     *     304 equipment that have loto point associated with them do not contain loto point that matches equipment tagNumber

     *     Duplicate loto points 521 (by tag number) - MEANS that same loto point was created multiple times, or tagNumber is not unique - SOLUTION: create loto point for each instance, merge duplicates into one loto point, in case if it is 2 different loto points with matching tag - mark
     *     loto points that belong to multiple equipment: 587 - MEANS that loto point has assosiations with other equipment - SOLUTION: create loto point for each instance and establish connections using To and From fields
     *     processed loto points: 7978/11712 - MEANS that some loto points are not processed and might be wrong - SOLUTION: process manually and associate with files or delete.
     *     not processed loto points: 3734
     *
     *     equipment without type
     *     loto points without isoPos/normPos


     * POSSIBLE CONFLICT RESOLUTION:
     *      1. Transfer files
     *      2. Fix coordinates in equipment
     *      3. Transfer all Equipment as FileElements
     *      4. Fix equipment conflicts
     *      5. Transfer equipment as Connectors, Equipment and LotoPoints
     *      6. Transfer heat trace as equipment
     *      7. Transfer electrical breakers and panels as equipment
     *      8. Create Equipment connections using tag reference in equipment description field or LotoPoints
     *
     *
     * FIXING EQUIPMENT CONFLICTS:
     *     1. Duplicate equipment - combine loto points, match description so all duplicates have same information.
     *     2. U1/U2 mismatch conflict - make sure both units have same equipment with matching description.
     *     3. Equipment with no matching loto point - if electrical then need to create new electrical equipment.
     *     4. Transfer all equipment that has loto points - send new LotoPoint to Data Service Project, get file element object that represents this loto point, check if loto point with same tag already exists, if not then save it and assosiate with file element, if exists then assosiate existing loto point with file element.
     *
     **/






    private final EquipmentServiceImpl equipmentService;
    private final LotoPointServiceImpl lotoPointService;

    private final FileObjectTransferService fileObjectTransferService;
    private final FileElementTransferService fileElementTransferService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public void transferExecution() throws IOException {
//        fileElementTransferService.identifyConflicts();
//        fileElementTransferService.identifyConflictedEquipment();

//        fileObjectTransferService.cleanTransferData();
//        fileObjectTransferService.transferFileObjects();
//
//        fileElementTransferService.clearFileElementTransferStatus();
//        fileElementTransferService.transferFileElements();
//
        fileElementTransferService.clearEquipmentTransferStatus();
        fileElementTransferService.transferEquipment();
    }



    private void transferEquipment(){
        //get all equipment
        List<Equipment> all = equipmentService.getAll();
        Set<String> tags = new HashSet<>();
        for (Equipment e : all) {
            DS_TagNumberDto tagNumber = DS_TagNumberDto.builder().number(e.getTagNumber()).build();
            Set<DS_TagNumberDto> tagNumbers = new HashSet<> (Collections.singletonList(tagNumber));
            DS_FileObjectDtoDS fileObject = DS_FileObjectDtoDS.builder().id(e.getMainFile().getDataServiceItemId()).build();

            if(e.getEqType().getName().equals("Connector")){
                DS_ValueDto shapeType = DS_ValueDto.builder().name("Rectangle").build();
                DS_FileElementDto fileElement = DS_FileElementDto.builder()
                        .tagNumber(e.getTagNumber())
                        .coordinates(e.getCoordinates())
                        .originalPictureSize(e.getOriginalPictureSize())
                        .elementType(shapeType)
                        .shapeType(shapeType)
                        .fileObject(fileObject)
                        .build();
            }else {
                if(tags.add(e.getTagNumber())){
                    DS_ValueDto shapeType = DS_ValueDto.builder().name("Rectangle").build();
                    DS_ValueDto elementType = DS_ValueDto.builder().name("Equipment").build();
                    DS_FileElementDto fileElement = DS_FileElementDto.builder()
                            .tagNumber(e.getTagNumber())
                            .coordinates(e.getCoordinates())
                            .originalPictureSize(e.getOriginalPictureSize())
                            .elementType(shapeType)
                            .fileObject(fileObject)
                            .build();
                }
            }
            if(tags.add(e.getTagNumber())){
                if(e.getLotoPoints()!=null && e.getLotoPoints().size()>0){
                    //get existing equipment from data service progect
                    //merge datata
                    //send updated equipment back to data service project to be saved
                }else{

                }
            }
        }
    }

    private void createLotoPoints(){
        List<LotoPoint> all = lotoPointService.getAll();
        Set<String> tags = new HashSet<>();
        for (LotoPoint lp : all) {
            if(lp.getEquipmentList()!=null && lp.getEquipmentList().size()>0){
                if(!tags.add(lp.getTagNumber())){
                    //get existing loto point from data service progect
                    //merge datata
                    //send updated loto point back to data service project to be saved
                }else{
                    DS_TagNumberDto tagNumber = DS_TagNumberDto.builder().number(lp.getTagNumber()).build();
                    Set<DS_TagNumberDto> tagNumbers = new HashSet<> (Collections.singletonList(tagNumber));
                    DS_LotoPointDto.builder()
                            .unit(lp.getUnit())
                            .description(lp.getDescription())
                            .tagNumbers(tagNumbers)
                            .build();

                }
            }
        }
    }

}
