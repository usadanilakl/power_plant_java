package com.dk_power.power_plant_java.repository.loto;

import com.dk_power.power_plant_java.entities.loto.ZeroEnergy;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ZeroEnergyRepo extends BaseRepository<ZeroEnergy> {

    /**
     * Finds a ZeroEnergy with matching template and equipment IDs.
     * Equipment IDs are stored as sorted, comma-separated string.
     *
     * @param templateId The zero energy template (Value) ID
     * @param equipmentIds Sorted, comma-separated equipment IDs (e.g., "123,456,789")
     * @return Matching ZeroEnergy if found
     */
    @Query("SELECT ze FROM ZeroEnergy ze " +
           "WHERE (:templateId IS NULL AND ze.zeroEnergyTemplate IS NULL " +
           "       OR ze.zeroEnergyTemplate.id = :templateId) " +
           "AND (:equipmentIds = '' AND (ze.templateEquipmentIds IS NULL OR ze.templateEquipmentIds = '') " +
           "     OR ze.templateEquipmentIds = :equipmentIds)")
    Optional<ZeroEnergy> findByTemplateAndEquipmentIds(
            @Param("templateId") Long templateId,
            @Param("equipmentIds") String equipmentIds
    );

    /**
     * Finds all ZeroEnergy items not referenced by any LotoPoint.
     *
     * @return List of orphaned ZeroEnergy entities
     */
    @Query("SELECT ze FROM ZeroEnergy ze " +
           "WHERE NOT EXISTS (SELECT 1 FROM LotoPoint lp WHERE lp.zeroEnergy = ze)")
    List<ZeroEnergy> findOrphans();

    /**
     * Deletes all ZeroEnergy items not referenced by any LotoPoint.
     *
     * @return Number of deleted items
     */
    @Modifying
    @Query("DELETE FROM ZeroEnergy ze " +
           "WHERE NOT EXISTS (SELECT 1 FROM LotoPoint lp WHERE lp.zeroEnergy = ze)")
    int deleteOrphans();
}
