package com.dk_power.power_plant_java.entities.permits.pojo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PersonnelSignEntry {
    private String personName;
    private String personRole;
    private String company;
    private String signOnTime;
    private String signOffTime;
    private String signOffComments;
    private String performedBy;
    private boolean foreman;
}
