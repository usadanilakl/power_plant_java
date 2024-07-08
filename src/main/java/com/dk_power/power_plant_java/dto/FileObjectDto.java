package com.dk_power.power_plant_java.dto;

import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class FileObjectDto{

    private String fileType;
    private String fileLink;
    private String baseLink;
    private String folder;
    private String system;
    private String relatedSystems;
    private String fileNumber;
    private String extension;
    private String vendor;
    private List<Equipment> points;
    private List<String> systems;


}
