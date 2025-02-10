package com.dk_power.power_plant_java.sevice.data_transfer.transfer_to_data_service_project;

import com.dk_power.power_plant_java.api.DataServiceClient;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_CategoryDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_ValueDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.equipment.DS_EquipmentDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.equipment.DS_LotoPointDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.equipment.DS_TagNumberDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.files.DS_FileElementDto;
import com.dk_power.power_plant_java.entities.Conflict;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.mappers.transfer_to_data_service_project.DS_FileElementMapper;
import com.dk_power.power_plant_java.repository.ConflictRepo;
import com.dk_power.power_plant_java.sevice.equipment.impl.EquipmentServiceImpl;
import com.dk_power.power_plant_java.sevice.file.FileServiceImpl;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class FileElementTransferService {

    private final EquipmentServiceImpl equipmentService;
    private final LotoPointServiceImpl lotoPointService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final ConflictRepo conflictRepo;
    private final FileServiceImpl fileService;

    private final DS_FileElementMapper fileElementMapper;
    private final ConflictService conflictService;
    private final DataServiceClient dataServiceClient;
    /******************************************************
     * INITIAL CLEANUP
     *******************************************************/

    public void removeQuotesFromCoordinates(){
        List<Equipment> all = equipmentService.getAll();
        for (Equipment e : all) {
            e.setCoordinates(e.getCoordinates().replaceAll("\"", ""));
            equipmentService.save(e);
        }
    }

    /******************************************************
     * TRANSFER
     *******************************************************/

    protected void transferFileElements(){
        List<Equipment> all = equipmentService.getAll();
        int count = 0;
        for (Equipment e : all) {
            transferOneFileElement(e);
        }
    }

    public void transferOneFileElementOld(Equipment e) {
        if(e.getDataServiceItemId()!= null) return;
        Map<String, Float> coordinatesMap;
        try{
            coordinatesMap = convertToCoordinatesMap(e.getCoordinates(), e.getOriginalPictureSize());
        }catch (Exception ex){
            return;
        }
        FileObject mainFile = e.getMainFile();
        String color = "rgb(7, 89, 189)";
        if(mainFile!=null && mainFile.getDataServiceItemId()!= null){
            DS_FileElementDto fileElement = DS_FileElementDto.builder()
                    .tagNumber(e.getTagNumber())
                    .shapeData(coordinatesMap)
                    .color(color)
                    .shapeType(DS_ValueDto.builder().category(DS_CategoryDto.builder().name("Shape Type").build()).name("rectangle").build())
                    .elementType(DS_ValueDto.builder().category(DS_CategoryDto.builder().name("Element Type").build()).name("equipment").build())
                    .oldPidProjectItemId(e.getId())
                    .build();

            // Send POST request to create file element
            UUID fileId = mainFile.getDataServiceItemId();
            ResponseEntity<DS_FileElementDto> response = createFileElement(fileId.toString(), fileElement);

            if (response != null && response.getStatusCode() == HttpStatus.OK) {
                UUID id = response.getBody().getId();
                e.setDataServiceItemId(id);
                e.addRefactorNote("fileElementId:" + id);
                System.out.println("File element created successfully: " + response.getBody());
            } else {
                System.out.println("Failed to create file element");
            }
        }

    }

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
                conflictService.save(Conflict.builder()
                                .entityId(e.getId().toString())
                                .conflictType(Conflict.ConflictType.equipment_coordinates)
                                .build());
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

    protected void transferEquipment(){
        List<Equipment> all = equipmentService.getAll();
        int count = 0;
        for (Equipment e : all) {
            if(e.getConflictId()==null && e.getLotoPoints()!=null & !e.getLotoPoints().isEmpty()){
                transferOneEquipment(e);
                count++;
            }
            if(count>200) break;
        }
    }

    protected void transferOneEquipment(Equipment e){
        if(e==null || e.getDataServiceItemId()==null) return;

        UUID fileElementId = e.getDataServiceItemId();

        DS_ValueDto location = e.getLocation() != null ? DS_ValueDto.builder()
                .category(DS_CategoryDto.builder().name("Location").alias("location").build())
                .name(e.getLocation().getName())
                .build() : null;

        DS_ValueDto vendor = e.getVendor() != null ? DS_ValueDto.builder()
                .category(DS_CategoryDto.builder().name("Vendor").alias("vendor").build())
                .name(e.getVendor().getName())
                .build() : null;

        DS_ValueDto system = e.getSystem() != null ? DS_ValueDto.builder()
                .category(DS_CategoryDto.builder().name("System").alias("system").build())
                .name(e.getSystem().getName())
                .build() : null;

        DS_ValueDto eqType = e.getEqType() != null ? DS_ValueDto.builder()
                .category(DS_CategoryDto.builder().name("Equipment Type").alias("eqType").build())
                .name(e.getEqType().getName())
                .build() : null;
        Set<DS_TagNumberDto> tagNumbers = new HashSet<>();
        tagNumbers.add(DS_TagNumberDto.builder().isPrimary(true).number(e.getTagNumber()).build());

        if(e.getLotoPoints()!=null &&!e.getLotoPoints().isEmpty()){
            LotoPoint lotoPoint = e.getLotoPoints().stream().filter(lp -> lp.getTagNumber().equals(e.getTagNumber())).findFirst().orElse(null);

            if(lotoPoint==null)return;

            String unit = (e.getTagNumber().startsWith("01") ? "Unit 1" : e.getTagNumber().startsWith("02") ? "Unit 2" : "BOP");
            DS_ValueDto isolatedPosition = lotoPoint.getIsoPos()!=null? DS_ValueDto.builder().category(DS_CategoryDto.builder().name("Isolated Position").alias("isoPos").build()).name(lotoPoint.getIsoPos().getName()).build() : null;
            DS_ValueDto normalPosition = lotoPoint.getNormPos()!=null? DS_ValueDto.builder().category(DS_CategoryDto.builder().name("Normal Position").alias("normPos").build()).name(lotoPoint.getNormPos().getName()).build() : null;

            DS_LotoPointDto lotoPointDto = DS_LotoPointDto.builder()
                    .tagNumbers(tagNumbers)
                    .unit(unit)
                    .description(e.getDescription())
                    .location(location)
                    .vendor(vendor)
                    .system(system)
                    .specificLocation(e.getSpecificLocation())
                    .isolatedPosition(isolatedPosition)
                    .normalPosition(normalPosition)
                    .equipmentType(eqType)
                    .oldPidProjectItemId(lotoPoint.getId())
                    .build();
            // Send POST request to create loto point
            String ds_lotoPointId = lotoPoint.getDataServiceItemId()!=null ? lotoPoint.getDataServiceItemId().toString() : null;

            if(ds_lotoPointId==null) {
                ResponseEntity<DS_LotoPointDto> responseLotoPoint = createOrUpdateLotoPoint(fileElementId.toString(), lotoPointDto);
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
                ResponseEntity<DS_LotoPointDto> orUpdateLotoPoint = createOrUpdateLotoPoint(fileElementId.toString(),lotoPointDto);
                System.out.println("Loto point updated successfully: " + orUpdateLotoPoint.getBody());
            }
        }else if(e.getEqType()!=null && e.getEqType().getName().equals("Connector")){
            FileObject entityById = fileService.getEntityById(e.getNote().substring(e.getNote().indexOf(":") + 1).trim());
            String fileObjectId = entityById.getDataServiceItemId().toString();
            ResponseEntity<String> response = createConnector(e.getDataServiceItemId().toString(), fileObjectId);
            if (response != null && response.getStatusCode() == HttpStatus.OK) {
                e.addRefactorNote(response.getBody());
            }
        }else{

        }
    }

    public void clearFileElementTransferStatus(){
        equipmentService.getAll().forEach(e ->{
            e.setDataServiceItemId(null);
            equipmentService.save(e);
        } );
    }

    public void clearEquipmentTransferStatus(){
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

    private ResponseEntity<DS_EquipmentDto> createEquipment(String fileId, DS_EquipmentDto equipmentDto) {
        String url = "http://localhost:8081/api/equipment/" + fileId;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<DS_EquipmentDto> requestEntity = new HttpEntity<>(equipmentDto, headers);

        try {
            ResponseEntity<DS_EquipmentDto> responseEntity = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    DS_EquipmentDto.class
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

    private ResponseEntity<DS_LotoPointDto> createOrUpdateLotoPoint(String fileId, DS_LotoPointDto lotoPointDto) {
        String url = "http://localhost:8081/api/loto-points/" + fileId;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<DS_LotoPointDto> requestEntity = new HttpEntity<>(lotoPointDto, headers);

        try {
            ResponseEntity<DS_LotoPointDto> responseEntity = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    DS_LotoPointDto.class
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

    private ResponseEntity<DS_LotoPointDto> createOrUpdateLotoPoint(DS_LotoPointDto lotoPointDto) {
        String url = "http://localhost:8081/api/loto-points";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<DS_LotoPointDto> requestEntity = new HttpEntity<>(lotoPointDto, headers);

        try {
            ResponseEntity<DS_LotoPointDto> responseEntity = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    DS_LotoPointDto.class
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

    private ResponseEntity<String> createConnector(String fileElementId, String fileObjectId) {
        String url = "http://localhost:8081/api/file-elements/connector/" + fileElementId + "/" + fileObjectId;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> requestEntity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> responseEntity = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    String.class
            );

            return responseEntity;
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            System.out.println("Error creating Connector: " + e.getStatusCode() + " " + e.getResponseBodyAsString());
            return null;
        } catch (Exception e) {
            System.out.println("Unexpected error creating Connector: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }



    public List<LotoPoint> getReadyForTransferPoints() {
        List<LotoPoint> readyForTransfer = new ArrayList<>();
        List<LotoPoint> allNotTransferred = lotoPointService.getAllNotTransferred();
        for (LotoPoint lotoPoint : allNotTransferred) {
            if (lotoPoint.getEquipmentList() != null && !lotoPoint.getEquipmentList().isEmpty() && isNotConflicted(lotoPoint)) {
                readyForTransfer.add(lotoPoint);
            }
        }
        System.out.println("Ready for transfer LOTO points: " + readyForTransfer.size());
        return readyForTransfer;
    }

    private boolean isNotConflicted(LotoPoint lotoPoint) {
        Equipment equipment = lotoPoint.getEquipmentList().stream().filter(eq -> eq.getTagNumber().equals(lotoPoint.getTagNumber())).findFirst().orElse(null);
        if (equipment == null) {
            return false;
        }
        List<Conflict> conflicts = conflictRepo.findByEntityIdContainingAndStatus(lotoPoint.getId().toString(), Conflict.ConflictStatus.OPEN);
        conflicts.addAll(conflictRepo.findByEntityIdContainingAndStatus(equipment.getId().toString(), Conflict.ConflictStatus.OPEN));
        return conflicts.isEmpty();
    }

    private boolean isNotConflicted(Equipment eq) {
        List<Conflict> conflicts = conflictRepo.findByEntityIdContainingAndStatus(eq.getId().toString(), Conflict.ConflictStatus.OPEN);
        return conflicts.isEmpty();
    }


    /******************************************************
     * CONFLICTS
     *******************************************************/
    
    
    public List<Equipment> getConflictingEquipment(Conflict.ConflictType conflictType) {
        return switch (conflictType) {
            case Conflict.ConflictType.equipment_coordinates -> checkCoordinateConflicts();
            case Conflict.ConflictType.equipment_duplicates -> getUnresolvedEquipmentDuplicates(1);
            case Conflict.ConflictType.unit_equipment_mismatch -> getUnresolvedUnitMismatchEquipmentWithLotoPoints(1);
            case Conflict.ConflictType.equipment_lp_tag_mismatch -> getEquipmentWithNoMatchingLotoPoint(10);
            case Conflict.ConflictType.equipment_connector -> getUnresolvedConnectorConflicts(1);
            default -> throw new IllegalArgumentException("Unknown conflict type: " + conflictType);
        };
}

    public List<LotoPoint> getConflictingLotoPoints(String conflictType) {
        switch (conflictType.toLowerCase()) {
            case "noEquipment":
                return lotoPointsWithNoEquipmentAssociation(1);
            case "duplicates":
                return checkForLotoPointDuplictates(1);
            case "unprocessed":
                return getUnprocessedLotoPoints();
            default:
                throw new IllegalArgumentException("Unknown conflict type: " + conflictType);
        }
    }

    public void resolveConflict(Conflict.ConflictType conflictType, String equipmentId) {
        switch (conflictType) {
            case Conflict.ConflictType.equipment_duplicates:
                resolveEqDuplicateConflict(equipmentId);
                break;
            case Conflict.ConflictType.unit_equipment_mismatch:
                resolveUnitMismatchConflict(equipmentId);
                break;
            case Conflict.ConflictType.equipment_lp_tag_mismatch:
                resolveEqLpMismatchConflict(equipmentId);
                break;

            case Conflict.ConflictType.equipment_connector:
                resolveConnectorConflict(equipmentId);
                break;
        }
    }

    public void identifyConflicts(){
        removeSpaces();
        matchLotoPointsInDuplicates();
        connectConnectorsWithSingleFileAndIdentifyConflicts();
        identifyDuplicateEquipment();
        identifyEquipmentWithMismatchBetweenUnits();
        identifyEquipmentWithNomatchingLotoPoint();
        System.out.println("Conflicts identified.");

    }

    public void identifyConflictedEquipment(){
        conflictRepo.findAll().forEach(conflict -> {
            for (String s : conflict.getEntityId().split(",")) {
                Equipment entityById = equipmentService.getEntityById(s);
                if (entityById!= null) {
                    if(entityById.getConflictId()==null || entityById.getConflictId().trim().isEmpty())entityById.setConflictId(conflict.getId().toString());
                    else if(entityById.getConflictId().contains(conflict.getId()+"")) entityById.setConflictId(entityById.getConflictId()+","+conflict.getId());
                    equipmentService.save(entityById);
                }
            }

        });
    }
    
    public void removeSpaces() {
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

    /******************************************************
     * CONNECTORS
     *******************************************************/


    public void connectConnectorsWithSingleFileAndIdentifyConflicts(){

        equipmentService.getByEqType("Connector").forEach(e -> {
                List<FileObject> allFileConnectors = findAllFileConnectors(e.getTagNumber());
                if(allFileConnectors!=null && allFileConnectors.size()==1 && (e.getNote()==null || !e.getNote().contains(allFileConnectors.get(0).getId().toString()))){
                    e.setNote(allFileConnectors.getFirst().getId().toString());
                    equipmentService.save(e);
                }else {
                    String conflictDescription = null;
                    if(allFileConnectors!=null && !allFileConnectors.isEmpty()) conflictDescription ="Multiple files found for the same connectof: " + allFileConnectors.stream().map(FileObject::getId).map(String::valueOf).collect(Collectors.joining(", "));
                    else conflictDescription ="No file found for the connectof: " + e.getTagNumber();
                    if(conflictRepo.findByConflictTypeAndEntityId(Conflict.ConflictType.equipment_connector,e.getId().toString())==null) {
                        Conflict conflict = Conflict.builder()
                                .conflictType(Conflict.ConflictType.equipment_connector)
                                .entityId(e.getId().toString())
                                .status(Conflict.ConflictStatus.OPEN)
                                .description(conflictDescription)
                                .build();
                        conflictRepo.save(conflict);
                    }
                }
        });
    }

    public List<Equipment> getUnresolvedConnectorConflicts(int count){
        List<Conflict> byConflictTypeAndStatus = conflictRepo.findByConflictTypeAndStatus(Conflict.ConflictType.equipment_connector, Conflict.ConflictStatus.OPEN);
        List<Equipment> conflictEquipment = new ArrayList<>();
        int i = 0;
        for (Conflict c : byConflictTypeAndStatus) {
            Equipment entityById = equipmentService.getEntityById(c.getEntityId());
            entityById.setNote(c.getDescription());
            conflictEquipment.add(entityById);
            if(++i>=count) return conflictEquipment;
        }
        return conflictEquipment;
    }

    public FileObject findFileConnector(String connectorText){
        List<FileObject> ifNumberContains = fileService.getIfNumberContains(connectorText);
        if(ifNumberContains.size()==1){
            return ifNumberContains.get(0);
        }else {
            return null;
        }
    }

    public List<FileObject> findAllFileConnectors(String connectorText){
        return fileService.getIfNumberContains(connectorText);
    }

    private void resolveConnectorConflict(String equipmentId) {
        Conflict conflict = conflictRepo.findByConflictTypeAndEntityIdContaining(Conflict.ConflictType.equipment_connector, equipmentId);
        try {
            conflict.setStatus(Conflict.ConflictStatus.RESOLVED);
            conflictRepo.save(conflict);
        }catch (Exception e) {
            System.err.println("Error resolving conflict: " + e.getMessage());
        }

    }


    /******************************************************
     * DUPLICATE EQUIPMENT
     *******************************************************/

    public void matchLotoPointsInDuplicates(){
        List<Equipment> all = equipmentService.getAll();
        Set<String> tags = new HashSet<>();
        int count = 0;
        for (Equipment e : all) {
            if(e.getLotoPoints()!=null && !e.getLotoPoints().isEmpty() && !tags.add(e.getTagNumber())){
                // Found duplicate equipment with LOTO points
                List<Equipment> duplicates = equipmentService.getByTagNumber(e.getTagNumber());
                Set<LotoPoint> lotoPoints = new HashSet<>();

                // Collect all unique LOTO points from all duplicates
                duplicates.forEach(duplicate -> {
                    lotoPoints.addAll(duplicate.getLotoPoints());
                });

                // Update each duplicate with the complete set of LOTO points
                duplicates.forEach(duplicate ->{
                    duplicate.setLotoPoints(lotoPoints);
                    equipmentService.save(duplicate);
                });

                // Update each LOTO point to include all duplicate equipment
                lotoPoints.forEach(lp -> {
                    lp.getEquipmentList().addAll(duplicates);
                    lotoPointService.save(lp);
                });
                count++;
            }
        }
        System.out.println("Matched LOTO points in duplicates: " + count);
    }

    public void identifyDuplicateEquipment() {
        List<Equipment> all = equipmentService.getAll();
        Map<String, List<Equipment>> duplicatesMap = new HashMap<>();

        // Group equipment by tag number
        for (Equipment e : all) {
            duplicatesMap.computeIfAbsent(e.getTagNumber(), k -> new ArrayList<>()).add(e);
        }

        // Create conflicts for duplicates
        for (Map.Entry<String, List<Equipment>> entry : duplicatesMap.entrySet()) {
            List<Equipment> duplicates = entry.getValue();
            if (duplicates.size() > 1) {
                String duplicateIds = duplicates.stream()
                    .map(equipment -> equipment.getId().toString())
                    .collect(Collectors.joining(","));

                boolean hasLotoPoints = duplicates.stream()
                    .anyMatch(e -> e.getLotoPoints() != null && !e.getLotoPoints().isEmpty());

                String description = "Duplicate equipment with tag number: " + entry.getKey() +
                                     ", IDs: " + duplicateIds;
                if (hasLotoPoints) {
                    description += ", associated with LOTO points";
                }

                if(Arrays.stream(duplicateIds.split(",")).noneMatch(id -> conflictRepo.findByConflictTypeAndEntityIdContaining(Conflict.ConflictType.equipment_duplicates,id.trim())!=null))  {
                    Conflict conflict = Conflict.builder()
                            .conflictType(Conflict.ConflictType.equipment_duplicates)
                            .description(description)
                            .createdAt(LocalDateTime.now())
                            .entityId(duplicateIds)
                            .status(Conflict.ConflictStatus.OPEN)
                            .build();

                    conflictRepo.save(conflict);
                }
            }
        }
    }

    public List<Equipment> getEqDuplicates(int count){
        List<Conflict> duplicates = conflictRepo.findByConflictTypeAndDescriptionContaining(Conflict.ConflictType.equipment_duplicates,"LOTO");
        List<Equipment> duplicateEquipment = new ArrayList<>();
        int i = 0;
        for (Conflict d : duplicates) {
            String[] split = d.getEntityId().split(", ");
            for (String s : split) {
                duplicateEquipment.add(equipmentService.getEntityById(s));
            }
            System.out.println(d.getId() + ": " + d.getDescription() + " - " + d.getCreatedAt() + " - " + d.getStatus( ));
            if(++i>=count) return duplicateEquipment;
        }
        return duplicateEquipment;
    }

    public List<Equipment> getEqDuplicates(){
        return getEqDuplicates(200000);
    }

    public List<Equipment> getUnresolvedEquipmentDuplicates(int count){
        List<Conflict> conflicts = conflictRepo.findByConflictTypeAndDescriptionContainingAndStatus(Conflict.ConflictType.equipment_duplicates,"LOTO",Conflict.ConflictStatus.OPEN);
        int i = 0;
        List<Equipment> eqList = new ArrayList<>();
        for (Conflict c : conflicts) {
            String[] split = c.getEntityId().split(",");
            for (String s : split) {
                eqList.add(equipmentService.getEntityById(s.trim()));
            }
            if(++i>=count) return eqList;
        }
        return eqList;
    }

    public Conflict getDuplicateConflictByEntityId(String id){
        return conflictRepo.findByConflictTypeAndEntityIdContaining(Conflict.ConflictType.equipment_duplicates,id);
    }

    public void clearEquipmentDuplicateConfilicts(){
        List<Conflict> duplicates = conflictRepo.findByConflictType(Conflict.ConflictType.equipment_duplicates);
        duplicates.forEach(d -> conflictRepo.delete(d));
    }

    public void resolveEqDuplicateConflict(String eqId){
        Conflict duplicateConflictByEntityId = getDuplicateConflictByEntityId(eqId);
        try{
            duplicateConflictByEntityId.setStatus(Conflict.ConflictStatus.RESOLVED);
            conflictRepo.save(duplicateConflictByEntityId);
            System.out.println(duplicateConflictByEntityId.getId() + ": Conflict resolved for equipment with ID: " + eqId);
        }catch(Exception e){
            // Handle exception
            System.out.println("Error resolving conflict for equipment with ID: " + eqId);
        }
    }

    /******************************************************
     * EQ/LP TAG MISMATCH
     *******************************************************/

    public List<Equipment> getEquipmentWithNoMatchingLotoPoint(){
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

    public List<Equipment> getEquipmentWithNoMatchingLotoPoint(int count){
        List<Equipment> all = equipmentService.getAll();
        List<Equipment> noLotoPoints = new ArrayList<>();
        for (Equipment e : all) {
            if(e.getLotoPoints()!=null && !e.getLotoPoints().isEmpty()) {
                if(e.getLotoPoints().stream().noneMatch(lp -> lp.getTagNumber().equals(e.getTagNumber()))){
                    noLotoPoints.add(e);
                }
            }
            if(noLotoPoints.size()>=count) return noLotoPoints;
        }
        return noLotoPoints;
    }

    public void identifyEquipmentWithNomatchingLotoPoint(){
        List<Equipment> all = equipmentService.getAll();
        for (Equipment e : all) {
            if(e.getLotoPoints()!=null && !e.getLotoPoints().isEmpty()) {
                if(e.getLotoPoints().stream().noneMatch(lp -> lp.getTagNumber().equals(e.getTagNumber()))){
                    if(conflictRepo.findByConflictTypeAndEntityId(Conflict.ConflictType.equipment_lp_tag_mismatch,e.getId().toString())==null ){
                        Conflict conflict = Conflict.builder()
                                .entityId(e.getId().toString())
                                .description("Equipment with tag number " + e.getTagNumber() + " has no matching LOTO point")
                                .conflictType(Conflict.ConflictType.equipment_lp_tag_mismatch)
                                .status(Conflict.ConflictStatus.OPEN)
                                .build();
                        conflictRepo.save(conflict);
                    }
                }
            }
        }
    }

    public List<Equipment> getUnresolvedEquipmentLpMismatchConflicts(int count){
        List<Conflict> conflicts = conflictRepo.findByConflictTypeAndStatus(Conflict.ConflictType.equipment_lp_tag_mismatch, Conflict.ConflictStatus.OPEN);
        int i = 0;
        List<Equipment> eqList = new ArrayList<>();
        for (Conflict c : conflicts) {
            eqList.add(equipmentService.getEntityById(c.getEntityId()));
            if(++i>=count) return eqList;
        }
        return eqList;
    }

    public void resolveEqLpMismatchConflict(String eqId){
        Conflict conflict = conflictRepo.findByConflictTypeAndEntityId(Conflict.ConflictType.equipment_lp_tag_mismatch, eqId);
        if(conflict!=null){
            conflict.setStatus(Conflict.ConflictStatus.RESOLVED);
            conflictRepo.save(conflict);
            System.out.println(conflict.getId() + ": Conflict resolved for equipment with ID: " + eqId);
        }else{
            System.out.println("No conflict found for equipment with ID: " + eqId);
        }
    }


    /*****************************************************
     * U1/U2 MISMATCH EQUIPMENT
     ********************************************************/

    public List<Conflict> identifyEquipmentWithMismatchBetweenUnits() {
        List<Equipment> allEquipment = equipmentService.getAll();
        List<Conflict> conflicts = new ArrayList<>();

        // Group equipment by their base tag number (without unit prefix)
        Map<String, List<Equipment>> equipmentMap = allEquipment.stream()
            .filter(e -> e.getTagNumber().startsWith("01") || e.getTagNumber().startsWith("02"))
            .collect(Collectors.groupingBy(e -> e.getTagNumber().substring(2)));

        for (Map.Entry<String, List<Equipment>> entry : equipmentMap.entrySet()) {
            String baseTag = entry.getKey();
            List<Equipment> equipmentList = entry.getValue();

            Equipment u1Equipment = equipmentList.stream()
                .filter(e -> e.getTagNumber().startsWith("01"))
                .findFirst().orElse(null);

            Equipment u2Equipment = equipmentList.stream()
                .filter(e -> e.getTagNumber().startsWith("02"))
                .findFirst().orElse(null);

            if (u1Equipment == null || u2Equipment == null) {
                createMismatchConflict(conflicts, u1Equipment, u2Equipment, "Missing corresponding equipment");
            }else if(u1Equipment.getDescription()==null || u2Equipment.getDescription()==null){
                createMismatchConflict(conflicts, u1Equipment, u2Equipment, "Missing corresponding equipment description");
            } else {
                Equipment transformedU1 = transformEquipment(u1Equipment, "01", "02");

                if (!compareEquipment(transformedU1, u2Equipment)) {
                    createMismatchConflict(conflicts, u1Equipment, u2Equipment, "Mismatch after transformation (U1 to U2)");
                }
            }
        }

        // Save all conflicts
        for (Conflict conflict : conflicts) {
            try {
                conflictRepo.save(conflict);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        return conflicts;
    }

    private Equipment transformEquipment(Equipment source, String fromUnit, String toUnit) {
        Equipment transformed = new Equipment();
        transformed.setTagNumber(toUnit + source.getTagNumber().substring(2));

        if (source.getDescription() != null) {
            transformed.setDescription(transformText(source.getDescription(), fromUnit, toUnit));
        }

        if (source.getSpecificLocation() != null) {
            transformed.setSpecificLocation(transformText(source.getSpecificLocation(), fromUnit, toUnit));
        }


        return transformed;
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

    private boolean compareEquipment(Equipment e1, Equipment e2) {
        if (e1 == null || e2 == null) return false;

        return Objects.equals(e1.getTagNumber().toLowerCase(), e2.getTagNumber().toLowerCase()) &&
               Objects.equals(e1.getDescription().toLowerCase(), e2.getDescription().toLowerCase());
    }
    
    private void createMismatchConflict(List<Conflict> conflicts, Equipment u1Equipment, Equipment u2Equipment, String reason) {
        String description = reason + " between Unit 1 and Unit 2 equipment: ";
        String entityIds = "";

        if (u1Equipment != null) {
            description += "U1: " + u1Equipment.getTagNumber();
            entityIds += u1Equipment.getId();
        }

        if (u2Equipment != null) {
            description += (u1Equipment != null ? ", " : "") + "U2: " + u2Equipment.getTagNumber();
            entityIds += (u1Equipment != null ? "," : "") + u2Equipment.getId();
        }

        Conflict conflict = Conflict.builder()
            .conflictType(Conflict.ConflictType.unit_equipment_mismatch)
            .description(description)
            .createdAt(LocalDateTime.now())
            .entityId(entityIds)
            .status(Conflict.ConflictStatus.OPEN)
            .build();

        conflicts.add(conflict);
    }

    public void clearUnitMissmatchConflicts(){
        List<Conflict> mismatches = conflictRepo.findByConflictType(Conflict.ConflictType.unit_equipment_mismatch);
        mismatches.forEach(conflictRepo::delete);
        System.out.println("All Unit Missmatch Conflicts cleared");
    }

    public List<Equipment> getUnitMismatchConflicts(int count){
        List<Conflict> byConflictType = conflictRepo.findByConflictType(Conflict.ConflictType.unit_equipment_mismatch);
        List<Equipment> conflictedEqList = new ArrayList<>();
        int i = 0;
        for (Conflict conflict : byConflictType) {
            String[] split = conflict.getEntityId().split(",");
            for (String s : split) {
                conflictedEqList.add(equipmentService.getEntityById(s));
            }
            if(++i>=count)return conflictedEqList;
        }
        return conflictedEqList;
    }

    public List<Equipment> getUnresolvedUnitMismatchEquipment(int count){
        List<Conflict> unresolved = conflictRepo.findByConflictTypeAndStatus(Conflict.ConflictType.unit_equipment_mismatch,Conflict.ConflictStatus.OPEN);
        List<Equipment> unresolvedEqList = new ArrayList<>();
        int i = 0;
        for (Conflict conflict : unresolved) {
            String[] split = conflict.getEntityId().split(",");
            for (String s : split) {
                unresolvedEqList.add(equipmentService.getEntityById(s));
            }
            if(++i>=count) return unresolvedEqList;
        }
        return unresolvedEqList;
    }

    public List<Equipment> getUnresolvedUnitMismatchEquipmentWithLotoPoints(int count){
        List<Conflict> unresolved = conflictRepo.findByConflictTypeAndStatus(Conflict.ConflictType.unit_equipment_mismatch,Conflict.ConflictStatus.OPEN);
        List<Equipment> unresolvedEqList = new ArrayList<>();
        int i = 0;
        for (Conflict conflict : unresolved) {
            String[] split = conflict.getEntityId().split(",");
            List<Equipment> withLotoPoints = new ArrayList<>();
            for (String s : split) {
                withLotoPoints.add(equipmentService.getEntityById(s));
            }
            if(withLotoPoints.stream().anyMatch(e -> e.getLotoPoints()!= null &&!e.getLotoPoints().isEmpty())){
                unresolvedEqList.addAll(withLotoPoints);
                if(++i>=count) return unresolvedEqList;
            }

        }
        return unresolvedEqList;
    }

    public Conflict getUnitMismatchConflictByEqId(String eqId){
        return conflictRepo.findByConflictTypeAndEntityIdContaining(Conflict.ConflictType.unit_equipment_mismatch,eqId);
    }

    public void resolveUnitMismatchConflict(String eqId){
        Conflict conflict = getUnitMismatchConflictByEqId(eqId);
        try{
            conflict.setStatus(Conflict.ConflictStatus.RESOLVED);
            conflictRepo.save(conflict);
            System.out.println(conflict.getId() + ": Conflict resolved for equipment with ID: " + eqId);
        }catch(Exception e){
            // Handle exception
            System.out.println("Error resolving conflict for equipment with ID: " + eqId);
        }
    }

    /******************************************************
     * LOTO POINTS WITH NO EQUIPMENT ASSOCIATION
     *******************************************************/

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

    public List<LotoPoint> lotoPointsWithNoEquipmentAssociation(int count){
        List<LotoPoint> all = lotoPointService.getAll();
        List<LotoPoint> noEquipmentAssociation = new ArrayList<>();
        for (LotoPoint lp : all) {
            if((lp.getEquipmentList()!=null && !lp.getEquipmentList().isEmpty()) || (lp.getFileIds()!=null && !lp.getFileIds().isEmpty())){
                noEquipmentAssociation.add(lp);
            }
            if(noEquipmentAssociation.size()>=count) return noEquipmentAssociation;
        }
        return noEquipmentAssociation;
    }

    /******************************************************
     * DUPLICATE LOTO POINTS
     *******************************************************/

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
    public List<LotoPoint> checkForLotoPointDuplictates(int count){
        List<LotoPoint> duplicates = new ArrayList<LotoPoint>();
        List<LotoPoint> all = lotoPointService.getAll();
        Set<String> tags = new HashSet<>();
        for (LotoPoint lp : all) {
            if(!tags.add(lp.getTagNumber())){
                List<LotoPoint> byTagNumber = lotoPointService.getEntityByTagNumber(lp.getTagNumber());
                duplicates.addAll(byTagNumber);
            }
            if(duplicates.size()>=count) return duplicates;
        }
        return duplicates;
    }

    /******************************************************
     * UNPROCESSED LOTO POINTS
     *******************************************************/

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


    public void lotoPointsWithNoConflicts(){
        List<LotoPoint> all = lotoPointService.getAll();
        List<LotoPoint> noConflicts = new ArrayList<>();
        for (LotoPoint lp : all) {
            if(lp.getEquipmentList()!=null && !lp.getEquipmentList().isEmpty()){
                noConflicts.add(lp);
            }
        }
        System.out.println(noConflicts.size() + " Loto Points with no conflicts");
    }

    /*****************************************************
     * U1/U2 MISMATCH LOTO POINTS
     ********************************************************/

    public List<Conflict> identifyLotoPointsWithMismatchBetweenUnits() {
        List<LotoPoint> all = lotoPointService.getAll();
        List<Conflict> conflicts = new ArrayList<>();

        // Group equipment by their base tag number (without unit prefix)
        Map<String, List<LotoPoint>> lpMap = all.stream()
                .filter(e -> e.getTagNumber().startsWith("01") || e.getTagNumber().startsWith("02"))
                .collect(Collectors.groupingBy(e -> e.getTagNumber().substring(2)));

        for (Map.Entry<String, List<LotoPoint>> entry : lpMap.entrySet()) {
            String baseTag = entry.getKey();
            List<LotoPoint> equipmentList = entry.getValue();

            LotoPoint u1Equipment = equipmentList.stream()
                    .filter(e -> e.getTagNumber().startsWith("01"))
                    .findFirst().orElse(null);

            LotoPoint u2Equipment = equipmentList.stream()
                    .filter(e -> e.getTagNumber().startsWith("02"))
                    .findFirst().orElse(null);

            if (u1Equipment == null || u2Equipment == null) {
                createMismatchConflict(conflicts, u1Equipment, u2Equipment, "Missing corresponding equipment");
            }else if(u1Equipment.getDescription()==null || u2Equipment.getDescription()==null){
                createMismatchConflict(conflicts, u1Equipment, u2Equipment, "Missing corresponding equipment description");
            } else {
                LotoPoint transformedU1 = transformEquipment(u1Equipment, "01", "02");

                if (!compareEquipment(transformedU1, u2Equipment)) {
                    createMismatchConflict(conflicts, u1Equipment, u2Equipment, "Mismatch after transformation (U1 to U2)");
                }
            }
        }

        // Save all conflicts
        for (Conflict conflict : conflicts) {
            try {
                conflictRepo.save(conflict);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        return conflicts;
    }

    private LotoPoint transformEquipment(LotoPoint source, String fromUnit, String toUnit) {
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

    private boolean compareEquipment(LotoPoint e1, LotoPoint e2) {
        if (e1 == null || e2 == null) return false;

        return Objects.equals(e1.getTagNumber().toLowerCase(), e2.getTagNumber().toLowerCase()) &&
                Objects.equals(e1.getDescription().toLowerCase(), e2.getDescription().toLowerCase());
    }

    private void createMismatchConflict(List<Conflict> conflicts, LotoPoint u1Equipment, LotoPoint u2Equipment, String reason) {
        String description = reason + " between Unit 1 and Unit 2 equipment: ";
        String entityIds = "";

        if (u1Equipment != null) {
            description += "U1: " + u1Equipment.getTagNumber();
            entityIds += u1Equipment.getId();
        }

        if (u2Equipment != null) {
            description += (u1Equipment != null ? ", " : "") + "U2: " + u2Equipment.getTagNumber();
            entityIds += (u1Equipment != null ? "," : "") + u2Equipment.getId();
        }

        Conflict conflict = Conflict.builder()
                .conflictType(Conflict.ConflictType.unit_loto_point_mismatch)
                .description(description)
                .createdAt(LocalDateTime.now())
                .entityId(entityIds)
                .status(Conflict.ConflictStatus.OPEN)
                .build();

        conflicts.add(conflict);
    }

    public void clearLotoPointUnitMissmatchConflicts(){
        List<Conflict> mismatches = conflictRepo.findByConflictType(Conflict.ConflictType.unit_loto_point_mismatch);
        mismatches.forEach(conflictRepo::delete);
        System.out.println("All Unit Missmatch Conflicts cleared");
    }

    public List<LotoPoint> getLotoPointUnitMismatchConflicts(int count){
        List<Conflict> byConflictType = conflictRepo.findByConflictType(Conflict.ConflictType.unit_loto_point_mismatch);
        List<LotoPoint> conflictedEqList = new ArrayList<>();
        int i = 0;
        for (Conflict conflict : byConflictType) {
            String[] split = conflict.getEntityId().split(",");
            for (String s : split) {
                conflictedEqList.add(lotoPointService.getEntityById(s));
            }
            if(++i>=count)return conflictedEqList;
        }
        return conflictedEqList;
    }

    public List<LotoPoint> getUnresolvedLotoPointUnitMismatchEquipment(int count){
        List<Conflict> unresolved = conflictRepo.findByConflictTypeAndStatus(Conflict.ConflictType.unit_loto_point_mismatch,Conflict.ConflictStatus.OPEN);
        List<LotoPoint> unresolvedEqList = new ArrayList<>();
        int i = 0;
        for (Conflict conflict : unresolved) {
            String[] split = conflict.getEntityId().split(",");
            for (String s : split) {
                unresolvedEqList.add(lotoPointService.getEntityById(s));
            }
            if(++i>=count) return unresolvedEqList;
        }
        return unresolvedEqList;
    }

    public List<LotoPoint> getUnresolvedLotoPointUnitMismatchWithEquipment(int count){
        List<Conflict> unresolved = conflictRepo.findByConflictTypeAndStatus(Conflict.ConflictType.unit_loto_point_mismatch,Conflict.ConflictStatus.OPEN);
        List<LotoPoint> unresolvedEqList = new ArrayList<>();
        int i = 0;
        for (Conflict conflict : unresolved) {
            String[] split = conflict.getEntityId().split(",");
            List<LotoPoint> withEquipment = new ArrayList<>();
            for (String s : split) {
                withEquipment.add(lotoPointService.getEntityById(s));
            }
            if(withEquipment.stream().anyMatch(e -> e.getEquipmentList()!= null &&!e.getEquipmentList().isEmpty())){
                unresolvedEqList.addAll(withEquipment);
                if(++i>=count) return unresolvedEqList;
            }

        }
        return unresolvedEqList;
    }

    public Conflict getLotoPointUnitMismatchConflictByLpId(String lpId){
        return conflictRepo.findByConflictTypeAndEntityIdContaining(Conflict.ConflictType.unit_loto_point_mismatch,lpId);
    }

    public void resolveLotoPointUnitMismatchConflict(String lpId){
        Conflict conflict = getLotoPointUnitMismatchConflictByLpId(lpId);
        try{
            conflict.setStatus(Conflict.ConflictStatus.RESOLVED);
            conflictRepo.save(conflict);
            System.out.println(conflict.getId() + ": Conflict resolved for equipment with ID: " + lpId);
        }catch(Exception e){
            // Handle exception
            System.out.println("Error resolving conflict for equipment with ID: " + lpId);
        }
    }

    public LotoPoint createMatchingLotoPointForOtherUnit(Long lotoPointId) {
        LotoPoint sourceLotoPoint = lotoPointService.getEntityById(lotoPointId.toString());
        if (sourceLotoPoint == null) {
            throw new IllegalArgumentException("LOTO point not found with ID: " + lotoPointId);
        }

        String sourceUnit = sourceLotoPoint.getTagNumber().substring(0, 2);
        String targetUnit = sourceUnit.equals("01") ? "02" : "01";

        LotoPoint newLotoPoint = new LotoPoint();
        newLotoPoint.setTagNumber(targetUnit + sourceLotoPoint.getTagNumber().substring(2));
        newLotoPoint.setDescription(transformText(sourceLotoPoint.getDescription(), sourceUnit, targetUnit));
        newLotoPoint.setSpecificLocation(transformText(sourceLotoPoint.getSpecificLocation(), sourceUnit, targetUnit));
        newLotoPoint.setUnit(targetUnit);

        // Copy other fields that don't need transformation
        newLotoPoint.setIsoPos(sourceLotoPoint.getIsoPos());
        newLotoPoint.setNormPos(sourceLotoPoint.getNormPos());

        // Save the new LOTO point
        LotoPoint savedLotoPoint = lotoPointService.save(newLotoPoint);

        // Resolve the conflict if it exists
        Conflict conflict = getLotoPointUnitMismatchConflictByLpId(lotoPointId.toString());
        if (conflict != null) {
            conflict.setStatus(Conflict.ConflictStatus.RESOLVED);
            conflict.setEntityId(conflict.getEntityId() + "," + savedLotoPoint.getId());
            conflictRepo.save(conflict);
        }

        System.out.println("Created matching LOTO point for other unit: " + savedLotoPoint.getTagNumber());
        return savedLotoPoint;
    }

}
