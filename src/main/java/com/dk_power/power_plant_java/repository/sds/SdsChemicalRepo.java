package com.dk_power.power_plant_java.repository.sds;

import com.dk_power.power_plant_java.entities.sds.SdsChemical;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SdsChemicalRepo extends BaseRepository<SdsChemical> {
    Optional<SdsChemical> findFirstBySharepointIdOrderByIdAsc(String sharepointId);
    Optional<SdsChemical> findFirstByLocalUuidOrderByIdAsc(String localUuid);
    List<SdsChemical> findByStatus_NameIgnoreCase(String statusName);
    List<SdsChemical> findByStatus_NameIn(List<String> statusNames);
    boolean existsBySharepointId(String sharepointId);

    @Query("select max(s.bookNumber) from SdsChemical s")
    Integer findMaxBookNumber();

    @Query("select max(s.sectionNumber) from SdsChemical s where s.bookNumber = :book")
    Integer findMaxSectionInBook(@Param("book") int book);
}
