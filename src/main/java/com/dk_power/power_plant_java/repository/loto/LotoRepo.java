package com.dk_power.power_plant_java.repository.loto;


import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import com.dk_power.power_plant_java.repository.base_repositories.PermitRepo;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface LotoRepo extends PermitRepo<Loto> {
    Optional<Loto> findFirstBySharepointIdOrderByIdAsc(String sharepointId);
    @Query("SELECT u FROM Loto u WHERE u.docNum IS NULL AND u.createdBy = ?1")
    Loto getLoto(String currentUserName);
    @Query("SELECT MAX(e.docNum) FROM Loto e")
//    @Override
    Long findMaxPermitNum();
    List<Loto> findByCreatedBy(String name);
    @Query("SELECT u FROM Loto u WHERE u.docNum IS NULL AND u.createdBy = ?1")
    Loto getTempPermit(String currentUserName);

    Optional<Loto> findByName(String name);

    @Query("SELECT l FROM Loto l WHERE l.boxNumber IS NOT NULL AND l.lotoBox IS NULL AND l.deleted = false")
    List<Loto> findUnlinkedLotosWithBoxNumber();

    @Query("SELECT l FROM Loto l WHERE l.boxNumber IS NOT NULL AND l.deleted = false " +
           "AND (l.permitStatus IS NULL OR l.permitStatus.name IN ('Building', 'Active', 'Test'))")
    List<Loto> findActiveWithBox();
}
