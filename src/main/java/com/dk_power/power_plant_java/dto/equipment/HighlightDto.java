package com.dk_power.power_plant_java.dto.equipment;


import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import lombok.Getter;
import lombok.Setter;


import java.util.List;
@Getter
@Setter

public class HighlightDto extends BaseDto {


    private String coordinates;
    private String originalPictureSize;
    private Double startX;
    private Double startY;
    private Double endX;
    private Double endY;
    private Double width;
    private Double height;
    private Double pictureWidth;
    private Double pictureHeight;
    private FileDto file;
    private Equipment equipment;

}