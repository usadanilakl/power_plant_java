package com.dk_power.power_plant_java.dto.fire_impairment;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FireImpairmentDto {

    private Long id;
    private String name;
    private String email;
    private String emailCc;
    private String clientName;
    private String indexNumber;
    private String streetAddress;
    private String state;
    private String city;
    private String country;
    private String phone;
    private String valveNumber;
    private String areaProtected;
    private String reason;
    private String office;
    private String protectionType;
    private String submissionDate;
    private String predictedRestorationDate;
    private String closedDate;
    private String precautions;
    private Boolean isActive;
    private String url;
    private String location;
}
