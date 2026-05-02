package com.dk_power.power_plant_java.repository.loto;


import com.dk_power.power_plant_java.entities.loto.Lock;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface LockRepo extends BaseRepository<Lock> {

    @Query("SELECT l FROM Lock l WHERE l.homeBoxNumber = :boxNumber AND l.loto IS NULL ORDER BY l.number")
    List<Lock> findAvailableLocksByHomeBox(Integer boxNumber);

    @Query("SELECT l FROM Lock l WHERE l.homeBoxNumber = :boxNumber ORDER BY l.number")
    List<Lock> findByHomeBoxNumber(Integer boxNumber);

    @Query("SELECT l FROM Lock l WHERE l.isSingleLock = true AND l.loto IS NULL ORDER BY l.number")
    List<Lock> findAvailableSingleLocks();

    @Query("SELECT COUNT(l) FROM Lock l WHERE l.isSingleLock = true AND l.loto IS NULL")
    long countAvailableSingleLocks();

    List<Lock> findByLotoId(Long lotoId);
}
