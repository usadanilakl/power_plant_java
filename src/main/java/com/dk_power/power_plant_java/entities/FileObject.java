package com.dk_power.power_plant_java.entities;


import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.base_entities.BaseEntity;
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
@Entity
@JsonIgnoreProperties(ignoreUnknown = true)
public class FileObject extends BaseEntity {

    public FileObject(String name, Value fileType, String fileLink, Value sytem, String fileNumber, Value vendor) {
        this.name = name;
        this.fileType = fileType;
        this.fileLink = fileLink;
        this.system = sytem;
        this.fileNumber = fileNumber;
        this.vendor = vendor;
    }
    public FileObject(String name) {
        this.name = name;
    }
    private String name;
    @ManyToOne
    @JoinColumn(name = "file_type_id")
    private Value fileType;
    private String fileLink;
    private String baseLink;
    private String folder;
    @ManyToOne
    @JoinColumn(name = "system_id")
    private Value system;
    private String relatedSystems;
    private String fileNumber;
    private String extension;
    @ManyToOne
    @JoinColumn(name = "vendor_id")
    private Value vendor;
    @ManyToMany
    @JoinTable(name = "file_point",
            joinColumns = @JoinColumn(name = "file_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "point_id", referencedColumnName = "id"))
    @JsonManagedReference
    private List<Equipment> points;


    @Transient
    private List<String> systems;

    public String buildFileLink(){
        fileLink = baseLink+"/"+extension+"/"+folder+"/"+fileNumber+"."+extension;
        return fileLink;
    }
    public String buildFileLink(String extention){
        this.extension = extention;
        fileLink = baseLink+"/"+extension+"/"+folder+"/"+fileNumber+"."+extension;
        return fileLink;
    }


    public void addPoint(Equipment entity) {
        if(points==null) points = new ArrayList<>();
        points.add(entity);
    }

//    @JsonManagedReference
//    @OneToMany(mappedBy="mainFile")
//    private List<Point> filePoints;
//    public void addFilePoint(Point entity) {
//        if(filePoints==null) filePoints = new ArrayList<>();
//        filePoints.add(entity);
//    }
}
