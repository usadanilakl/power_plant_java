package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.plant.SystemDto;
import com.dk_power.power_plant_java.dto.plant.VendorDto;
import com.dk_power.power_plant_java.dto.plant.files.FileDto;
import com.dk_power.power_plant_java.dto.plant.files.FileTypeDto;
import com.dk_power.power_plant_java.entities2.FileObject;
import org.springframework.stereotype.Component;

@Component
public class FileMapper {
    private final UniversalMapper mapper;
    private final PointMapper pointMapper;

    public FileMapper(UniversalMapper mapper, PointMapper pointMapper) {
        this.mapper = mapper;
        this.pointMapper = pointMapper;
    }

    public FileDto convertToDto(FileObject file){
        FileDto fileDto = new FileDto();
        fileDto.setFileLink(file.buildFileLink());
        fileDto.setFileNumber(file.getFileNumber());
        if(file.getPoints()!=null)fileDto.setFilePoints(file.getPoints().stream().map(pointMapper::convertToDto).toList());
        if(file.getPoints()!=null)fileDto.setPoints(file.getPoints().stream().map(pointMapper::convertToDto).toList());
        fileDto.setId(file.getId());
        if(file.getFileType()!=null)fileDto.setFileType(mapper.convert(file.getFileType(),new FileTypeDto()));
        if(file.getSystem()!=null)fileDto.setSystem(mapper.convert(file.getSystem(),new SystemDto()));
        if(file.getVendor()!=null)fileDto.setVendor(mapper.convert(file.getVendor(),new VendorDto()));
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
}
