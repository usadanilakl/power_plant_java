package com.dk_power.power_plant_java.sevice.plant.impl;

import com.dk_power.power_plant_java.entities.plant.Syst;
import com.dk_power.power_plant_java.entities.plant.files.FileType;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.plant.FileTypeRepo;
import com.dk_power.power_plant_java.sevice.plant.SystemService;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Service;

@Service
public class FileTypeServiceImpl extends GroupServiceImpl<FileType>{

    public FileTypeServiceImpl(FileTypeRepo repo, UniversalMapper mapper) {
        super(repo, mapper);
    }

}
