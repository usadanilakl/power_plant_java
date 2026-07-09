package com.dk_power.power_plant_java.dto.pwa;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class PwaQualificationPersonDto {
    private String userId;
    private String userName;
    private String userEmail;
    private String windowsUsername;
    private String role;
    private int qualificationCount;
    private List<PwaQualificationDto> qualifications = new ArrayList<>();
}
