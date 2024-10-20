package com.dk_power.power_plant_java.dto.equipment;


import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.base_dtos.BaseEquipmentDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.entities.equipment.HeatTrace;
import com.dk_power.power_plant_java.entities.equipment.Highlight;
import com.fasterxml.jackson.annotation.JsonBackReference;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
public class EquipmentDto extends BaseEquipmentDto {
    private String tagNumber;
    private String description;
    private String specificLocation;
    private ValueDto eqType;
    private List<String> files;
    private ValueDto vendor;
    private ValueDto location;
    private ValueDto system;
    private String coordinates;
    private String originalPictureSize;
    private String mainFile;
    private Set<LotoPointDto> lotoPoints;
    @JsonBackReference
    private List<HeatTraceDto> heatTraceList;
    private HighlightDto highlight;


    @Override
    public String toString() {
        return "EquipmentDto{" +
                "\ntagNumber='" + tagNumber + '\'' +
                ",\n description='" + description + '\'' +
                ",\n specificLocation='" + specificLocation + '\'' +
                ",\n eqType=" + eqType+
                ",\n files=" + files +
                ",\n vendor=" + vendor+
                ",\n location=" + location+
                ",\n system=" + system +
                ",\n coordinates='" + coordinates + '\'' +
                ",\n originalPictureSize='" + originalPictureSize + '\'' +
                ",\n mainFile='" + mainFile + '\'' +
                ",\n lotoPoints='" + lotoPoints.stream().map(LotoPointDto::getTagNumber).collect(Collectors.joining(", ")) + '\'' +
                '}';
    }
}
