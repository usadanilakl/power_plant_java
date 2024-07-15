package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.modelmapper.PropertyMap;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class EquipmentMapper implements BaseMapper{
    private final UniversalMapper mapper;
    private final FileMapper fileMapper;
    private final ModelMapper modelMapper;
    private final ValueService valueService;
    private final FileService fileService;


    public EquipmentDto convertToDto(Equipment source) {
        EquipmentDto pointDto = new EquipmentDto();

        if (source.getVendor() != null) {
            pointDto.setVendor(valueService.getDtoById(source.getVendor().getId()));
        }
        if (source.getMainFile() != null) {
            pointDto.setMainFile(source.getMainFile().getFileLink());
        }
        if (source.getLocation() != null) {
            pointDto.setLocation(valueService.getDtoById(source.getLocation().getId()));
        }
        if (source.getEqType() != null) {
            pointDto.setEqType(valueService.getDtoById(source.getEqType().getId()));
        }
        if (source.getSystem() != null) {
            pointDto.setSystem(valueService.getDtoById(source.getSystem().getId()));
        }
        if (source.getFiles() != null) {
            pointDto.setFiles(source.getFiles().stream()
                    .filter(Objects::nonNull)
                    .map(FileObject::getFileLink)
                    .collect(Collectors.toList()));
        }
        pointDto.setId(source.getId());




//
//        pointDto.setCoordinates(point.getCoordinates());
//        pointDto.setId(point.getId());
//        pointDto.setTagNumber(point.getTagNumber());
////        List<String> files = point.getFiles().stream().map(FileObject::getFileLink).toList();
////        pointDto.setFiles(files);
//        pointDto.setMainFile(point.getMainFile().getFileLink());
//        pointDto.setDescription(point.getDescription());
////        if(point.getLocation()!=null)pointDto.setLocation(mapper.convert(point.getLocation(),new LocationDto()));
////        if(point.getVendor()!=null)pointDto.setVendor(mapper.convert(point.getVendor(),new VendorDto()));
////        if(point.getSystem()!=null)pointDto.setSystem(mapper.convert(point.getSystem(),new SystemDto()));
////        if(point.getEqType()!=null)pointDto.setEqType(mapper.convert(point.getEqType(),new EquipmentTypeDto()));
//        pointDto.setName(point.getName());
//        pointDto.setOriginalPictureSize(point.getOriginalPictureSize());
        return pointDto;
    }

    public Equipment convertToEntity(EquipmentDto pointDto) {
        Equipment point = new Equipment();
        point.setCoordinates(pointDto.getCoordinates());
        point.setId(pointDto.getId());
        point.setTagNumber(pointDto.getTagNumber());
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


//    @Override
//    public ModelMapper getMapper() {
//        PropertyMap<Equipment, EquipmentDto> toDto = new PropertyMap<Equipment, EquipmentDto>() {
//            @Override
//            protected void configure() {
//                map().setVendor(valueService.getDtoById(source.getVendor().getId()));
//                map().setMainFile(source.getMainFile().getFileLink());
//                map().setLocation(valueService.getDtoById(source.getLocation().getId()));
//                map().setEqType(valueService.getDtoById(source.getEqType().getId()));
//                map().setSystem(valueService.getDtoById(source.getSystem().getId()));
//                map().setFiles(source.getFiles().stream().map(FileObject::getFileLink).collect(Collectors.toList()));
//            }
//        };
//        PropertyMap<EquipmentDto, Equipment> toEntity = new PropertyMap<EquipmentDto, Equipment>() {
//            @Override
//            protected void configure() {
//                FileObject mainFileLink = fileService.getByFileLink(source.getMainFile());
//                List<FileObject> files = new ArrayList<>();
//                source.getFiles().forEach(e->{files.add(fileService.getByFileLink(e));});
//                map().setVendor(valueService.getEntityById(source.getVendor().getId()));
//                map().setMainFile(mainFileLink);
//                map().setLocation(valueService.getEntityById(source.getLocation().getId()));
//                map().setEqType(valueService.getEntityById(source.getEqType().getId()));
//                map().setSystem(valueService.getEntityById(source.getSystem().getId()));
//                map().setFiles(files);
//            }
//        };
//        modelMapper.addMappings(toDto);
//        modelMapper.addMappings(toEntity);
//        return modelMapper;
//    }
@Override
public ModelMapper getMapper() {
//    PropertyMap<Equipment, EquipmentDto> toDto = new PropertyMap<Equipment, EquipmentDto>() {
//        @Override
//        protected void configure() {
//            if (source.getVendor() != null) {
//                map().setVendor(valueService.getDtoById(source.getVendor().getId()));
//            }
//            if (source.getMainFile() != null) {
//                map().setMainFile(source.getMainFile().getFileLink());
//            }
//            if (source.getLocation() != null) {
//                map().setLocation(valueService.getDtoById(source.getLocation().getId()));
//            }
//            if (source.getEqType() != null) {
//                map().setEqType(valueService.getDtoById(source.getEqType().getId()));
//            }
//            if (source.getSystem() != null) {
//                map().setSystem(valueService.getDtoById(source.getSystem().getId()));
//            }
//            if (source.getFiles() != null) {
//                map().setFiles(source.getFiles().stream()
//                        .filter(Objects::nonNull)
//                        .map(FileObject::getFileLink)
//                        .collect(Collectors.toList()));
//            }
//        }
//    };
//
//    PropertyMap<EquipmentDto, Equipment> toEntity = new PropertyMap<EquipmentDto, Equipment>() {
//        @Override
//        protected void configure() {
//            if (source.getMainFile() != null) {
//                FileObject mainFileLink = fileService.getByFileLink(source.getMainFile());
//                map().setMainFile(mainFileLink);
//            }
//            if (source.getFiles() != null) {
//                List<FileObject> files = source.getFiles().stream()
//                        .filter(Objects::nonNull)
//                        .map(fileService::getByFileLink)
//                        .collect(Collectors.toList());
//                map().setFiles(files);
//            }
//            if (source.getVendor() != null) {
//                map().setVendor(valueService.getEntityById(source.getVendor().getId()));
//            }
//            if (source.getLocation() != null) {
//                map().setLocation(valueService.getEntityById(source.getLocation().getId()));
//            }
//            if (source.getEqType() != null) {
//                map().setEqType(valueService.getEntityById(source.getEqType().getId()));
//            }
//            if (source.getSystem() != null) {
//                map().setSystem(valueService.getEntityById(source.getSystem().getId()));
//            }
//        }
//    };
//
//    modelMapper.addMappings(toDto);
//    modelMapper.addMappings(toEntity);
    return modelMapper;
}
}
