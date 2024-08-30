package com.dk_power.power_plant_java.repository.loto;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.files.FileDtoLight;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointDtoLight;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface LotoPointRepo extends BaseRepository<LotoPoint> {
    List<LotoPoint> findByDescriptionContaining(String tag);

    LotoPoint findByOldId(String oldId);

    List<LotoPoint> findByNormPos(Value oldVal);

    List<LotoPoint> findByIsoPos(Value oldVal);

    List<LotoPoint> findByTagNumber(String tag);
    @Query("SELECT new com.dk_power.power_plant_java.dto.permits.LotoPointDtoLight(e.id,e.unit,e.tagged,e.tagNumber,e.description,e.specificLocation,e.normalPosition, e.isolatedPosition,e.oldId,e.objectType)FROM LotoPoint e")
    List<LotoPointDtoLight> getAllLight();

}
