package com.dk_power.power_plant_java.repository.inventory;

import com.dk_power.power_plant_java.entities.inventory.InventoryItem;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;
import java.util.Optional;

public interface InventoryItemRepo extends BaseRepository<InventoryItem> {
    Optional<InventoryItem> findFirstBySharepointIdOrderByIdAsc(String sharepointId);
    Optional<InventoryItem> findFirstByLocalUuidOrderByIdAsc(String localUuid);
    Optional<InventoryItem> findFirstByQrTokenOrderByIdAsc(String qrToken);
    List<InventoryItem> findByItemType_NameIgnoreCase(String itemTypeName);
    List<InventoryItem> findByStatus_NameIgnoreCase(String statusName);
    List<InventoryItem> findByStatus_NameIn(List<String> statusNames);
    List<InventoryItem> findByItemType_NameIgnoreCaseAndStatus_NameIn(String itemTypeName, List<String> statusNames);
    boolean existsBySharepointId(String sharepointId);
    boolean existsByQrToken(String qrToken);
}
