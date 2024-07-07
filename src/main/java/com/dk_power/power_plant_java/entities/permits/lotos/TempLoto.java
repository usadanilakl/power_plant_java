package com.dk_power.power_plant_java.entities.permits.lotos;

import com.dk_power.power_plant_java.entities.equipment.RevisedExcelPoints;
import com.dk_power.power_plant_java.entities2.loto.Box;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.util.List;

@Entity
@NoArgsConstructor
@Setter
@Getter
@Audited
public class TempLoto extends BaseLoto{
    @Transient
    private Box box;
//    @JsonBackReference
    @JsonIgnore
    @ManyToMany(mappedBy = "lotos")
    private List<RevisedExcelPoints> lotoPoints;

    public void addPoint(RevisedExcelPoints p) {
        lotoPoints.add(p);
    }
}
