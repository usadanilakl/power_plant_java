package com.dk_power.power_plant_java.repository.file;

import com.dk_power.power_plant_java.entities.files.FileConnector;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Repository for {@link FileConnector} — off-page reference shapes drawn on
 * P&IDs pointing at other files.
 */
public interface FileConnectorRepo extends BaseRepository<FileConnector> {

    /** All connectors drawn on a given source file — the viewer renders these as shapes. */
    List<FileConnector> findBySourceFile_Id(Long sourceFileId);

    /** All connectors that POINT AT a given file — used to highlight back-pointers on arrival. */
    List<FileConnector> findByTargetFile_Id(Long targetFileId);

    /**
     * Connectors pointing FROM source TO target — narrows the "find candidate
     * counterparts" search to the relevant slice (used by the auto-pair pass
     * in the migration: look for connectors on the target file pointing back
     * at the source).
     */
    @Query("SELECT c FROM FileConnector c " +
           "WHERE c.sourceFile.id = :sourceId AND c.targetFile.id = :targetId " +
           "AND (c.deleted IS NULL OR c.deleted = false)")
    List<FileConnector> findBySourceAndTarget(@Param("sourceId") Long sourceId,
                                              @Param("targetId") Long targetId);
}
