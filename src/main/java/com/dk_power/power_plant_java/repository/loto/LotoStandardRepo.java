package com.dk_power.power_plant_java.repository.loto;

import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LotoStandardRepo extends BaseRepository<LotoStandard> {

    /**
     * Every (non-deleted) standard that contains the given LotoPoint. Used by
     * the pending-review capture service to flag changes on every standard
     * affected by a point edit.
     */
    @Query("SELECT s FROM LotoStandard s JOIN s.lotoPoints p WHERE p.id = :pointId")
    List<LotoStandard> findStandardsContainingPoint(@Param("pointId") Long pointId);

    /**
     * Read the standard with a row-level write lock. Used by mutually-
     * exclusive lifecycle operations that must not race each other:
     * {@code NgLotoStandardService.deleteStandard} and
     * {@code NgLotoService.createFromStandard}. Without the lock, a create
     * transaction could pass its {@code deleted=false} check on a snapshot
     * that a concurrent delete transaction had already invalidated but not
     * committed — leaving an orphan permit pointing at a soft-deleted
     * standard. Contention is negligible: both operations are rare, and the
     * lock is scoped to the standard row.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM LotoStandard s WHERE s.id = :id")
    Optional<LotoStandard> findByIdForUpdate(@Param("id") Long id);
}
