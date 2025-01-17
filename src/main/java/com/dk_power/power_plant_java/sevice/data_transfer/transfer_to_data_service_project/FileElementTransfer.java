package com.dk_power.power_plant_java.sevice.data_transfer.transfer_to_data_service_project;

import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_CategoryDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_ValueDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.files.DS_FileElementDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.sevice.equipment.impl.EquipmentServiceImpl;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileElementTransfer {

    private final EquipmentServiceImpl equipmentService;
    private final LotoPointServiceImpl lotoPointService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    protected void createFileElements(){
        //Get all equipment
        List<Equipment> all = equipmentService.getAll();
        int count = 0;
        for (Equipment e : all) {
            Map<String, Float> coordinatesMap;
            try{
                coordinatesMap = convertToCoordinatesMap(e.getCoordinates(), e.getOriginalPictureSize());
            }catch (Exception ex){
                continue;
            }
            FileObject mainFile = e.getMainFile();
            String color = "rgb(7, 89, 189)";
            if(mainFile!=null && mainFile.getDataServiceItemId()!= null){
                DS_FileElementDto fileElement = DS_FileElementDto.builder()
                        .tagNumber(e.getTagNumber())
                        .shapeData(coordinatesMap)
                        .color(color)
                        .shapeType(DS_ValueDto.builder().category(DS_CategoryDto.builder().name("Shape Type").build()).name("Rectangle").build())
                        .elementType(DS_ValueDto.builder().category(DS_CategoryDto.builder().name("Element Type").build()).name("equipment").build())
                        .oldPidProjectItemId(e.getId())
                        .build();

                // Send POST request to create file element
                UUID fileId = mainFile.getDataServiceItemId(); // Assuming this is the correct ID to use
                ResponseEntity<DS_FileElementDto> response = createFileElement(fileId.toString(), fileElement);

                if (response != null && response.getStatusCode() == HttpStatus.OK) {
                    UUID id = response.getBody().getId();
                    e.addRefactorNote("fileElementId:" + id);
                    System.out.println("File element created successfully: " + response.getBody());
                } else {
                    System.out.println("Failed to create file element");
                }
            }
//            if(count++>0) break;
        }
        //For each equipment:
        //Create new fileElement
        //if equipment is "Connector" - set fileElement type to "Connector", set tagNumber, set FileObject, setConnection to related FileObject
        //if equipment has loto points - check for conflicts, create new loto point, fill out fields, set FileElement
        //Register id of old equipment in new equipment
        //Save new equipment
    }

    private Map<String, Float> convertToCoordinatesMap(String coordinates, String originalPictureSize) {
        Map<String, Float> result = new HashMap<>();

        // Parse coordinates
        String[] coordParts = coordinates.split(",");
        for (String part : coordParts) {
            String[] keyValue = part.split(":");
            if (keyValue.length == 2) {
                String key = keyValue[0].trim();
                float value = Float.parseFloat(keyValue[1].trim());
                switch (key) {
                    case "startX":
                        result.put("x", value);
                        break;
                    case "startY":
                        result.put("y", value);
                        break;
                    case "width":
                        result.put("width", value);
                        break;
                    case "height":
                        result.put("height", value);
                        break;
                }
            }
        }

        // Parse original picture size
        String[] sizeParts = originalPictureSize.split(",");
        for (String part : sizeParts) {
            String[] keyValue = part.split(":");
            if (keyValue.length == 2) {
                String key = keyValue[0].trim();
                float value = Float.parseFloat(keyValue[1].trim());
                switch (key) {
                    case "width":
                        result.put("originalPictureWidth", value);
                        break;
                    case "height":
                        result.put("originalPictureHeight", value);
                        break;
                }
            }
        }

        return result;
    }

    private ResponseEntity<DS_FileElementDto> createFileElement(String fileId, DS_FileElementDto fileElementDto) {
        String url = "http://localhost:8081/api/file-elements/" + fileId;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<DS_FileElementDto> requestEntity = new HttpEntity<>(fileElementDto, headers);

        try {
            ResponseEntity<DS_FileElementDto> responseEntity = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    DS_FileElementDto.class
            );

            return responseEntity;
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            System.out.println("Error creating FileElement: " + e.getStatusCode() + " " + e.getResponseBodyAsString());
            return null;
        } catch (Exception e) {
            System.out.println("Unexpected error creating FileElement: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    public void clearTransferStatus(){
        equipmentService.getAll().forEach(e ->{
            e.setRefactorNotes(null);
            e.setDataServiceItemId(null);
            equipmentService.save(e);
        } );
    }

}
