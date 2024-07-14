package com.dk_power.power_plant_java.entities.loto;


import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.loto.Loto;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.util.List;

@Entity
@NoArgsConstructor
@Getter
@Setter
@Audited
public class LotoPoint extends BaseAuditEntity {
    String unit;
    String tagged;
    String label;
    String description;
    String location;
    String standard;
    String generalLocation;
    String equipment;
    String extraInfo;
    String type;
    String system;
    String normalPosition;
    String isolatedPosition;
    String fluid;
    String size;
    String electricalCheckStatus;
    String redTagId;
    Boolean inUse = false;
    @ManyToMany
    @JoinTable(name = "loto_points",
            joinColumns = @JoinColumn(name = "loto_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "point_id", referencedColumnName = "id"))
    //@JsonIgnore
    private List<Loto> lotos;

    public void addLoto(Loto entity) {
        lotos.add(entity);
    }

}
