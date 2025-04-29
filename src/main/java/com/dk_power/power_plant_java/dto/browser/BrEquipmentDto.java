package com.dk_power.power_plant_java.dto.browser;


import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.equipment.HeatTraceDto;
import com.dk_power.power_plant_java.dto.equipment.HighlightDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Set;

@Getter
@Setter
public class BrEquipmentDto {
    private Long id;
    private String tagNumber;
    private String description;
    private String specificLocation;
    private String eqType;
    private List<Long> files;
    private String vendor;
    private String location;
    private String system;
    private String coordinates;
    private String originalPictureSize;
    private String mainFile;
    private Set<Long> lotoPoints;
}
