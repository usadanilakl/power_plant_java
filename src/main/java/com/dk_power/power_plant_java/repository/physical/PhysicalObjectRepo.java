package com.dk_power.power_plant_java.repository.physical;

import com.dk_power.power_plant_java.entities.physical.PhysicalObject;
import com.dk_power.power_plant_java.entities.physical.PhysicalObjectType;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Repository for {@link PhysicalObject}. Sync finders ({@code findAllByDateModifiedAfter*}) come from
 * {@link BaseRepository}; the custom finders below back the seeder (upsert/parent resolution) and the tree API.
 * The entity's {@code @Where(deleted IS NOT TRUE)} auto-filters soft-deleted rows from every query.
 */
public interface PhysicalObjectRepo extends BaseRepository<PhysicalObject> {

    /** Upsert lookup by the stable dedupe/link key. */
    Optional<PhysicalObject> findFirstByMaximoKey(String maximoKey);

    /** Parent resolution during asset seeding: the hierarchy node holding a given Maximo location code. */
    Optional<PhysicalObject> findFirstByMaximoLocation(String maximoLocation);

    /** Reverse "show in binder" from a Maximo asset record. */
    Optional<PhysicalObject> findFirstByMaximoAssetnum(String maximoAssetnum);

    /** Tree children of a node. */
    List<PhysicalObject> findByParentId(Long parentId);

    /** Roots (plant-level nodes with no parent). */
    List<PhysicalObject> findByParentIsNull();

    List<PhysicalObject> findByType(PhysicalObjectType type);

    /** Equipment leaves — backs the tag↔assetnum match probe and equipment listings. */
    List<PhysicalObject> findByMaximoAssetnumIsNotNull();

    /**
     * Of the given node ids, those that have at least one child — one query for a whole sibling set's
     * {@code hasChildren} flags (avoids an N+1 per child in the children/levels endpoints).
     */
    @Query("select distinct p.parent.id from PhysicalObject p where p.parent.id in :ids")
    List<Long> findParentIdsHavingChildren(@Param("ids") Collection<Long> ids);

    /**
     * System-membership links for a node's direct children — rows of {@code [childId, valueId]} joined through the
     * {@code physical_object_systems} M2M. One query backs the map layer's "which children are in system X"
     * highlight (avoids N+1 lazy-loading each child's systems collection).
     */
    @Query("select p.id, v.id from PhysicalObject p join p.systems v where p.parent.id = :parentId")
    List<Object[]> findChildSystemLinks(@Param("parentId") Long parentId);

    /**
     * Pessimistic-write lock on a node — serializes concurrent {@code get-or-create diagram} calls for the SAME node
     * (within the endpoint's transaction) so two rapid requests can't each create a diagram, orphaning one.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PhysicalObject p where p.id = :id")
    Optional<PhysicalObject> findByIdForUpdate(@Param("id") Long id);
}
