package com.dk_power.power_plant_java.repository.loto;

import com.dk_power.power_plant_java.entities.permits.lotos.BaseLoto;
import com.dk_power.power_plant_java.entities2.loto.Loto;
import com.dk_power.power_plant_java.repository.permits.BasePermitRepo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface LotoRepo extends JpaRepository<Loto,Long> {
    @Query("SELECT u FROM Loto u WHERE u.docNum IS NULL AND u.createdBy = ?1")
    Loto getLoto(String currentUserName);
    @Query("SELECT MAX(e.docNum) FROM Loto e")
    Long findMaxPermitNum();
    List<Loto> findByCreatedBy(String name);
    @Query("SELECT u FROM Loto u WHERE u.docNum IS NULL AND u.createdBy = ?1")
    Loto getTempPermit(String currentUserName);


}
