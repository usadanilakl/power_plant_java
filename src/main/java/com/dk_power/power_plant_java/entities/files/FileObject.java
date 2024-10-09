package com.dk_power.power_plant_java.entities.files;


import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.equipment.HeatTrace;
import com.dk_power.power_plant_java.entities.equipment.Highlight;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;
import org.hibernate.envers.Audited;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Audited
@JsonIgnoreProperties(ignoreUnknown = true)
@Where(clause = "deleted=false")
public class FileObject extends BaseAuditEntity {

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

    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "file_type_id")
    private Value fileType;

    private String fileLink;
    private String baseLink;
    private String folder;

    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "system_id")
    private Value system;

    //@Column(length = 2000)
    private String relatedSystems;
    private String fileNumber;
    private String extension;

    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "vendor_id")
    private Value vendor;

    @ManyToMany(mappedBy = "files")
    @JsonIgnore
    @JsonManagedReference
    private List<Equipment> points;

    @JsonBackReference
    @ManyToMany(mappedBy = "pid")
    private List<HeatTrace> heatTrace;

    @OneToMany(mappedBy = "file")
    @JsonBackReference
    private List<Highlight> highlights;

    private Boolean completed;
    private String bulkEditStep = "eqTagNumber";
    private String docNum;




    @Transient
    private List<String> systems;

    public String buildFileLink(){
        fileLink = baseLink+"/"+extension+"/"+fileType.getName()+"/"+vendor.getName()+"/"+fileNumber+"."+extension;
        return fileLink;
    }
    public String buildFolder(){
        folder = baseLink+"/"+extension+"/"+fileType.getName()+"/"+vendor.getName();
        return folder;
    }
    public String buildFileLink(String extention){
        this.extension = extention;
        fileLink = baseLink+"/"+extension+"/"+fileType.getName()+"/"+vendor.getName()+"/"+fileNumber+"."+extension;
        return fileLink;
    }


    public void addPoint(Equipment entity) {
        if(points==null) points = new ArrayList<>();
        if(!points.contains(entity))points.add(entity);
    }

    public String getFileLink() {
        return fileLink;
    }

    public String getFileNumber() {
        return fileNumber;
    }
    //    @JsonManagedReference
//    @OneToMany(mappedBy="mainFile")
//    private List<Point> filePoints;
//    public void addFilePoint(Point entity) {
//        if(filePoints==null) filePoints = new ArrayList<>();
//        filePoints.add(entity);
//    }

    public void setRelatedSystems(String system){
        if(relatedSystems==null)relatedSystems = system;
        else relatedSystems+=","+system;
    }

    @Override
    public String toString() {
        return "FileObject{" +
                "name='" + name + '\'' +
                ",\n\t fileType=" + fileType +
                ",\n\t fileLink='" + fileLink + '\'' +
                ",\n\t baseLink='" + baseLink + '\'' +
                ",\n\t folder='" + folder + '\'' +
                ",\n\t system=" + system +
                ",\n\t relatedSystems='" + relatedSystems + '\'' +
                ",\n\t fileNumber='" + fileNumber + '\'' +
                ",\n\t extension='" + extension + '\'' +
                ",\n\t vendor=" + vendor +
                ",\n\t points=" + points +
                ",\n\t systems=" + systems +
                "\n\tobject type=" + getObjectType() +
                '}';
    }

    public void removePoint(Equipment entity) {
        points.removeIf(e->e.getId()==entity.getId());
    }
}
