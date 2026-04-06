package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.Jha;
import com.dk_power.power_plant_java.repository.base_repositories.PermitRepo;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface JhaRepo extends PermitRepo<Jha> {
    Optional<Jha> findFirstByLocalUuidOrderByIdAsc(String localUuid);
    List<Jha> findByWorkRequestId(Long workRequestId);
    boolean existsByWorkRequestId(Long workRequestId);
    boolean existsBySharepointId(String sharepointId);
    List<Jha> findAllBySharepointId(String sharepointId);
    Optional<Jha> findFirstBySharepointIdOrderByIdAsc(String sharepointId);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT j.workRequest.id FROM Jha j WHERE j.workRequest.id IN :ids AND j.deleted = false")
    Set<Long> findWorkRequestIdsWithJha(@org.springframework.data.repository.query.Param("ids") Collection<Long> ids);
}
