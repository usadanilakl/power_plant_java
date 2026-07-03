package com.dk_power.power_plant_java.repository.file;

import com.dk_power.power_plant_java.dto.files.FileDtoLight;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface FileRepo extends BaseRepository<FileObject> {
    @Query("SELECT DISTINCT e.vendor.name FROM FileObject e")
    List<String> getVendors();

    @Query("SELECT DISTINCT e.fileType.name FROM FileObject e WHERE e.fileType IS NOT NULL ORDER BY e.fileType.name")
    List<String> getDistinctFileTypeNames();

    @Query("SELECT e FROM FileObject e LEFT JOIN FETCH e.fileType LEFT JOIN FETCH e.vendor WHERE e.extension IN ?1")
    List<FileObject> findByExtensionIn(List<String> extensions);

    /** Exact byte-content duplicate lookup. */
    @Query("SELECT e FROM FileObject e LEFT JOIN FETCH e.fileType LEFT JOIN FETCH e.vendor WHERE e.fileHash = ?1")
    List<FileObject> findByFileHash(String fileHash);

    /** All files with a non-null perceptual hash — for in-memory Hamming distance comparison. */
    @Query("SELECT e FROM FileObject e LEFT JOIN FETCH e.fileType LEFT JOIN FETCH e.vendor WHERE e.perceptualHash IS NOT NULL")
    List<FileObject> findAllWithPerceptualHash();

    /** All files with a non-empty file number — used for Levenshtein-based name dedup. */
    @Query("SELECT e FROM FileObject e LEFT JOIN FETCH e.fileType LEFT JOIN FETCH e.vendor WHERE e.fileNumber IS NOT NULL AND e.fileNumber <> ''")
    List<FileObject> findAllWithFileNumber();

    /** IDs of files missing either fileHash or perceptualHash — for incremental backfill. */
    @Query("SELECT e.id FROM FileObject e WHERE e.fileHash IS NULL OR e.fileHash = '' OR e.perceptualHash IS NULL OR e.perceptualHash = ''")
    List<Long> findIdsNeedingHash();

    /** All file IDs — for full re-hash when the perceptual algorithm itself changes. */
    @Query("SELECT e.id FROM FileObject e")
    List<Long> findAllIds();
    @Query("SELECT e FROM FileObject e WHERE e.vendor.name=?1")
    List<FileObject> findByVendor(String vendor);
    List<FileObject> findByVendor(Value vendor);
    Page<FileObject> findByVendor(Value vendor, Pageable pageable);

    @Query("SELECT f FROM FileObject f LEFT JOIN FETCH f.vendor LEFT JOIN FETCH f.fileType WHERE f.vendor = ?1")
    List<FileObject> findByVendorWithRelationships(Value vendor);

    @Query("SELECT f FROM FileObject f LEFT JOIN FETCH f.vendor LEFT JOIN FETCH f.fileType WHERE f.fileType = ?1")
    List<FileObject> findByFileTypeWithRelationships(Value fileType);
    @Query("SELECT DISTINCT e.system.name FROM FileObject e")
    List<String> getSystems();
    FileObject findFirstByNameOrderByIdAsc(String name);
    FileObject findFirstByFileNumberOrderByIdAsc(String number);
    List<FileObject> findByFileNumberContaining(String text);
    List<FileObject> findByNameContaining(String tag);

    @Query("SELECT new com.dk_power.power_plant_java.dto.files.FileDtoLight(e.id,e.name,e.fileLink,e.relatedSystems,e.fileNumber,e.vendor,e.fileType)FROM FileObject e")
    List<FileDtoLight> getAllLight();
    @Query("SELECT new com.dk_power.power_plant_java.dto.files.FileDtoLight(e.id,e.name,e.fileLink,e.relatedSystems,e.fileNumber,e.vendor,e.fileType) FROM FileObject e WHERE e.completed = true")
    List<FileDtoLight> getAllCompletedLight();
    List<FileObject> findByCompletedIsTrue();
    @Query("SELECT new com.dk_power.power_plant_java.dto.files.FileDtoLight(e.id,e.name,e.fileLink,e.relatedSystems,e.fileNumber,e.vendor,e.fileType) FROM FileObject e WHERE e.completed = false")
    List<FileDtoLight> getAllIncompleteLight();

    FileObject findFirstByFileLinkOrderByIdAsc(String fileLink);

    List<FileObject> findBySystem(Value oldVal);

    List<FileObject> findByFileType(Value oldVal);
    Page<FileObject> findByFileType(Value fileType, Pageable pageable);

    List<FileObject> findByBulkEditStep(String step);

    List<FileObject> findByRelatedSystemsContaining(String system);

    List<FileObject> findByCompletedIsTrueAndIsVerifiedIsFalse();

    List<FileObject> findByFileType_Name(String fileType);

    List<FileObject> findByExtensionsIsNull();
    
    @Query("SELECT f FROM FileObject f WHERE f.extensions IS NULL OR trim(f.extensions) = ''")
    List<FileObject> findByExtensionsIsNullOrBlank();

    List<FileObject> findByRelatedTagsIsNotNull();

    /** Existing clones of a given source file — for clone-to-unit duplicate detection. */
    List<FileObject> findByClonedFromId(Long clonedFromId);

    /** All clones (clonedFromId NOT NULL) — used by the counterpart-backfill job. */
    @Query("SELECT f FROM FileObject f WHERE f.clonedFromId IS NOT NULL")
    List<FileObject> findAllClones();

    /** Files bound to a PhysicalObject (the binder's "Documents" list). */
    List<FileObject> findByPhysicalObjectId(Long physicalObjectId);

}

