package com.dk_power.power_plant_java.sevice.data_transfer;

import com.amazonaws.util.IOUtils;
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
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.entity.mime.MultipartEntityBuilder;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.HttpEntity;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.springframework.core.ParameterizedTypeReference;
import org.apache.hc.core5.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Service;
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
    private final FileServiceImpl fileService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public void transferExecution() throws IOException {
        transferFileObjects();
    }

    private void transferFileObjects() throws IOException {
        List<FileObject> all = fileService.getAll();
        int count = 0;
        for (FileObject fileObject : all) {
//            if(count++>20) break;
            DS_FileObjectDtoDS newFileObject = DS_FileObjectDtoDS.builder()
                    .name(fileObject.getName())
                    .fileNumber(fileObject.getFileNumber())
                    .extension(fileObject.getExtension())
                    .vendor(DS_ValueDto.builder().category(DS_CategoryDto.builder().name("Vendor").build()).name(fileObject.getVendor().getName()).build())
                    .oldPidProjectItemId(fileObject.getId())
                    .build();

            String fileObjectJson = objectMapper.writeValueAsString(newFileObject);

            MultipartEntityBuilder builder = MultipartEntityBuilder.create();

            // Add the JSON part
            builder.addTextBody("fileDto", fileObjectJson, ContentType.APPLICATION_JSON);

            // Add the file part
            File file = new File(fileObject.getFileLink());
            if (file.exists()) {
                builder.addBinaryBody("file", file, ContentType.APPLICATION_OCTET_STREAM, file.getName());
            } else {
                System.out.println("File not found: " + fileObject.getFileLink());
                // You might want to skip this iteration or handle the missing file in some way
                continue; // Skip to the next file object
            }

            HttpEntity multipartEntity = builder.build();

            try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
                HttpPost httpPost = new HttpPost("http://localhost:8081/api/files");
                httpPost.setEntity(multipartEntity);

                try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
                    int statusCode = response.getCode();
                    if (statusCode == HttpStatus.OK.value()) {
                        HttpEntity entity = response.getEntity();
                        if (entity != null) {
                            String jsonResponse = EntityUtils.toString(entity);
                            ObjectMapper mapper = new ObjectMapper();
                            ApiResponse<DS_FileObjectDtoDS> apiResponse = objectMapper.readValue(jsonResponse,
                                    new TypeReference<ApiResponse<DS_FileObjectDtoDS>>() {
                                    });

                            DS_FileObjectDtoDS createdFileObject = apiResponse.getData();
                            System.out.println("File created successfully. ID: " + createdFileObject.getId());
                        } else {
                            // Handle error
                            System.out.println("Error creating file. Status: " + statusCode);
                        }
                    }
                } catch (Exception e) {
                    System.out.println("Error during file transfer: " + e.getMessage());
                    e.printStackTrace();
                }
            }
        }
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

    private void createFileElements(){
        //Get all equipment
        //For each equipment:
            //Create new fileElement
            //if equipment is "Connector" - set fileElement type to "Connector", set tagNumber, set FileObject, setConnection to related FileObject
            //if equipment has loto points - check for conflicts, create new loto point, fill out fields, set FileElement
            //Register id of old equipment in new equipment
            //Save new equipment
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

    private void duplcateConflictResolver(){
        //Get duplicates
        //merge data
    }
}
