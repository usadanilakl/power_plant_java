package com.dk_power.power_plant_java.sevice.file;

import com.dk_power.power_plant_java.dto.plant.files.FileDto;
import com.dk_power.power_plant_java.entities.FileObject;
import com.dk_power.power_plant_java.mappers.FileMapper;
import com.dk_power.power_plant_java.repository.FileRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

public interface FileService extends CrudService<FileObject, FileDto, FileRepo, FileMapper> {

}
