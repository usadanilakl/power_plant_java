package com.dk_power.power_plant_java.dto;

import com.dk_power.power_plant_java.entities.Syst;
import com.dk_power.power_plant_java.entities.Vendor;
import com.dk_power.power_plant_java.entities.equipment.Point;
import com.dk_power.power_plant_java.entities.files.FileType;
import com.dk_power.power_plant_java.entities.plant.Group;
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

    private FileType fileType;
    private String fileLink;
    private String baseLink;
    private String folder;
    private Syst system;
    private String relatedSystems;
    private String fileNumber;
    private String extension;
    private Vendor vendor;
    private List<Point> points;
    private List<String> systems;


}
