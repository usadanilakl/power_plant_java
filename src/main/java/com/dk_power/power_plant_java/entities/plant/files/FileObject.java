package com.dk_power.power_plant_java.entities.plant.files;

import com.dk_power.power_plant_java.entities.plant.Group;
import com.dk_power.power_plant_java.entities.plant.Point;
import com.dk_power.power_plant_java.entities.plant.Syst;
import com.dk_power.power_plant_java.entities.plant.Vendor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
    private List<Point> points;
    @OneToMany(mappedBy = "mainFile")
    private List<Point> filePoints;
    @Transient
    private List<String> systems;

    public void buildFileLink(){
        fileLink = baseLink+"/"+folder+"/"+fileNumber+"."+extension;
    }


    public void addPoint(Point entity) {
        if(points==null) points = new ArrayList<>();
        points.add(entity);
    }

    public void addFilePoint(Point point) {
        if(filePoints==null) filePoints = new ArrayList<>();
        filePoints.add(point);
    }
}
