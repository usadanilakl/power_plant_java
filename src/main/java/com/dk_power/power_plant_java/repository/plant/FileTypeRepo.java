package com.dk_power.power_plant_java.repository.plant;

import com.dk_power.power_plant_java.entities.plant.files.FileType;

public interface FileTypeRepo extends GroupRepo<FileType> {
    FileType findByName(String name);
}
