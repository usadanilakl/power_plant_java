package com.dk_power.power_plant_java.mappers.transfer_to_data_service_project;

import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_CategoryDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_ValueDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.files.DS_FileObjectDtoDS;
import com.dk_power.power_plant_java.entities.files.FileObject;
import org.springframework.stereotype.Service;

@Service
public class DS_FileObjectMapper {
    public DS_FileObjectDtoDS convertToDS_FileObjectDto(FileObject fileObject) {
        return DS_FileObjectDtoDS.builder()
                .name(fileObject.getName())
                .fileNumber(fileObject.getFileNumber())
                .extension(fileObject.getExtension())
                .vendor(DS_ValueDto.builder()
                        .category(DS_CategoryDto.builder().name("Vendor").build())
                        .name(fileObject.getVendor().getName())
                        .build())
                .oldPidProjectItemId(fileObject.getId())
                .build();
    }
}
