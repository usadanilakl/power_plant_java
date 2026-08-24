package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import com.dk_power.power_plant_java.repository.base_repositories.PermitRepo;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WorkRequestRepo extends PermitRepo<WorkRequest> {
    boolean existsBySharepointId(String id);

    List<WorkRequest> findAllBySharepointId(String id);

    Optional<WorkRequest> findFirstBySharepointIdOrderByIdAsc(String id);

    // PWA tracking
    Optional<WorkRequest> findFirstByLocalUuidOrderByIdAsc(String localUuid);

    // PWA permit status
    List<WorkRequest> findBySubmitterEmailIgnoreCase(String email);

    /**
     * Requests whose status is one of the given names, case-insensitively.
     * See {@code WorkRequestStatuses.OPEN} for the set the expiry and auto-close sweeps use.
     */
    @Query("SELECT wr FROM WorkRequest wr WHERE LOWER(wr.permitStatus.name) IN :statuses")
    List<WorkRequest> findByPermitStatusNameInIgnoreCase(@Param("statuses") List<String> lowercaseStatuses);

    List<WorkRequest> findAllByDeletedFalseOrderByDateModifiedDesc();

    List<WorkRequest> findAllByIdInAndDeletedFalse(List<Long> ids);

    @Query(value = """
        SELECT wr.id
        FROM work_request wr
        WHERE COALESCE(wr.deleted, false) = false
          AND NOT EXISTS (
              SELECT 1
              FROM field_change fc
              WHERE fc.entity_type = 'WorkRequest'
                AND fc.entity_id = wr.id
                AND fc.change_type = 'CREATE'
                AND fc.field_name = '_entity_'
          )
        ORDER BY wr.id
        LIMIT :limit
        """, nativeQuery = true)
    List<Long> findIdsMissingCreateMarker(@Param("limit") int limit);
}
