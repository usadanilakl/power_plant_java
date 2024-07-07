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
public class Vendor extends Group {

    public Vendor(String name) {
        super(name);
    }
//    @OneToMany(mappedBy = "vendor")
//    private List<Point> points;
//    @OneToMany(mappedBy = "vendor")
//    @JsonIgnore
//    private List<FileObject> files;

    @Override
    public String toString() {
        return getName();
    }
}
