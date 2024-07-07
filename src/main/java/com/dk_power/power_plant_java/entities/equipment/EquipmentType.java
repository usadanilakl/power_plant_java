package com.dk_power.power_plant_java.entities.equipment;

import com.dk_power.power_plant_java.entities.plant.Group;
import com.dk_power.power_plant_java.entities2.BaseEntity;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class EquipmentType extends Group {

    private String name;
//    @OneToMany(mappedBy = "eqType")
//    private List<Point> points;
}
