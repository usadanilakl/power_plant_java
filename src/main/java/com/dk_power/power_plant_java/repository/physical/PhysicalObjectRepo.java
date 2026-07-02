package com.dk_power.power_plant_java.repository.physical;

import com.dk_power.power_plant_java.entities.physical.PhysicalObject;
import com.dk_power.power_plant_java.entities.physical.PhysicalObjectType;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

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
}
