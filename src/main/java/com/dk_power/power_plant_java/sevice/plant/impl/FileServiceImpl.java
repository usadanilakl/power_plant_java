package com.dk_power.power_plant_java.sevice.plant.impl;

import com.dk_power.power_plant_java.dto.plant.files.FileDto;
import com.dk_power.power_plant_java.entities.plant.Syst;
import com.dk_power.power_plant_java.entities.plant.files.FileObject;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.plant.FileRepo;
import com.dk_power.power_plant_java.sevice.plant.SystemService;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FileServiceImpl extends GroupServiceImpl<FileObject>{
    private final FileRepo repo;
    public FileServiceImpl(FileRepo repo, UniversalMapper mapper, FileRepo repo1) {
        super(repo, mapper);
        this.repo = repo1;
    }
    @Override
    public String delete(Long id) {
        FileObject entity = getById(id);
        String path = entity.getFileLink();
        repo.delete(entity);
        return path;
    }

    public List<String> getVendors() {
        return repo.getVendors();
    }
    public List<FileObject> getFilesByVendor(String value) {
        return repo.findByVendor(value);
    }

    public List<FileDto> getAllDtos() {
        return mapper.convertAll(getAll(),new FileDto());
    }

    public List<String> getSystems() {
        return repo.getSystems();
    }
}
