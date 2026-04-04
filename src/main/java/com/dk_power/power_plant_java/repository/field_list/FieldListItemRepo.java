package com.dk_power.power_plant_java.repository.field_list;

import com.dk_power.power_plant_java.entities.field_list.FieldListItem;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;
import java.util.Optional;

public interface FieldListItemRepo extends BaseRepository<FieldListItem> {
    Optional<FieldListItem> findFirstBySharepointIdOrderByIdAsc(String sharepointId);
    Optional<FieldListItem> findFirstByLocalUuidOrderByIdAsc(String localUuid);
    List<FieldListItem> findByListType_NameIgnoreCase(String listTypeName);
    List<FieldListItem> findByStatus_NameIgnoreCase(String statusName);
    boolean existsBySharepointId(String sharepointId);
}
