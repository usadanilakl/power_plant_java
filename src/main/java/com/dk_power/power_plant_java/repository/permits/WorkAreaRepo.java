package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkAreaRepo extends BaseRepository<WorkArea> {
    List<WorkArea> findByAreaType_Id(Long typeId);
    List<WorkArea> findByShape_Id(Long shapeId);
    Optional<WorkArea> findFirstByNameIgnoreCase(String name);

    /** Work areas anchored to a given plant node (the binder / map "Safety" surface). */
    List<WorkArea> findByPhysicalObjectId(Long physicalObjectId);

    /** For a set of plant nodes, how many work areas each has — one query for the map's safety badge. */
    @Query("select wa.physicalObjectId, count(wa) from WorkArea wa where wa.physicalObjectId in :ids group by wa.physicalObjectId")
    List<Object[]> countByPhysicalObjectIdIn(@Param("ids") Collection<Long> ids);

    @Query("SELECT DISTINCT wa FROM WorkArea wa LEFT JOIN FETCH wa.locations")
    List<WorkArea> findAllWithLocations();

    /**
     * {@code [workAreaId, lotoStandardId]} pairs for every area that has constant standards.
     *
     * <p>A projection rather than a second {@code LEFT JOIN FETCH} on {@link #findAllWithLocations}:
     * the PWA snapshot is built outside a transaction, so touching the lazy {@code constantLotos}
     * collection on those detached areas throws. Fetch-joining two collections at once would also
     * multiply the rows out for no benefit — this is one flat query the caller indexes by area.
     */
    @Query("SELECT wa.id, s.id FROM WorkArea wa JOIN wa.constantLotos s")
    List<Object[]> findConstantLotoStandardIdPairs();

    /**
     * Work areas that carry a given LOTO Standard in their {@code constantLotos}
     * many-to-many. Used by the standard-delete flow so we can unlink the
     * standard from every referencing work area before its rows are removed
     * from the join table.
     */
    @Query("SELECT DISTINCT wa FROM WorkArea wa JOIN wa.constantLotos c WHERE c.id = :standardId")
    List<WorkArea> findByConstantLotoStandardId(@Param("standardId") Long standardId);
}
