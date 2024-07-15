package com.dk_power.power_plant_java.dto.equipment;


import com.dk_power.power_plant_java.dto.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class EquipmentDto extends BaseDto {
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


    @Override
    public String toString() {
        return "PointDto{" +
                "label='" + tagNumber + '\'' +
                ", description='" + description + '\'' +
                ", eqType=" + eqType +
                ", files=" + files +
                ", vendor=" + vendor +
                ", location=" + location +
                ", system=" + system +
                ", coordinates='" + coordinates + '\'' +
                ", originalPictureSize='" + originalPictureSize + '\'' +
                ", mainFile=" + mainFile +
                '}';
    }
}
