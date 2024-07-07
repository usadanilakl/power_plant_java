package com.dk_power.power_plant_java.entities;

import com.dk_power.power_plant_java.entities.plant.Group;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@NoArgsConstructor
public class Syst extends Group {
    public Syst(String name) {
        super(name);
    }
//    @OneToMany(mappedBy = "system")
//    private List<Point> points;
//    @OneToMany(mappedBy = "system")
//    private List<FileObject> files;
}
