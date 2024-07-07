package com.dk_power.power_plant_java.entities2;

import com.dk_power.power_plant_java.entities.files.FileType;
import com.dk_power.power_plant_java.entities.plant.Group;
import com.dk_power.power_plant_java.entities.equipment.Point;
import com.dk_power.power_plant_java.entities.Syst;
import com.dk_power.power_plant_java.entities.Vendor;
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
public class FileObject extends Group {

    public FileObject(String name, FileType fileType, String fileLink, Syst sytem, String fileNumber, Vendor vendor) {
        super(name);
        this.fileType = fileType;
        this.fileLink = fileLink;
        this.system = sytem;
        this.fileNumber = fileNumber;
        this.vendor = vendor;
    }
    public FileObject(String name) {
        super(name);
    }
    @ManyToOne
    @JoinColumn(name = "file_type_id")
    private FileType fileType;
    private String fileLink;
    private String baseLink;
    private String folder;
    @ManyToOne
    @JoinColumn(name = "system_id")
    private Syst system;
    private String relatedSystems;
    private String fileNumber;
    private String extension;
    @ManyToOne
    @JoinColumn(name = "vendor_id")
    private Vendor vendor;
    @ManyToMany
    @JoinTable(name = "file_point",
            joinColumns = @JoinColumn(name = "file_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "point_id", referencedColumnName = "id"))
    @JsonManagedReference
    private List<Point> points;


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


    public void addPoint(Point entity) {
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
