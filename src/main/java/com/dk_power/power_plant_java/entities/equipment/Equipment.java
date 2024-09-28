package com.dk_power.power_plant_java.entities.equipment;


import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.base_entities.BaseEquipment;
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
import java.util.HashSet;
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
public class Equipment extends BaseEquipment {
    //private String name;
//    private String tagNumber;
//    private String description;
    private String specificLocation;
    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name="eq_type_id")
    private Value eqType;
//    @ManyToMany(mappedBy = "points")
//    @JsonIgnore
@ManyToMany(cascade = CascadeType.ALL)
@JoinTable(name = "file_point",
        joinColumns = @JoinColumn(name = "point_id", referencedColumnName = "id"),
        inverseJoinColumns = @JoinColumn(name = "file_id", referencedColumnName = "id"))
    private List<FileObject> files;
    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "vendor_id")
    private Value vendor;
    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "location_id")
    private Value location;
    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "system_id")
    private Value system;
    private String coordinates;
    private String originalPictureSize;
    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "pid_id")
    @JsonBackReference
    //@JsonIgnore
    private FileObject mainFile;
    @ManyToMany(cascade = CascadeType.ALL)
    @JoinTable(name = "eq_loto_point",
            joinColumns = @JoinColumn(name = "eq_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "loto_point_id", referencedColumnName = "id"))

    private Set<LotoPoint> lotoPoints;
    @ManyToMany(mappedBy = "equipmentList")
    @JsonBackReference
    private List<HeatTrace> heatTraceList;
    @ManyToMany(mappedBy = "equipmentList")
    @JsonBackReference
    private List<EqBreaker> breakers;
    @OneToMany(mappedBy = "equipment")
    @JsonManagedReference
    private List<Highlight> highlights;



    @Transient
    private String pid;


    public void addFile(FileObject file) {
        if(files==null) files = new ArrayList<>();
        if(!files.contains(file)) files.add(file);
    }
    public void addLotoPoint(LotoPoint lotoPoint){
        if(lotoPoints == null) lotoPoints = new HashSet<>();
        if(lotoPoint!=null) lotoPoints.add(lotoPoint);
    }
    public void setMainFile(FileObject file){
        addFile(file);
        this.mainFile = file;
    }

    @Override
    public String toString() {
        return "Equipment{" +
                "name='" + getName() + '\'' +
                ",\n tagNumber='" + getTagNumber() + '\'' +
                ",\n description='" + getDescription() + '\'' +
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