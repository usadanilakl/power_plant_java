package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.files.FileIdDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.mappers.equipment.EquipmentMapper;
import com.dk_power.power_plant_java.mappers.equipment.HighlightMapper;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.equipment.HeatTraceService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class FileMapper implements BaseMapper {
    private final UniversalMapper mapper;
    private final EquipmentMapper equipmentMapper;
    private final EquipmentService equipmentService;
    private final ModelMapper modelMapper;
    private final ValueService valueService;
    private final FileService fileService;
    private final HeatTraceService heatTraceService;
    private final HighlightMapper highlightMapper;

    public FileMapper(UniversalMapper mapper, @Lazy EquipmentMapper equipmentMapper, @Lazy EquipmentService equipmentService, ModelMapper modelMapper, ValueService valueService, @Lazy FileService fileService, @Lazy HeatTraceService heatTraceService, @Lazy HighlightMapper highlightMapper) {
        this.mapper = mapper;
        this.equipmentMapper = equipmentMapper;
        this.equipmentService = equipmentService;
        this.modelMapper = modelMapper;
        this.valueService = valueService;
        this.fileService = fileService;
        this.heatTraceService = heatTraceService;
        this.highlightMapper = highlightMapper;
    }


    public FileDto convertToDto(FileObject file) {
        FileDto fileDto = new FileDto();
        fileDto.setFileLink(file.getFileLink());
        fileDto.setFileNumber(convertFileNumberStringToArray(file.getFileNumber()));
        fileDto.setFolder(file.getFolder());
        fileDto.setBaseLink(file.getBaseLink());
        fileDto.setExtension(file.getExtension());
        if (file.getName() != null) fileDto.setName(file.getName());
        if (file.getObjectType() != null) fileDto.setObjectType(file.getObjectType());
        fileDto.setId(file.getId());
        if (file.getFileType() != null) fileDto.setFileType(valueService.getDtoById(file.getFileType().getId()));
        if (file.getSystem() != null) fileDto.setSystem(valueService.getDtoById(file.getSystem().getId()));
        if (file.getVendor() != null) fileDto.setVendor(valueService.getDtoById(file.getVendor().getId()));
        if (file.getRelatedSystems() != null) fileDto.setRelatedSystems(file.getRelatedSystems());
        if (file.getPoints() != null)
            fileDto.setPoints(file.getPoints().stream().map(e -> equipmentService.getDtoById(e.getId())).toList());
//        if(file.getHeatTrace()!=null) fileDto.setHeatTraceList(file.getHeatTrace().stream().map(heatTraceService::convertToDto).toList());
        if (file.getBulkEditStep() != null) fileDto.setBulkEditStep(file.getBulkEditStep());
        if (file.getHighlights() != null)
            fileDto.setHighlights(file.getHighlights().stream().map(highlightMapper::convertToDtoLight).toList());
        if (file.getDocNum() != null) fileDto.setDocNum(file.getDocNum());
        if (file.getIsVerified() != null) fileDto.setIsVerified(file.getIsVerified());
        if(file.getExtensions()!=null && !file.getExtensions().isEmpty()) fileDto.setExtensions(file.getExtensionsArray());
        return fileDto;
    }

    public FileDto convertToDtoLight(FileObject file) {
        FileDto fileDto = new FileDto();
        fileDto.setFileLink(file.buildFileLink());
        fileDto.setFileNumber(convertFileNumberStringToArray(file.getFileNumber()));
        fileDto.setFolder(file.getFolder());
        fileDto.setBaseLink(file.getBaseLink());
        fileDto.setExtension(file.getExtension());
        if (file.getName() != null) fileDto.setName(file.getName());
        if (file.getObjectType() != null) fileDto.setObjectType(file.getObjectType());
        fileDto.setId(file.getId());
        if (file.getFileType() != null) fileDto.setFileType(valueService.getDtoById(file.getFileType().getId()));
        if (file.getSystem() != null) fileDto.setSystem(valueService.getDtoById(file.getSystem().getId()));
        if (file.getVendor() != null) fileDto.setVendor(valueService.getDtoById(file.getVendor().getId()));
        if (file.getRelatedSystems() != null) fileDto.setRelatedSystems(file.getRelatedSystems());
        if (file.getBulkEditStep() != null) fileDto.setBulkEditStep(file.getBulkEditStep());
//        if(file.getPoints()!=null) fileDto.setPoints(file.getPoints().stream().map(e->equipmentService.getDtoById(e.getId())).toList());
//        if(file.getHeatTrace()!=null) fileDto.setHeatTraceList(file.getHeatTrace().stream().map(heatTraceService::convertToDto).toList());
        if (file.getHighlights() != null)
            fileDto.setHighlights(file.getHighlights().stream().map(highlightMapper::convertToDtoLight).toList());
        if (file.getDocNum() != null) fileDto.setDocNum(file.getDocNum());
        if (file.getIsVerified() != null) fileDto.setIsVerified(file.getIsVerified());
        return fileDto;
    }

    public FileDto convertToDto(FileObject file, String extension) {
        FileDto fileDto = convertToDto(file);
        fileDto.setFileLink(file.buildFileLink(extension));
        return fileDto;
    }

    public FileObject convertToEntity(FileDto fileDto) {
        FileObject file = fileService.getEntityById(fileDto.getId());

        //if(!=null)
        if (fileDto.getFileNumber() != null && !fileDto.getFileNumber().isEmpty()) file.setFileNumber(convertFileNumberArrayToString(fileDto.getFileNumber()));
        if (fileDto.getFileLink() != null) file.setFileLink(fileDto.getFileLink());
        if (fileDto.getFolder() != null) file.setFolder(fileDto.getFolder());
        if (fileDto.getBaseLink() != null) file.setBaseLink(fileDto.getBaseLink());
        if (fileDto.getVendor() != null) file.setVendor(valueService.getEntityById(fileDto.getVendor().getId()));
        if (fileDto.getFileType() != null) file.setFileType(valueService.getEntityById(fileDto.getFileType().getId()));
        if (fileDto.getSystem() != null) file.setSystem(valueService.getEntityById(fileDto.getSystem().getId()));
        if (fileDto.getPoints() != null)
            file.setPoints(fileDto.getPoints().stream().map(e -> equipmentService.getEntityById(e.getId())).toList());
        if (fileDto.getExtension() != null) file.setExtension(fileDto.getExtension());
        if (fileDto.getRelatedSystems() != null && file.getRelatedSystems() != null && !fileDto.getRelatedSystems().equals(file.getRelatedSystems()))
            file.setRelatedSystems(fileDto.getRelatedSystems());
        if (fileDto.getName() != null) file.setName(fileDto.getName());
        if (fileDto.getBulkEditStep() != null) file.setBulkEditStep(fileDto.getBulkEditStep());
//        if(fileDto.getHeatTraceList()!=null) file.setHeatTrace(fileDto.getHeatTraceList().stream().map(heatTraceService::convertToEntity).toList());
        if (fileDto.getHighlights() != null)
            file.setHighlights(fileDto.getHighlights().stream().map(highlightMapper::convertToEntity).toList());
        if (fileDto.getDocNum() != null) file.setDocNum(fileDto.getDocNum());
        if (fileDto.getIsVerified() != null) file.setIsVerified(fileDto.getIsVerified());
        if (fileDto.getExtensions() != null && !fileDto.getExtensions().isEmpty()) file.setExtensions(String.join(",", fileDto.getExtensions()));
        return file;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }


    public FileObject convertIdDtoToEntity(FileIdDto dto) {
        if (dto == null) return null;

        FileObject fileObject;
        if (dto.getId() == null || dto.getId() == 0) {
            fileObject = new FileObject();
        } else {
            fileObject = fileService.findById(dto.getId()).orElse(new FileObject());
        }

        // Set fields from BaseDto
        if (dto.getId() != null && dto.getId() != 0) fileObject.setId(dto.getId());
        if (dto.getDeleted() != null) fileObject.setDeleted(dto.getDeleted());
        if (dto.getName() != null) fileObject.setName(dto.getName());
        if (dto.getNote() != null) fileObject.setNote(dto.getNote());
        if (dto.getCreatedBy() != null) fileObject.setCreatedBy(dto.getCreatedBy());
        if (dto.getObjectType() != null) fileObject.setObjectType(dto.getObjectType());
        if (dto.getDataServiceItemId() != null) fileObject.setDataServiceItemId(dto.getDataServiceItemId());
        if (dto.getRefactorNotes() != null) fileObject.setRefactorNotes(dto.getRefactorNotes());
        if (dto.getDateCreated() != null) fileObject.setDateCreated(dto.getDateCreated());
        if (dto.getDateModified() != null) fileObject.setDateModified(dto.getDateModified());

        // Set fields specific to FileIdDto
        if (dto.getFileType() != null) fileObject.setFileType(valueService.findById(dto.getFileType()).orElse(null));
        if (dto.getFileLink() != null) fileObject.setFileLink(dto.getFileLink());
        if (dto.getBaseLink() != null) fileObject.setBaseLink(dto.getBaseLink());
        if (dto.getFolder() != null) fileObject.setFolder(dto.getFolder());
        if (dto.getSystem() != null) fileObject.setSystem(valueService.findById(dto.getSystem()).orElse(null));
        if (dto.getRelatedSystems() != null) fileObject.setRelatedSystems(dto.getRelatedSystems());
        if (dto.getFileNumber() != null && !dto.getFileNumber().isEmpty()) fileObject.setFileNumber(convertFileNumberArrayToString(dto.getFileNumber()));
        if (dto.getVendor() != null) fileObject.setVendor(valueService.findById(dto.getVendor()).orElse(null));
        if (dto.getObjectType() != null) fileObject.setObjectType(dto.getObjectType());
        if (dto.getExtension() != null) fileObject.setExtension(dto.getExtension());
        if (dto.getBulkEditStep() != null) fileObject.setBulkEditStep(dto.getBulkEditStep());
        if (dto.getDocNum() != null) fileObject.setDocNum(dto.getDocNum());
        if (dto.getIsVerified() != null) fileObject.setIsVerified(dto.getIsVerified());
        if (dto.getExtensions() != null && !dto.getExtensions().isEmpty()) fileObject.setExtensions(String.join(",", dto.getExtensions()));
        // Handle points
        if (dto.getPoints() != null && !dto.getPoints().isEmpty()) {
            List<Equipment> points = dto.getPoints().stream()
                    .map(id -> equipmentService.findById(id).orElse(null))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            fileObject.setPoints(points);
        }

        return fileObject;
    }

    public String convertFileNumberArrayToString(List<String> fileNumberArray) {
        if (fileNumberArray != null && !fileNumberArray.isEmpty()) {
            String joinedFileNumber = fileNumberArray.stream()
                    .map(part -> part.replaceAll("[^a-zA-Z0-9._-]", "_").replaceAll("\\s+", "-"))
                    .collect(Collectors.joining("__SEP__"));

            // Optionally limit the length
            if (joinedFileNumber.length() > 255) {  // adjust max length as needed
                joinedFileNumber = joinedFileNumber.substring(0, 255);
            }
            return joinedFileNumber;
        }
        return null;
    }

    public List<String> convertFileNumberStringToArray(String fileNumberString) {
        return fileNumberString != null ? new ArrayList<>(Arrays.asList(fileNumberString.split("__SEP__"))) : new ArrayList<>();
    }

}
