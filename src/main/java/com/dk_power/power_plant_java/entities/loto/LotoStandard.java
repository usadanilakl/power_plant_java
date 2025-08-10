package com.dk_power.power_plant_java.entities.loto;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Where;
import org.hibernate.envers.Audited;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@Audited
@Where(clause = "deleted=false")
public class LotoStandard extends BaseAuditEntity {
    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "loto_standard_loto_point",
            joinColumns = @JoinColumn(name = "loto_standard_id"),
            inverseJoinColumns = @JoinColumn(name = "loto_point_id")
    )
    private Set<LotoPoint> lotoPoints = new HashSet<>();

    private String description;
    
    public void addLotoPoint(LotoPoint lotoPoint) {
        if (this.lotoPoints == null) {
            this.lotoPoints = new HashSet<>();
        }
        this.lotoPoints.add(lotoPoint);
    }

    public void removeLotoPoint(LotoPoint lotoPoint) {
        if (this.lotoPoints!= null) {
            this.lotoPoints.remove(lotoPoint);
        }
    }
}
