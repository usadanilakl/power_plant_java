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
@Entity
@NoArgsConstructor
public class Syst extends Group {
    public Syst(String name) {
        super(name);
    }
    @OneToMany(mappedBy = "system")
    private List<Point> points;
    @OneToMany(mappedBy = "system")
    private List<FileObject> files;
}
