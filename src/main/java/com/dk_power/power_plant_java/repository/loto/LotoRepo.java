package com.dk_power.power_plant_java.repository.loto;


import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import com.dk_power.power_plant_java.repository.base_repositories.PermitRepo;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface LotoRepo extends PermitRepo<Loto> {
    @Query("SELECT u FROM Loto u WHERE u.docNum IS NULL AND u.createdBy = ?1")
    Loto getLoto(String currentUserName);
    @Query("SELECT MAX(e.docNum) FROM Loto e")
    @Override
    Long findMaxPermitNum();
    List<Loto> findByCreatedBy(String name);
    @Query("SELECT u FROM Loto u WHERE u.docNum IS NULL AND u.createdBy = ?1")
    Loto getTempPermit(String currentUserName);


}
