package com.dk_power.power_plant_java.entities.equipment;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.files.FileObject;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class HeatTrace extends BaseIdEntity {
    private Boolean isInUse;
    private String breaker;
    private String tagNumber;
    private String panel;
    private String htt;
    private String line;
    private String pid;
    @ManyToOne
    @JoinColumn(name = "iso_id")
    private FileObject isoLink;
    @ManyToMany
    @JoinTable(
            name = "ht_pid",
            joinColumns = @JoinColumn(name = "ht_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "pid_id", referencedColumnName = "id")
    )
    private List<FileObject> pdLink;
    private String location;

}
