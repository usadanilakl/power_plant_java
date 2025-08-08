package com.dk_power.power_plant_java.entities.loto;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
public class LotoStandard extends BaseAuditEntity {
    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "loto_loto_point",
            joinColumns = @JoinColumn(name = "loto_id"),
            inverseJoinColumns = @JoinColumn(name = "loto_point_id")
    )
    private Set<LotoPoint> lotoPoints = new HashSet<>();

    private String description;

}
