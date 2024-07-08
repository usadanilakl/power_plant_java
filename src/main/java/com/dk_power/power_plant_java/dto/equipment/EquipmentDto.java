package com.dk_power.power_plant_java.dto.equipment;

import com.dk_power.power_plant_java.dto.plant.*;
import com.dk_power.power_plant_java.entities.categories.Value;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class EquipmentDto extends BaseDto {
    private String label;
    private String description;
    private String specificLocation;
    private Value eqType;
    private List<String> files;
    private Value vendor;
    private Value location;
    private Value system;
    private String coordinates;
    private String originalPictureSize;
    private String mainFile;

    @Override
    public String toString() {
        return "PointDto{" +
                "label='" + label + '\'' +
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
