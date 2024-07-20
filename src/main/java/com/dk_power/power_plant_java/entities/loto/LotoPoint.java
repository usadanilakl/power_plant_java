package com.dk_power.power_plant_java.entities.loto;


import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.util.List;
import java.util.Set;

@Entity
@NoArgsConstructor
@Getter
@Setter
@Audited
public class LotoPoint extends BaseAuditEntity {
    private String unit;
    private String tagged;
    private String tagNumber;
    private String description;
    private String location;
    private String standard;
    private String generalLocation;
    private String equipment;
    private String extraInfo;
    private String type;
    private String system;
    private String normalPosition;
    private String isolatedPosition;
    private String fluid;
    private String size;
    private String electricalCheckStatus;
    private String redTagId;
    private Boolean inUse = false;
    private String oldId;
    
    @ManyToMany
    @JoinTable(name = "loto_points",
            joinColumns = @JoinColumn(name = "loto_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "point_id", referencedColumnName = "id"))
    //@JsonIgnore
    private List<Loto> lotos;
    @ManyToMany(mappedBy = "lotoPoints")
    @JsonIgnore
    private Set<Equipment> equipmentList;

    public void addLoto(Loto entity) {
        lotos.add(entity);
    }
    public void addEquipment(Equipment equipment){equipmentList.add(equipment);}

}
