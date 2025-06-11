package com.dk_power.power_plant_java.repository.loto;

import com.dk_power.power_plant_java.dto.permits.LotoPointDtoLight;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface LotoPointRepo extends BaseRepository<LotoPoint> {
    List<LotoPoint> findByDescriptionContaining(String tag);

    LotoPoint findByOldId(String oldId);

    List<LotoPoint> findByNormPos(Value oldVal);

    List<LotoPoint> findByIsoPos(Value oldVal);

    List<LotoPoint> findByTagNumber(String tag);
    @Query("SELECT new com.dk_power.power_plant_java.dto.permits.LotoPointDtoLight(e.id,e.unit,e.tagged,e.tagNumber,e.description,e.specificLocation,e.normalPosition, e.isolatedPosition,e.oldId,e.objectType)FROM LotoPoint e")
    List<LotoPointDtoLight> getAllLight();

    List<LotoPoint> findByEquipmentListNotNull();

    List<LotoPoint> findByEquipmentListNotNullAndIsUpdatedNull();

    List<LotoPoint> findBySpecificLocationContaining(String tagNumber);

    List<LotoPoint> findByTagNumberContaining(String tagNumber);

    List<LotoPoint> findByIsProcessed(boolean isProcessed);

    List<LotoPoint> findByDataServiceItemIdIsNull();

    List<LotoPoint> findByDataServiceItemId(UUID dataServiceItemId);


    @Query("SELECT DISTINCT l.tagNumber FROM LotoPoint l WHERE " +
           "(:values IS NULL OR :values IS EMPTY OR " +
           "l.tagNumber LIKE CONCAT('%', CONCAT(REPLACE(REPLACE(REPLACE(CAST(:values AS string), '[', ''), ']', ''), ',', '%'), '%')))")
    List<String> findTagNumbersContainingAllValues(@Param("values") List<String> values);

}
