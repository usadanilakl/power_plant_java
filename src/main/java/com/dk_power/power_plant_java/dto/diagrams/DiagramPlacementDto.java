package com.dk_power.power_plant_java.dto.diagrams;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
@NoArgsConstructor
public class DiagramPlacementDto extends BaseDto {
    private String description;
    private Long diagramId;
    private Integer localId;

    // Simulation
    private String simRole;
    private String simParamsJson;
    private Long simEquipmentId;
    private String sourceEntityType;
    private Long sourceEntityId;

    // Position
    private Integer x;
    private Integer y;
    private Integer width;
    private Integer height;
    private Integer rotation;

    // Visual
    private String color;
    private String fillColor;
    private Integer lineWidth;
    private String label;
    private Integer zIndex;
    private Boolean locked;
    private String groupId;

    // Type
    private String type;

    // Symbol
    private String symbolId;
    private String svgPath;
    private Integer originalWidth;
    private Integer originalHeight;

    // Text
    private String text;
    private Integer fontSize;
    private String fontFamily;

    // Circle
    private Integer radius;

    // Line
    private Integer startX;
    private Integer startY;
    private Integer endX;
    private Integer endY;
}
