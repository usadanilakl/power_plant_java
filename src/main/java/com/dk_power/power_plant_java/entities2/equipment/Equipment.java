package com.dk_power.power_plant_java.entities2.equipment;

import com.dk_power.power_plant_java.entities.Location;
import com.dk_power.power_plant_java.entities.Syst;
import com.dk_power.power_plant_java.entities.Vendor;
import com.dk_power.power_plant_java.entities.equipment.EquipmentType;
import com.dk_power.power_plant_java.entities.plant.Group;
import com.dk_power.power_plant_java.entities2.BaseEntity;
import com.dk_power.power_plant_java.entities2.FileObject;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.util.ArrayList;
import java.util.List;

@Entity
@NoArgsConstructor
@Getter
@Setter
@Audited
@JsonIgnoreProperties(ignoreUnknown = true)
public class Equipment extends BaseEntity {
    private String name;
    private String label;
    private String description;
    private String specificLocation;
    @ManyToOne
    @JoinColumn(name="eq_type_id")
    private EquipmentType eqType;
    @ManyToMany(mappedBy = "points")
    //@JsonBackReference
    @JsonIgnore
    private List<FileObject> files;
    @ManyToOne
    @JoinColumn(name = "vendor_id")
    private Vendor vendor;
    @ManyToOne
    @JoinColumn(name = "location_id")
    private Location location;
    @ManyToOne
    @JoinColumn(name = "system_id")
    private Syst system;
    private String coordinates;
    private String originalPictureSize;
    @ManyToOne
    @JoinColumn(name = "pid_id")
    @JsonBackReference
    @JsonIgnore
    private FileObject mainFile;
    @Transient
    private String pid;


    public void addFile(FileObject file) {
        if(files==null) files = new ArrayList<>();
        if(!files.contains(file)) files.add(file);
    }
}