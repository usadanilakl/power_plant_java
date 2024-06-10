package com.dk_power.power_plant_java.entities.plant;

import com.dk_power.power_plant_java.entities.plant.files.FileObject;
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
public class Vendor extends Group {

    public Vendor(String name) {
        super(name);
    }
    @OneToMany(mappedBy = "vendor")
    private List<Point> points;
    @OneToMany(mappedBy = "vendor")
    private List<FileObject> files;
}
