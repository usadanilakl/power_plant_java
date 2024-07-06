package com.dk_power.power_plant_java.entities.permits.lotos;

import com.dk_power.power_plant_java.entities.plant.RevisedExcelPoints;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Transient;
import lombok.Data;
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
