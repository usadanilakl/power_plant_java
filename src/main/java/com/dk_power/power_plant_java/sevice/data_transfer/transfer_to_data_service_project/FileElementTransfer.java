package com.dk_power.power_plant_java.sevice.data_transfer.transfer_to_data_service_project;

import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_CategoryDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_ValueDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.files.DS_FileElementDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.sevice.equipment.impl.EquipmentServiceImpl;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
public class FileElementTransfer {

    private final EquipmentServiceImpl equipmentService;
    private final LotoPointServiceImpl lotoPointService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private LinkedList<String> duplicateEquipment = new LinkedList<>();

//    @PostConstruct
//    private void init(){
//        List<Equipment> all = equipmentService.getAll();
//        Set<String> tags = new HashSet<>();
//        for (Equipment e : all) {
//            if(e.getLotoPoints()!=null && !e.getLotoPoints().isEmpty() && !tags.add(e.getTagNumber())){
//                duplicateEquipment.add(e.getTagNumber());
//            }
//        }
//    }

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

    public void clearTransferStatus(){
        equipmentService.getAll().forEach(e ->{
            e.setRefactorNotes(null);
            e.setDataServiceItemId(null);
            equipmentService.save(e);
        } );
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


    
    
    
    public List<Equipment> getConflictingEquipment(String conflictType) {
    switch (conflictType.toLowerCase()) {
        case "coordinates":
            return checkCoordinateConflicts();
        case "duplicates":
            return checkForEquipmentDuplicates();
        case "tag":
            return checkForEquipmentWithNoMatchingLotoPoint();
        default:
            throw new IllegalArgumentException("Unknown conflict type: " + conflictType);
    }
}

    public List<LotoPoint> getConflictingLotoPoints(String conflictType) {
        switch (conflictType.toLowerCase()) {
            case "noEquipment":
                return lotoPointsWithNoEquipmentAssociation();
            case "duplicates":
                return checkForLotoPointDuplictates();
            case "unprocessed":
                return getUnprocessedLotoPoints();
            default:
                throw new IllegalArgumentException("Unknown conflict type: " + conflictType);
        }
    }
    
    
    public List<Equipment> checkCoordinateConflicts(){
        List<Equipment> conflicts = new ArrayList<Equipment>();
        List<Equipment> all = equipmentService.getAll();
        for (Equipment e : all) {
            if(e.getCoordinates()==null || e.getOriginalPictureSize()==null){
                conflicts.add(e);
                continue;
            }

            try{
                convertToCoordinatesMap(e.getCoordinates(),e.getOriginalPictureSize());
            }catch(Exception ex){
                conflicts.add(e);
                continue;
            }
        }
        return conflicts;
    }

    public List<Equipment> checkForEquipmentDuplicates(){
        List<Equipment> duplicates = new ArrayList<Equipment>();
        List<Equipment> all = equipmentService.getAll();
        Set<String> tags = new HashSet<>();
        for (Equipment e : all) {
            if(e.getLotoPoints()!=null && !e.getLotoPoints().isEmpty() && !tags.add(e.getTagNumber())){
                duplicates.addAll(equipmentService.getByTagNumber(e.getTagNumber()));
            }
        }
        return duplicates;
    }

    public List<Equipment> getSingleSetOfEqDuplicates(){
        return equipmentService.getByTagNumber(duplicateEquipment.pop());
    }

    public List<Equipment> checkForEquipmentWithNoMatchingLotoPoint(){
        List<Equipment> all = equipmentService.getAll();
        List<Equipment> noLotoPoints = new ArrayList<>();
        for (Equipment e : all) {
            if(e.getLotoPoints()!=null && !e.getLotoPoints().isEmpty()) {
                if(e.getLotoPoints().stream().noneMatch(lp -> lp.getTagNumber().equals(e.getTagNumber()))){
                    noLotoPoints.add(e);
                }
            }
        }
        return noLotoPoints;
    }

    public List<LotoPoint> lotoPointsWithNoEquipmentAssociation(){
        List<LotoPoint> all = lotoPointService.getAll();
        List<LotoPoint> noEquipmentAssociation = new ArrayList<>();
        for (LotoPoint lp : all) {
            if((lp.getEquipmentList()!=null && !lp.getEquipmentList().isEmpty()) || (lp.getFileIds()!=null && !lp.getFileIds().isEmpty())){
                noEquipmentAssociation.add(lp);
            }
        }
        return noEquipmentAssociation;
    }

    public List<LotoPoint> checkForLotoPointDuplictates(){
        List<LotoPoint> duplicates = new ArrayList<LotoPoint>();
        List<LotoPoint> all = lotoPointService.getAll();
        Set<String> tags = new HashSet<>();
        for (LotoPoint lp : all) {
            if(!tags.add(lp.getTagNumber())){
                duplicates.add(lp);
            }
        }
        return duplicates;
    }

    public List<LotoPoint> getUnprocessedLotoPoints(){
        List<LotoPoint> all = lotoPointService.getAll();
        List<LotoPoint> notProcessed = new ArrayList<>();
        for (LotoPoint lp : all) {
            if((lp.getEquipmentList()==null || lp.getEquipmentList().isEmpty()) && (lp.getFileIds()==null || lp.getFileIds().isEmpty())){
                notProcessed.add(lp);
            }
        }
        return notProcessed;
    }

    


}
