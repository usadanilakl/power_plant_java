package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.AirTest;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AirTestRepo extends BaseRepository<AirTest> {

    List<AirTest> findByMonitoredArea_IdOrderByTestedAtDesc(Long monitoredAreaId);

    Optional<AirTest> findFirstByClientUuid(String clientUuid);

    /**
     * The NEWEST test per area — one row each, not the whole history.
     *
     * <p>The correlated subquery matters: the naive version pulled every test for every area back
     * and collapsed them in Java, so the cost of loading the list grew with the size of the history
     * table rather than the number of areas. On a screen that is opened constantly, and republished
     * after every reading, that is the difference between a feature and a problem.
     *
     * <p>An explicit join, because {@code t.monitoredArea.id} in a WHERE clause is an implicit INNER
     * join in JPQL and would silently drop any test whose area FK is null.
     */
    @Query("SELECT t FROM AirTest t JOIN t.monitoredArea a "
            + "WHERE a.id IN :areaIds AND (t.deleted IS NULL OR t.deleted = false) "
            + "AND t.testedAt = (SELECT MAX(t2.testedAt) FROM AirTest t2 "
            + "                  WHERE t2.monitoredArea = a AND (t2.deleted IS NULL OR t2.deleted = false))")
    List<AirTest> findRecentForAreas(@Param("areaIds") Collection<Long> areaIds);
}
