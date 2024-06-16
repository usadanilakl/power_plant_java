package com.dk_power.power_plant_java.entities.plant;

import com.dk_power.power_plant_java.entities.plant.files.FileObject;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@Entity
@JsonIgnoreProperties(ignoreUnknown = true)
public class Point extends Group {
    private String label;
    private String description;
    @ManyToOne
    @JoinColumn(name="eq_type_id")
    @JsonIgnore
    private EquipmentType eqType;
    @ManyToMany(mappedBy = "points")
    @JsonBackReference
    private List<FileObject> files;
    @ManyToOne
    @JoinColumn(name = "vendor_id")
    @JsonIgnore
    private Vendor vendor;
    @ManyToOne
    @JoinColumn(name = "location_id")
    @JsonIgnore
    private Location location;
    @ManyToOne
    @JoinColumn(name = "system_id")
    private Syst system;
    private String coordinates;
    private String originalPictureSize;
    @ManyToOne
    @JoinColumn(name = "pid_id")
    @JsonBackReference
    private FileObject mainFile;
    @Transient
    private String pid;

    public String getLabel() {
        return label;
    }
    @JsonIgnore
    public List<FileObject> getFiles() {
        return files;
    }
    @JsonIgnore
    public FileObject getMainFile() {
        return mainFile;
    }
}
