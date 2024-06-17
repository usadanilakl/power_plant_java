package com.dk_power.power_plant_java.entities.plant.files;

import com.dk_power.power_plant_java.entities.plant.Group;
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
public class FileType extends Group {
    public FileType(String name) {
        super(name);
    }
//    @OneToMany(mappedBy = "fileType")
//    private List<FileObject> files;
}
