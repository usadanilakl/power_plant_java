package com.dk_power.power_plant_java.entities.equipment;

import com.dk_power.power_plant_java.entities.base_entities.BaseEquipment;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class HeatTrace extends BaseEquipment {
    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "breaker_id")
    @JsonManagedReference
    private HtBreaker breaker;
    @ManyToMany(cascade = CascadeType.ALL)
    @JoinTable(
            name = "ht_equipment",
            joinColumns = @JoinColumn(name = "ht_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "eq_id", referencedColumnName = "id")
    )
    @JsonManagedReference
    private List<Equipment> equipmentList;
    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "iso_id")
    private FileObject htIso;
    @JsonManagedReference
    @ManyToMany(cascade = CascadeType.ALL)
    @JoinTable(
            name = "ht_pid",
            joinColumns = @JoinColumn(name = "ht_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "pid_id", referencedColumnName = "id")
    )
    private List<FileObject> pid;

}
