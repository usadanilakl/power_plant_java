package com.dk_power.power_plant_java.dto.equipment;


import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import lombok.Getter;
import lombok.Setter;


import java.util.List;
@Getter
@Setter
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")

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
    private List<EquipmentDto> equipmentList;

}