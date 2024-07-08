package com.dk_power.power_plant_java.repository;

import com.dk_power.power_plant_java.entities.FileObject;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface FileRepo extends BaseRepository<FileObject> {
    @Query("SELECT DISTINCT e.vendor.name FROM FileObject e")
    List<String> getVendors();
    @Query("SELECT e FROM FileObject e WHERE e.vendor.name=?1")
    List<FileObject> findByVendor(String vendor);
    @Query("SELECT DISTINCT e.system.name FROM FileObject e")
    List<String> getSystems();
    FileObject findByName(String name);
    FileObject findByFileNumber(String number);
    List<FileObject> findByFileNumberContaining(String text);
}
