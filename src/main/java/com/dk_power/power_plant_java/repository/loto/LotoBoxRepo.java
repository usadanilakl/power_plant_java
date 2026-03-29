package com.dk_power.power_plant_java.repository.loto;

import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.loto.LotoBox;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Stream;
@Transactional
public interface LotoBoxRepo extends BaseRepository<LotoBox> {
    @Query("SELECT MAX(b.number) FROM LotoBox b")
    Integer getMaxNumber();
    LotoBox findByNumber(Integer number);

    @Query("SELECT b FROM LotoBox b WHERE b.ledStrip.espDevice.id = :espDeviceId ORDER BY b.rangeStart")
    List<LotoBox> findByEspDeviceId(Long espDeviceId);

    @Query("SELECT b FROM LotoBox b WHERE b.loto IS NULL ORDER BY b.number")
    List<LotoBox> findAvailableBoxes();
}
