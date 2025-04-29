package com.dk_power.power_plant_java.dto.browser;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.equipment.HeatTraceDto;
import com.dk_power.power_plant_java.dto.equipment.HighlightDto;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Getter
@Setter
public class BrFileDto {
    private Long id;
    private String name;
    private String fileType;
    private String fileLink;
    private String system;
    private String relatedSystems;
    private String fileNumber;
    private String vendor;
    private List<Long> points;

}
