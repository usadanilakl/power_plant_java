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
        return "EquipmentDto{" +
                "tagNumber='" + tagNumber + '\'' +
                ", description='" + description + '\'' +
                ", specificLocation='" + specificLocation + '\'' +
                ", eqType=" + eqType.getName() +
                ", files=" + files +
                ", vendor=" + vendor.getName() +
//                ", location=" + location.getName() +
//                ", system=" + system.getName() +
                ", coordinates='" + coordinates + '\'' +
                ", originalPictureSize='" + originalPictureSize + '\'' +
                ", mainFile='" + mainFile + '\'' +
                '}';
    }
}
