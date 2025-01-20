package com.dk_power.power_plant_java.sevice.data_transfer.transfer_to_data_service_project;

import com.dk_power.power_plant_java.dto.data_service_project_dtos.ApiResponse;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_CategoryDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_ValueDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.equipment.DS_LotoPointDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.equipment.DS_TagNumberDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.files.DS_FileElementDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.files.DS_FileObjectDtoDS;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.sevice.equipment.impl.EquipmentServiceImpl;
import com.dk_power.power_plant_java.sevice.file.FileServiceImpl;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointServiceImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.entity.mime.MultipartEntityBuilder;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.io.File;
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


     * POSSIBLE CONFLICT RESOLUTION:
     *      1. Transfer files
     *      2. Transfer loto points that have no conflicts
     *      3. Transfer equipment that have no conflicts
     *      4. Transfer heat trace to equipment
     *      5. Transfer electrical breakers and panels to equipment
     *      6. resolve equipment and loto point conflicts - get rest of the equipment and loto points and process them manually (build UI to process)
     *      7. create FileElements with connections
     *      8. create equipment connections
     **/



    private final EquipmentServiceImpl equipmentService;
    private final LotoPointServiceImpl lotoPointService;

    private final FileObjectTransfer fileObjectTransfer;
    private final FileElementTransfer fileElementTransfer;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public void transferExecution() throws IOException {
//        fileElementTransfer.removeSpaces();
//        fileElementTransfer.identifyDuplicateEquipment();
//        fileElementTransfer.matchLotoPointsInDuplicates();

//        fileObjectTransfer.transferFileObjects();
//        fileObjectTransfer.cleanTransferData();

//        fileElementTransfer.clearTransferStatus();
//        fileElementTransfer.createFileElements();
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
