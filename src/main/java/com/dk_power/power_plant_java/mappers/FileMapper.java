package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.equipment.HeatTraceService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Component
public class FileMapper implements BaseMapper{
    private final UniversalMapper mapper;
    private final EquipmentMapper equipmentMapper;
    private final EquipmentService equipmentService;
    private final ModelMapper modelMapper;
    private final ValueService valueService;
    private final FileService fileService;
    private final HeatTraceService heatTraceService;

    public FileMapper(UniversalMapper mapper, @Lazy EquipmentMapper equipmentMapper, @Lazy  EquipmentService equipmentService, ModelMapper modelMapper, ValueService valueService, @Lazy FileService fileService, @Lazy HeatTraceService heatTraceService) {
        this.mapper = mapper;
        this.equipmentMapper = equipmentMapper;
        this.equipmentService = equipmentService;
        this.modelMapper = modelMapper;
        this.valueService = valueService;
        this.fileService = fileService;
        this.heatTraceService = heatTraceService;
    }


    public FileDto convertToDto(FileObject file){
        FileDto fileDto = new FileDto();
        fileDto.setFileLink(file.buildFileLink());
        fileDto.setFileNumber(file.getFileNumber());
        fileDto.setFolder(file.getFolder());
        fileDto.setBaseLink(file.getBaseLink());
        fileDto.setExtension(file.getExtension());
        if(file.getName()!=null) fileDto.setName(file.getName());
        if(file.getObjectType()!=null) fileDto.setObjectType(file.getObjectType());
        fileDto.setId(file.getId());
        if(file.getFileType()!=null)fileDto.setFileType(valueService.getDtoById(file.getFileType().getId()));
        if(file.getSystem()!=null)fileDto.setSystem(valueService.getDtoById(file.getSystem().getId()));
        if(file.getVendor()!=null)fileDto.setVendor(valueService.getDtoById(file.getVendor().getId()));
        if(file.getRelatedSystems()!=null) fileDto.setRelatedSystems(file.getRelatedSystems());
        if(file.getPoints()!=null) fileDto.setPoints(file.getPoints().stream().map(e->equipmentService.getDtoById(e.getId())).toList());
        if(file.getHeatTrace()!=null) fileDto.setHeatTraceList(file.getHeatTrace().stream().map(heatTraceService::convertToDto).toList());

        return fileDto;
    }
    public FileDto convertToDto(FileObject file, String extension){
        FileDto fileDto = convertToDto(file);
        fileDto.setFileLink(file.buildFileLink(extension));
        return fileDto;
    }
    public FileObject convertToEntity(FileDto fileDto){
        FileObject file = fileService.getEntityById(fileDto.getId());

        //if(!=null)
        if(fileDto.getFileNumber()!=null)file.setFileNumber(fileDto.getFileNumber());
        if(fileDto.getFileLink()!=null)file.setFileLink(fileDto.getFileLink());
        if(fileDto.getFolder()!=null)file.setFolder(fileDto.getFolder());
        if(fileDto.getBaseLink()!=null)file.setBaseLink(fileDto.getBaseLink());
        if(fileDto.getVendor()!=null)file.setVendor(valueService.getEntityById(fileDto.getVendor().getId()));
        if(fileDto.getFileType()!=null)file.setFileType(valueService.getEntityById(fileDto.getFileType().getId()));
        if(fileDto.getSystem()!=null)file.setSystem(valueService.getEntityById(fileDto.getSystem().getId()));
        if(fileDto.getPoints()!=null) file.setPoints(fileDto.getPoints().stream().map(e->equipmentService.getEntityById(e.getId())).toList());
        if(fileDto.getExtension()!=null) file.setExtension(fileDto.getExtension());
        if(fileDto.getRelatedSystems()!=null) file.setRelatedSystems(fileDto.getRelatedSystems());
        if(fileDto.getName()!=null) file.setName(fileDto.getName());
        if(fileDto.getHeatTraceList()!=null) file.setHeatTrace(fileDto.getHeatTraceList().stream().map(heatTraceService::convertToEntity).toList());

        return file;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
