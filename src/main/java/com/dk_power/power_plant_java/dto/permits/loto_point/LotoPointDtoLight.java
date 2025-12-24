package com.dk_power.power_plant_java.dto.permits.loto_point;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter
public class LotoPointDtoLight extends BaseDto {
    public LotoPointDtoLight(Long id, String unit, String tagged, String tagNumber, String description, String specificLocation, String normalPosition, String isolatedPosition, String oldId, String objectType) {
        super.setId(id);
        this.unit = unit;
        this.tagged = tagged;
        this.tagNumber = tagNumber;
        this.description = description;
        this.specificLocation = specificLocation;
        this.normalPosition = normalPosition;
        this.isolatedPosition = isolatedPosition;
        this.oldId = oldId;
        this.objectType = objectType;
    }

    private String unit;
    private String tagged;
    private String tagNumber;
    private String description;
    private String specificLocation;

    private String normalPosition;
    private String isolatedPosition;

    private String oldId;
    private String objectType;
    private String zeroEnergyMethod;

}
