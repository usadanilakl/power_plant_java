package com.dk_power.power_plant_java.mappers.transfer_to_data_service_project;

import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_CategoryDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_ValueDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.equipment.DS_LotoPointDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.equipment.DS_TagNumberDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DS_LotoPointMapper {
    public DS_LotoPointDto map(Equipment e){
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
        tagNumbers.add(DS_TagNumberDto.builder()
                .isPrimary(true)
                .tagNumberType(DS_ValueDto.builder().category(DS_CategoryDto.builder().name("Tag Number Type").alias("tagNumberType").build()).name("Equipment Tag Number").build())
                .number(e.getTagNumber()).system(system).build());

        LotoPoint lotoPoint = e.getLotoPoints().stream().filter(lp -> lp.getTagNumber().equals(e.getTagNumber())).findFirst().orElse(null);

        String unit = (e.getTagNumber().startsWith("01") ? "Unit 1" : e.getTagNumber().startsWith("02") ? "Unit 2" : "BOP");
        DS_ValueDto isolatedPosition = lotoPoint.getIsoPos()!=null? DS_ValueDto.builder().category(DS_CategoryDto.builder().name("Isolated Position").alias("isoPos").build()).name(lotoPoint.getIsoPos().getName()).build() : null;
        DS_ValueDto normalPosition = lotoPoint.getNormPos()!=null? DS_ValueDto.builder().category(DS_CategoryDto.builder().name("Normal Position").alias("normPos").build()).name(lotoPoint.getNormPos().getName()).build() : null;

        String specificLocation = e.getSpecificLocation()!= null? e.getSpecificLocation() : lotoPoint.getSpecificLocation()!=null? lotoPoint.getSpecificLocation() : null;

        Set<DS_ValueDto> equipmentTags = new HashSet<>();
        DS_ValueDto taggingStatus = DS_ValueDto.builder()
                .category(DS_CategoryDto.builder().name("Tagging Status").alias("taggingStatus").build())
                .name("Needs Tagging")
                .build();
        equipmentTags.add(taggingStatus);

        DS_LotoPointDto lotoPointDto = DS_LotoPointDto.builder()
                .tagNumbers(tagNumbers)
                .unit(unit)
                .description(e.getDescription())
                .location(location)
                .vendor(vendor)
                .system(system)
                .specificLocation(specificLocation)
                .isolatedPosition(isolatedPosition)
                .normalPosition(normalPosition)
                .equipmentType(eqType)
                .oldPidProjectItemId(lotoPoint.getId())
                .equipmentTags(equipmentTags)
                .build();
        return lotoPointDto;
    }
}
