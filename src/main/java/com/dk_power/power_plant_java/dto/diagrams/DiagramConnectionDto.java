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
public class DiagramConnectionDto extends BaseDto {
    private Long diagramId;
    private Integer localId;

    private Integer sourcePlacementLocalId;
    private Integer targetPlacementLocalId;
    private String sourceAnchor;
    private String targetAnchor;

    private Long pipeTemplateId;
    private String pipeName;
    private String pipeParamsJson;

    private String waypointsJson;
    private String lineStyle;
    private Integer lineWidth;
    private String color;
}
