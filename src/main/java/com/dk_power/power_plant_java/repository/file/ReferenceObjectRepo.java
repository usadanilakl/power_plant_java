package com.dk_power.power_plant_java.repository.file;

import com.dk_power.power_plant_java.entities.files.ReferenceObject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReferenceObjectRepo extends JpaRepository<ReferenceObject, Long> {

    // Find a ReferenceObject by a specific tag number
    @Query("SELECT r FROM ReferenceObject r WHERE r.tagNumbers LIKE %:tagNumber%")
    Optional<ReferenceObject> findByTagNumber(@Param("tagNumber") String tagNumber);

    // Find ReferenceObjects by a specific file number
    @Query("SELECT r FROM ReferenceObject r WHERE r.fileNumbers LIKE %:fileNumber%")
    List<ReferenceObject> findByFileNumber(@Param("fileNumber") String fileNumber);

    // Find ReferenceObjects containing a specific characteristic
    @Query("SELECT r FROM ReferenceObject r WHERE r.characteristics LIKE %:key%")
    List<ReferenceObject> findByCharacteristicKey(@Param("key") String key);

    // Find ReferenceObjects containing a specific reference
    @Query("SELECT r FROM ReferenceObject r WHERE r.references LIKE %:key%")
    List<ReferenceObject> findByReferenceKey(@Param("key") String key);

    // Find ReferenceObjects with characteristics containing both specified keys
    @Query("SELECT r FROM ReferenceObject r WHERE r.characteristics LIKE %:key1% AND r.characteristics LIKE %:key2%")
    List<ReferenceObject> findByMultipleCharacteristicKeys(@Param("key1") String key1, @Param("key2") String key2);

    // Delete ReferenceObjects with a specific tag number
    @Query("DELETE FROM ReferenceObject r WHERE r.tagNumbers LIKE %:tagNumber%")
    void deleteByTagNumber(@Param("tagNumber") String tagNumber);
}
