package com.dk_power.power_plant_java.repository;

import com.dk_power.power_plant_java.dto.files.FileDtoLight;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface FileRepo extends BaseRepository<FileObject> {
    @Query("SELECT DISTINCT e.vendor.name FROM FileObject e")
    List<String> getVendors();
    @Query("SELECT e FROM FileObject e WHERE e.vendor.name=?1")
    List<FileObject> findByVendor(String vendor);
    List<FileObject> findByVendor(Value vendor);
    @Query("SELECT DISTINCT e.system.name FROM FileObject e")
    List<String> getSystems();
    FileObject findByName(String name);
    FileObject findByFileNumber(String number);
    List<FileObject> findByFileNumberContaining(String text);
    @Query("SELECT new com.dk_power.power_plant_java.dto.files.FileDtoLight(e.id,e.name,e.fileLink,e.relatedSystems,e.fileNumber,e.vendor,e.fileType)FROM FileObject e")
    List<FileDtoLight> getAllLight();
    @Query("SELECT new com.dk_power.power_plant_java.dto.files.FileDtoLight(e.id,e.name,e.fileLink,e.relatedSystems,e.fileNumber,e.vendor,e.fileType) FROM FileObject e WHERE e.completed = true")
    List<FileDtoLight> getAllCompletedLight();
    @Query("SELECT new com.dk_power.power_plant_java.dto.files.FileDtoLight(e.id,e.name,e.fileLink,e.relatedSystems,e.fileNumber,e.vendor,e.fileType) FROM FileObject e WHERE e.completed = false")
    List<FileDtoLight> getAllIncompleteLight();

    FileObject findByFileLink(String fileLink);

    List<FileObject> findBySystem(Value oldVal);

    List<FileObject> findByFileType(Value oldVal);
    List<FileObject> findByBulkEditStep(String step);
    @Query("SELECT f.relatedSystems FROM FileObject f WHERE f.fileType.name = 'PID'")
    List<String> findUniqueRelatedSystems();
}

