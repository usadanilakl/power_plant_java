package com.dk_power.power_plant_java.sevice.plant.impl;

import com.dk_power.power_plant_java.dto.plant.files.FileTypeDto;
import com.dk_power.power_plant_java.entities.plant.EquipmentType;
import com.dk_power.power_plant_java.entities.plant.Syst;
import com.dk_power.power_plant_java.entities.plant.files.FileType;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.plant.FileTypeRepo;
import com.dk_power.power_plant_java.sevice.plant.SystemService;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Service;

@Service
public class FileTypeServiceImpl extends GroupServiceImpl<FileType>{
    private final FileTypeRepo repo;

    public FileTypeServiceImpl(FileTypeRepo repo, UniversalMapper mapper, FileTypeRepo repo1) {
        super(repo, mapper);
        this.repo = repo1;
    }
    public FileType getByName(String name){
        return repo.findByName(name);
    }
    public FileTypeDto getDtoByName(String name) {
            return mapper.convert(getByName(name), new FileTypeDto());

    }
    @Override
    public FileType saveForTransfer(FileType transfer) {
        FileType entity = repo.findByName(transfer.getName());
        if(entity!=null) transfer.setId(entity.getId());
        return save(transfer);
    }
}
