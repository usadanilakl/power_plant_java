package com.dk_power.power_plant_java.entities;

import com.dk_power.power_plant_java.entities.plant.Group;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
public class Location extends Group {
    public Location(String name) {
        super(name);
    }
//    @OneToMany(mappedBy = "location")
//    private List<Point> points;
}
