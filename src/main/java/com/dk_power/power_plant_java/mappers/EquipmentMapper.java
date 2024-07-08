package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.FileObject;
import lombok.AllArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@AllArgsConstructor
public class EquipmentMapper implements BaseMapper{
    private final UniversalMapper mapper;
    private final FileMapper fileMapper;
    private final ModelMapper modelMapper;


    public EquipmentDto convertToDto(Equipment point) {
        EquipmentDto pointDto = new EquipmentDto();
        pointDto.setCoordinates(point.getCoordinates());
        pointDto.setId(point.getId());
        pointDto.setLabel(point.getLabel());
        List<String> files = point.getFiles().stream().map(FileObject::getFileLink).toList();
        pointDto.setFiles(files);
        pointDto.setMainFile(point.getMainFile().getFileLink());
        pointDto.setDescription(point.getDescription());
//        if(point.getLocation()!=null)pointDto.setLocation(mapper.convert(point.getLocation(),new LocationDto()));
//        if(point.getVendor()!=null)pointDto.setVendor(mapper.convert(point.getVendor(),new VendorDto()));
//        if(point.getSystem()!=null)pointDto.setSystem(mapper.convert(point.getSystem(),new SystemDto()));
//        if(point.getEqType()!=null)pointDto.setEqType(mapper.convert(point.getEqType(),new EquipmentTypeDto()));
        pointDto.setName(point.getName());
        pointDto.setOriginalPictureSize(point.getOriginalPictureSize());
        return pointDto;
    }

    public Equipment convertToEntity(EquipmentDto pointDto) {
        Equipment point = new Equipment();
        point.setCoordinates(pointDto.getCoordinates());
        point.setId(pointDto.getId());
        point.setLabel(pointDto.getLabel());
//        List<FileObject> files = pointDto.getFiles().stream().map(fileMapper::convertToEntity).toList();
//        point.setFiles(files);
//        point.setDescription(point.getDescription());
//        point.setLocation(mapper.convert(pointDto.getCoordinates(),new Location()));
//        point.setVendor(mapper.convert(pointDto.getVendor(),new Vendor()));
//        point.setSystem(mapper.convert(pointDto.getSystem(),new Syst()));
//        point.setEqType(mapper.convert(pointDto.getEqType(),new EquipmentType()));
//        point.setMainFile(fileMapper.convertToEntity(pointDto.getMainFile()));
        point.setName(pointDto.getName());
        point.setOriginalPictureSize(pointDto.getOriginalPictureSize());
        return point;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
