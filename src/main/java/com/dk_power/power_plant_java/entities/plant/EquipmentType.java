package com.dk_power.power_plant_java.entities.plant;

import com.dk_power.power_plant_java.entities.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Entity
public class EquipmentType extends Group {
    public EquipmentType(String name) {
        super(name);
    }
    @OneToMany(mappedBy = "eqType")
    private List<Point> points;
}
