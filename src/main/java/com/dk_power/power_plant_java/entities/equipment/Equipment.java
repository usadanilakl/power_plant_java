package com.dk_power.power_plant_java.entities.equipment;


import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
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
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@NoArgsConstructor
@Getter
@Setter
@Audited
@JsonIgnoreProperties(ignoreUnknown = true)
@Where(clause = "deleted=false")
public class Equipment extends BaseAuditEntity {
    private String name;
    private String tagNumber;
    private String description;
    private String specificLocation;
    @ManyToOne
    @JoinColumn(name="eq_type_id")
    private Value eqType;
    @ManyToMany(mappedBy = "points")
    //@JsonBackReference
    @JsonIgnore
    private List<FileObject> files;
    @ManyToOne
    @JoinColumn(name = "vendor_id")
    private Value vendor;
    @ManyToOne
    @JoinColumn(name = "location_id")
    private Value location;
    @ManyToOne
    @JoinColumn(name = "system_id")
    private Value system;
    private String coordinates;
    private String originalPictureSize;
    @ManyToOne
    @JoinColumn(name = "pid_id")
    @JsonBackReference
    //@JsonIgnore
    private FileObject mainFile;
    @ManyToMany
    @JoinTable(name = "eq_loto_point",
            joinColumns = @JoinColumn(name = "eq_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "loto_point_id", referencedColumnName = "id"))

    private Set<LotoPoint> lotoPoints;
    @Transient
    private String pid;


    public void addFile(FileObject file) {
        if(files==null) files = new ArrayList<>();
        if(!files.contains(file)) files.add(file);
    }
    public void addLotoPoint(LotoPoint lotoPoint){lotoPoints.add(lotoPoint);}
    public void setMainFile(FileObject file){
        addFile(file);
        this.mainFile = file;
    }

    @Override
    public String toString() {
        return "Equipment{" +
                "name='" + name + '\'' +
                ",\n tagNumber='" + tagNumber + '\'' +
                ",\n description='" + description + '\'' +
                ",\n specificLocation='" + specificLocation + '\'' +
                ",\n eqType=" + eqType+
                ",\n files=" + files.size()+
                ",\n vendor=" + vendor+
                ",\n location=" + location +
                ",\n system=" + system +
                ",\n coordinates='" + coordinates + '\'' +
                ",\n originalPictureSize='" + originalPictureSize + '\'' +
                ",\n mainFile=" + mainFile.getFileNumber() +
                ",\n pid='" + pid + '\'' +
                '}';
    }
}