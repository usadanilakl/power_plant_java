package com.dk_power.power_plant_java.sevice.file;

import com.dk_power.power_plant_java.dto.equipment.HtBreakerDto;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.files.FileDtoLight;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.mappers.FileMapper;
import com.dk_power.power_plant_java.repository.FileRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;
import com.dk_power.power_plant_java.sevice.base_services.RefactorService;

import java.util.List;
import java.util.Map;

public interface FileService extends CrudService<FileObject, FileDto, FileRepo, FileMapper>, RefactorService {
    FileObject saveForTransfer(FileDto transfer);
    List<FileDtoLight> getAllLight();
    List<FileDto> getAllDtos(String ext);
    List<FileObject> getIfNumberContains(String pid);
    List<FileObject> getIfNameContains(String tag);

    FileObject getByFileLink(String fileLink);
    FileObject getFileByNumber(String s);
    List<FileObject> getByVendor(Value oldVal);
    List<FileObject> getByFileType(Value oldVal);
    List<FileObject> getBySystem(Value oldVal);
    List<FileObject> getByValue(Value val);

    List<String> getVendors();
    List<String> getSystems();
    List<FileObject> getFilesByVendor(String value);

    void createFileObjectsFromFolder(String path, String type, String extension, String vendor);
    void createFileObjectsFromFolder(String path, String type, String extension, String vendor,String system);
    void createNewFile(FileDto file);
    void updateFile(FileDto file);

    List <FileDtoLight> getCompletedPids();
    List <FileDtoLight> getIncompletePids();

    List<Map<String, String>> verifyPid(String pid);
    List<FileDto> getSkipped();
    FileDto copyFromAnotherUnit(String sourceId,String destinationId);
    List<FileObject> getCompletedFull();
    FileObject getFileByEqId(Long id);

    List<String> getHtPanels();

    List<String> getElPanels();

    List<HtBreakerDto> getHtBrakersByPanelTag(String panelTag);
}
