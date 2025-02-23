package com.dk_power.power_plant_java.mappers.transfer_to_data_service_project;

import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_CategoryDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_ValueDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.equipment.DS_TagNumberDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.files.DS_FileObjectDtoDS;
import com.dk_power.power_plant_java.entities.files.FileObject;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;

@Service
public class DS_FileObjectMapper {
    public DS_FileObjectDtoDS convertToDS_FileObjectDto(FileObject fileObject) {
        Set<DS_TagNumberDto> tagNumbers = new HashSet<>();
        DS_TagNumberDto tagNumber = DS_TagNumberDto.builder()
                .number(fileObject.getFileNumber())
                .isPrimary(true)
                .tagNumberType(DS_ValueDto.builder().category(DS_CategoryDto.builder().name("Tag Number Type").alias("tagNumberType").build()).name("File Number").build())
                .build();
        tagNumbers.add(tagNumber);
        DS_TagNumberDto tagNumber2 = DS_TagNumberDto.builder()
                .number(fileObject.getDocNum())
                .tagNumberType(DS_ValueDto.builder().category(DS_CategoryDto.builder().name("Tag Number Type").alias("tagNumberType").build()).name("File Number").build())
                .isPrimary(false)
                .build();
        if(!tagNumber2.getNumber().trim().equals(tagNumber.getNumber().trim()))tagNumbers.add(tagNumber2);

        Set<DS_ValueDto> systemsSet = new HashSet<>();
        if(fileObject.getRelatedSystems()!=null &&!fileObject.getRelatedSystems().trim().equals("")){
            String[] systems = fileObject.getRelatedSystems().split(",");
            for (String s : systems) {
                systemsSet.add(DS_ValueDto.builder().category(DS_CategoryDto.builder().name("System").build()).name(s).build());
            }
        }
        return DS_FileObjectDtoDS.builder()
                .name(fileObject.getName())
                .tagNumbers(tagNumbers)
                .extension(fileObject.getExtension())
                .vendor(DS_ValueDto.builder()
                        .category(DS_CategoryDto.builder().name("Vendor").build())
                        .name(fileObject.getVendor().getName())
                        .build())
                .oldPidProjectItemId(fileObject.getId())
                .systems(systemsSet)
                .build();
    }
}
