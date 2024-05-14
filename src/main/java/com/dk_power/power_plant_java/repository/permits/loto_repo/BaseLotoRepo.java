package com.dk_power.power_plant_java.repository.permits.loto_repo;

import com.dk_power.power_plant_java.entities.permits.lotos.BaseLoto;
import com.dk_power.power_plant_java.repository.permits.BasePermitRepo;
import org.springframework.data.jpa.repository.Query;

public interface BaseLotoRepo extends BasePermitRepo<BaseLoto> {
    @Query("SELECT u FROM BaseLoto u WHERE u.docNum IS NULL AND u.createdBy = ?1")
    BaseLoto getTempPermit(String currentUserName);
    @Query("SELECT MAX(e.docNum) FROM BaseLoto e")
    Long findMaxPermitNum();

}
