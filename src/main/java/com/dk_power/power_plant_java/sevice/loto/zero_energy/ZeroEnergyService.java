package com.dk_power.power_plant_java.sevice.loto.zero_energy;

import com.dk_power.power_plant_java.dto.permits.zero_energy.ZeroEnergyDto;
import com.dk_power.power_plant_java.entities.loto.ZeroEnergy;
import com.dk_power.power_plant_java.mappers.ZeroEnergyMapper;
import com.dk_power.power_plant_java.repository.loto.ZeroEnergyRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

import java.util.List;

/**
 * Service for managing ZeroEnergy entities with automatic deduplication.
 * When saving a LotoPoint, the ZeroEnergy is analyzed and either reused or created new.
 */
public interface ZeroEnergyService extends CrudService<ZeroEnergy, ZeroEnergyDto, ZeroEnergyRepo, ZeroEnergyMapper> {

    /**
     * Finds an existing ZeroEnergy with the same template and equipment IDs,
     * or creates a new one if no match exists.
     *
     * This implements the deduplication pattern - identical zero energy methods
     * are stored once and shared across multiple LOTO points.
     *
     * @param dto The ZeroEnergy data from the client
     * @return Existing or newly created ZeroEnergy entity
     */
    ZeroEnergy findOrCreate(ZeroEnergyDto dto);

    /**
     * Gets all ZeroEnergy items with usage statistics.
     * Useful for admin UI to view and manage zero energy templates.
     *
     * @return List of ZeroEnergy DTOs with usage counts
     */
    List<ZeroEnergyDto> getAllWithUsageCount();

    /**
     * Finds all unused ZeroEnergy items (not referenced by any LotoPoint).
     *
     * @return List of orphaned ZeroEnergy entities
     */
    List<ZeroEnergy> findOrphans();

    /**
     * Deletes all unused ZeroEnergy items.
     * Should be called periodically or manually from admin UI.
     *
     * @return Number of items deleted
     */
    int cleanupOrphans();

    /**
     * Merges two ZeroEnergy items by reassigning all LotoPoints
     * from source to target, then deleting the source.
     *
     * @param sourceId ZeroEnergy to merge from
     * @param targetId ZeroEnergy to merge into
     * @return Number of LotoPoints reassigned
     */
    int merge(Long sourceId, Long targetId);

    /**
     * Gets usage count for a specific ZeroEnergy item.
     *
     * @param zeroEnergyId The ZeroEnergy ID
     * @return Number of LotoPoints using this ZeroEnergy
     */
    long getUsageCount(Long zeroEnergyId);
}
