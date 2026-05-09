package com.dk_power.power_plant_java.repository.inventory;

import com.dk_power.power_plant_java.entities.inventory.InventoryUsage;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;

import java.util.Optional;

public interface InventoryUsageRepo extends BaseRepository<InventoryUsage> {
    List<InventoryUsage> findByInventoryItem_IdOrderByScannedAtDesc(Long inventoryItemId);
    List<InventoryUsage> findByUserNameOrderByScannedAtDesc(String userName);
    List<InventoryUsage> findByEventTypeAndReturnedAtIsNullOrderByScannedAtDesc(String eventType);
    Optional<InventoryUsage> findFirstBySharepointIdOrderByIdAsc(String sharepointId);
    Optional<InventoryUsage> findFirstByLocalUuidOrderByIdAsc(String localUuid);
}
