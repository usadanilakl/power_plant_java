package com.dk_power.power_plant_java.dto.maximo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MaximoServiceRequestDto {
    private String href;
    private String ticketid;       // SR number
    private String description;
    private String longDescription;
    private String status;
    private String assetnum;
    private String location;
    private String siteid;
    private String reportedby;
    private String reportdate;
    private String classstructureid;
    private String priority;
    private String affectedperson;
}
