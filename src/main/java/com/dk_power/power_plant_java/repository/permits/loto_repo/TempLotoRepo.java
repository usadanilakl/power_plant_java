package com.dk_power.power_plant_java.repository.permits.loto_repo;

import com.dk_power.power_plant_java.entities.permits.lotos.TempLoto;
import com.dk_power.power_plant_java.repository.permits.BasePermitRepo;
import org.springframework.data.jpa.repository.Query;

public interface TempLotoRepo extends BasePermitRepo<TempLoto> {
    @Query("SELECT u FROM TempLoto u WHERE u.docNum IS NULL AND u.createdBy = ?1")
    TempLoto getTempPermit(String currentUserName);
    @Query("SELECT MAX(e.docNum) FROM TempLoto e")
    Long findMaxPermitNum();
}
