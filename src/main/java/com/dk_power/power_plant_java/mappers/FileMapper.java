package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Component
public class FileMapper implements BaseMapper{
    private final UniversalMapper mapper;
    private final EquipmentMapper equipmentMapper;
    private final ModelMapper modelMapper;
    private final ValueService valueService;

    public FileMapper(UniversalMapper mapper, @Lazy EquipmentMapper equipmentMapper, ModelMapper modelMapper, ValueService valueService) {
        this.mapper = mapper;
        this.equipmentMapper = equipmentMapper;
        this.modelMapper = modelMapper;
        this.valueService = valueService;
    }


    public FileDto convertToDto(FileObject file){
        FileDto fileDto = new FileDto();
        fileDto.setFileLink(file.buildFileLink());
        fileDto.setFileNumber(file.getFileNumber());
        if(file.getPoints()!=null)fileDto.setPoints(file.getPoints().stream().map(equipmentMapper::convertToDto).toList());
        if(file.getPoints()!=null)fileDto.setPoints(file.getPoints().stream().map(equipmentMapper::convertToDto).toList());
        fileDto.setId(file.getId());
//        if(file.getFileType()!=null)fileDto.setFileType(mapper.convert(file.getFileType(),new FileTypeDto()));
//        if(file.getSystem()!=null)fileDto.setSystem(mapper.convert(file.getSystem(),new SystemDto()));
//        if(file.getVendor()!=null)fileDto.setVendor(mapper.convert(file.getVendor(),new VendorDto()));
        if(file.getVendor()!=null)fileDto.setVendor(file.getVendor().getName());


        fileDto.setFileNumber(file.getFileNumber());
        fileDto.setBaseLink(file.getBaseLink());
        fileDto.setFolder(file.getFolder());
        return fileDto;
    }
    public FileDto convertToDto(FileObject file, String extension){
        FileDto fileDto = convertToDto(file);
        fileDto.setFileLink(file.buildFileLink(extension));
        return fileDto;
    }
    public FileObject convertToEntity(FileDto fileDto){
        FileObject file = new FileObject();

        return file;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
