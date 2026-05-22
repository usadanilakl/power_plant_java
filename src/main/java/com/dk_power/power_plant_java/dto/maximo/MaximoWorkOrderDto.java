package com.dk_power.power_plant_java.dto.maximo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MaximoWorkOrderDto {
    private String href;
    private String wonum;
    private String description;
    private String longDescription;
    private String status;
    private String worktype;
    private String assetnum;
    private String location;
    private String siteid;
    private String reportdate;
    private String targetStart;     // spi:targstartdate — when the WO is scheduled to be performed
    private String schedstart;
    private String schedfinish;
    private String leadCraft;
    private String supervisor;
    private String priority;
}
