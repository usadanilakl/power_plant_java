package com.dk_power.power_plant_java.repository.loto;

import com.dk_power.power_plant_java.entities.loto.LotoStandardPendingChange;
import com.dk_power.power_plant_java.entities.loto.LotoStandardPendingChange.Resolution;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;

public interface LotoStandardPendingChangeRepo extends BaseRepository<LotoStandardPendingChange> {

    /** Every change on a standard, oldest first, regardless of resolution. */
    List<LotoStandardPendingChange> findByStandard_IdOrderByEditedAtAsc(Long standardId);

    /** Filter by resolution — used by closeReview to detect unresolved rows. */
    List<LotoStandardPendingChange> findByStandard_IdAndResolutionOrderByEditedAtAsc(
            Long standardId, Resolution resolution);

    /** Quick existence check for "any unresolved changes?" */
    boolean existsByStandard_IdAndResolution(Long standardId, Resolution resolution);

    /** Count by resolution for the close-review summary. */
    long countByStandard_IdAndResolution(Long standardId, Resolution resolution);

    /**
     * Find an existing PENDING row to coalesce a follow-up edit into. Used so
     * that an auto-save typing burst produces a single row whose newValue
     * tracks the latest state, instead of one row per keystroke. Matches on
     * (standardId, fieldName, lotoPointId, editedBy, resolution=PENDING).
     * lotoPointId may be null (standard-level edit); that's matched too.
     *
     * <p>Resolution=PENDING is passed as a parameter rather than referenced
     * inline — Hibernate's HQL parser doesn't resolve nested enum FQNs in
     * query text.
     */
    @org.springframework.data.jpa.repository.Query("""
        SELECT c FROM LotoStandardPendingChange c
        WHERE c.standard.id = :standardId
          AND c.fieldName = :fieldName
          AND c.editedBy = :editedBy
          AND c.resolution = :resolution
          AND ((:pointId IS NULL AND c.lotoPointId IS NULL) OR c.lotoPointId = :pointId)
        ORDER BY c.editedAt DESC
        """)
    java.util.List<LotoStandardPendingChange> findCoalesceTargetsByResolution(
            @org.springframework.data.repository.query.Param("standardId") Long standardId,
            @org.springframework.data.repository.query.Param("fieldName") String fieldName,
            @org.springframework.data.repository.query.Param("pointId") Long pointId,
            @org.springframework.data.repository.query.Param("editedBy") String editedBy,
            @org.springframework.data.repository.query.Param("resolution") Resolution resolution);

    /** Convenience: always queries for PENDING — the only resolution that ever needs coalescing. */
    default java.util.List<LotoStandardPendingChange> findCoalesceTargets(
            Long standardId, String fieldName, Long pointId, String editedBy) {
        return findCoalesceTargetsByResolution(standardId, fieldName, pointId, editedBy,
                Resolution.PENDING);
    }
}
