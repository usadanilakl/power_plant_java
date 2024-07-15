package com.dk_power.power_plant_java.sevice.file;

import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.mappers.FileMapper;
import com.dk_power.power_plant_java.repository.FileRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

import java.util.List;

public interface FileService extends CrudService<FileObject, FileDto, FileRepo, FileMapper> {
    FileObject saveForTransfer(FileDto transfer);
    List<FileObject> getAllLight();


    FileObject getByFileLink(String fileLink);
}
