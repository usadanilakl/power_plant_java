package com.dk_power.power_plant_java.dto.equipment;


import com.dk_power.power_plant_java.dto.base_dtos.BaseEquipmentDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.fasterxml.jackson.annotation.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
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
    private Double rotation;
    private String mainFile;
    private FileDto mainFileObject;
    private Long mainFileId;
    private Set<LotoPointDto> lotoPoints;
    private List<HeatTraceDto> heatTraceList;
//    @JsonIgnore
    private HighlightDto highlight;
    private String isUpdated;
    private String conflictStatus;
    private Boolean isVerified = false;

    public static final List<String> SYSTEMS = List.of(
            "BFW","CND","CCW","INA","FGS","DWS","DWT","SWS","STP","CTP"
            );

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
//                ",\n lotoPoints='" + lotoPoints.stream().map(LotoPointDto::getTagNumber).collect(Collectors.joining(", ")) + '\'' +
                '}';
    }
}
