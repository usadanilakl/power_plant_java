package com.dk_power.power_plant_java.repository.loto;

import com.dk_power.power_plant_java.dto.permits.LotoPointDtoLight;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface LotoPointRepo extends BaseRepository<LotoPoint> {
    List<LotoPoint> findByDescriptionContaining(String tag);
    List<LotoPoint> findByDescriptionContainingAndDescriptionContaining(String one, String two);

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


//    @Query("SELECT DISTINCT l.tagNumber FROM LotoPoint l WHERE " +
//           "(:values IS NULL OR :values IS EMPTY OR " +
//           "l.tagNumber LIKE CONCAT('%', CONCAT(REPLACE(REPLACE(REPLACE(CAST(:values AS string), '[', ''), ']', ''), ',', '%'), '%')))")
//    List<String> findTagNumbersContainingAllValues(@Param("values") List<String> values);

    @Query("""
        SELECT DISTINCT lp.unit
        FROM LotoPoint lp
        WHERE
          (:and = true AND
             (:unit IS NULL OR LOWER(lp.unit) LIKE LOWER(CONCAT('%', :unit, '%')))
             AND (:tagged IS NULL OR LOWER(lp.tagged) LIKE LOWER(CONCAT('%', :tagged, '%')))
             AND (:tagNumber IS NULL OR LOWER(lp.tagNumber) LIKE LOWER(CONCAT('%', :tagNumber, '%')))
             AND (:description IS NULL OR LOWER(lp.description) LIKE LOWER(CONCAT('%', :description, '%')))
             AND (:specificLocation IS NULL OR LOWER(lp.specificLocation) LIKE LOWER(CONCAT('%', :specificLocation, '%')))
             AND (:standard IS NULL OR LOWER(lp.standard) LIKE LOWER(CONCAT('%', :standard, '%')))
             AND (:generalLocation IS NULL OR LOWER(lp.generalLocation) LIKE LOWER(CONCAT('%', :generalLocation, '%')))
             AND (:equipment IS NULL OR LOWER(lp.equipment) LIKE LOWER(CONCAT('%', :equipment, '%')))
             AND (:extraInfo IS NULL OR LOWER(lp.extraInfo) LIKE LOWER(CONCAT('%', :extraInfo, '%')))
             AND (:type IS NULL OR LOWER(lp.type) LIKE LOWER(CONCAT('%', :type, '%')))
             AND (:system IS NULL OR LOWER(lp.system) LIKE LOWER(CONCAT('%', :system, '%')))
             AND (:normalPosition IS NULL OR LOWER(lp.normalPosition) LIKE LOWER(CONCAT('%', :normalPosition, '%')))
             AND (:isolatedPosition IS NULL OR LOWER(lp.isolatedPosition) LIKE LOWER(CONCAT('%', :isolatedPosition, '%')))
             AND (:fluid IS NULL OR LOWER(lp.fluid) LIKE LOWER(CONCAT('%', :fluid, '%')))
             AND (:size IS NULL OR LOWER(lp.size) LIKE LOWER(CONCAT('%', :size, '%')))
             AND (:electricalCheckStatus IS NULL OR LOWER(lp.electricalCheckStatus) LIKE LOWER(CONCAT('%', :electricalCheckStatus, '%')))
             AND (:redTagId IS NULL OR LOWER(lp.redTagId) LIKE LOWER(CONCAT('%', :redTagId, '%')))
             AND (:oldId IS NULL OR LOWER(lp.oldId) LIKE LOWER(CONCAT('%', :oldId, '%')))
             AND (:conflictStatus IS NULL OR LOWER(lp.conflictStatus) LIKE LOWER(CONCAT('%', :conflictStatus, '%')))
             AND (:conflictId IS NULL OR LOWER(lp.conflictId) LIKE LOWER(CONCAT('%', :conflictId, '%')))
            AND (:isoPos IS NULL OR (lp.isoPos IS NOT NULL AND LOWER(lp.isoPos.name) LIKE LOWER(CONCAT('%', :isoPos, '%'))))
            AND (:normPos IS NULL OR (lp.normPos IS NOT NULL AND LOWER(lp.normPos.name) LIKE LOWER(CONCAT('%', :normPos, '%'))))
            )
          OR
          (:and = false AND
             (
               (:unit IS NOT NULL AND LOWER(lp.unit) LIKE LOWER(CONCAT('%', :unit, '%')))
               OR (:tagged IS NOT NULL AND LOWER(lp.tagged) LIKE LOWER(CONCAT('%', :tagged, '%')))
               OR (:tagNumber IS NOT NULL AND LOWER(lp.tagNumber) LIKE LOWER(CONCAT('%', :tagNumber, '%')))
               OR (:description IS NOT NULL AND LOWER(lp.description) LIKE LOWER(CONCAT('%', :description, '%')))
               OR (:specificLocation IS NOT NULL AND LOWER(lp.specificLocation) LIKE LOWER(CONCAT('%', :specificLocation, '%')))
               OR (:standard IS NOT NULL AND LOWER(lp.standard) LIKE LOWER(CONCAT('%', :standard, '%')))
               OR (:generalLocation IS NOT NULL AND LOWER(lp.generalLocation) LIKE LOWER(CONCAT('%', :generalLocation, '%')))
               OR (:equipment IS NOT NULL AND LOWER(lp.equipment) LIKE LOWER(CONCAT('%', :equipment, '%')))
               OR (:extraInfo IS NOT NULL AND LOWER(lp.extraInfo) LIKE LOWER(CONCAT('%', :extraInfo, '%')))
               OR (:type IS NOT NULL AND LOWER(lp.type) LIKE LOWER(CONCAT('%', :type, '%')))
               OR (:system IS NOT NULL AND LOWER(lp.system) LIKE LOWER(CONCAT('%', :system, '%')))
               OR (:normalPosition IS NOT NULL AND LOWER(lp.normalPosition) LIKE LOWER(CONCAT('%', :normalPosition, '%')))
               OR (:isolatedPosition IS NOT NULL AND LOWER(lp.isolatedPosition) LIKE LOWER(CONCAT('%', :isolatedPosition, '%')))
               OR (:fluid IS NOT NULL AND LOWER(lp.fluid) LIKE LOWER(CONCAT('%', :fluid, '%')))
               OR (:size IS NOT NULL AND LOWER(lp.size) LIKE LOWER(CONCAT('%', :size, '%')))
               OR (:electricalCheckStatus IS NOT NULL AND LOWER(lp.electricalCheckStatus) LIKE LOWER(CONCAT('%', :electricalCheckStatus, '%')))
               OR (:redTagId IS NOT NULL AND LOWER(lp.redTagId) LIKE LOWER(CONCAT('%', :redTagId, '%')))
               OR (:oldId IS NOT NULL AND LOWER(lp.oldId) LIKE LOWER(CONCAT('%', :oldId, '%')))
               OR (:conflictStatus IS NOT NULL AND LOWER(lp.conflictStatus) LIKE LOWER(CONCAT('%', :conflictStatus, '%')))
               OR (:conflictId IS NOT NULL AND LOWER(lp.conflictId) LIKE LOWER(CONCAT('%', :conflictId, '%')))
                OR (:isoPos IS NOT NULL AND lp.isoPos IS NOT NULL AND LOWER(lp.isoPos.name) LIKE LOWER(CONCAT('%', :isoPos, '%')))
                OR (:normPos IS NOT NULL AND lp.normPos IS NOT NULL AND LOWER(lp.normPos.name) LIKE LOWER(CONCAT('%', :normPos, '%')))
             ))
        ORDER BY lp.unit
        """)
    Page<String> findDistinctUnit(
        @Param("unit") String unit,
        @Param("tagged") String tagged,
        @Param("tagNumber") String tagNumber,
        @Param("description") String description,
        @Param("specificLocation") String specificLocation,
        @Param("standard") String standard,
        @Param("generalLocation") String generalLocation,
        @Param("equipment") String equipment,
        @Param("extraInfo") String extraInfo,
        @Param("type") String type,
        @Param("system") String system,
        @Param("normalPosition") String normalPosition,
        @Param("isolatedPosition") String isolatedPosition,
        @Param("fluid") String fluid,
        @Param("size") String size,
        @Param("electricalCheckStatus") String electricalCheckStatus,
        @Param("redTagId") String redTagId,
        @Param("oldId") String oldId,
        @Param("conflictStatus") String conflictStatus,
        @Param("conflictId") String conflictId,
        @Param("isoPos") String isoPos,
        @Param("normPos") String normPos,
        @Param("and") boolean andLogic,
        Pageable pageable
    );

    
        @Query("""
            SELECT DISTINCT lp.tagNumber
            FROM LotoPoint lp
            WHERE
              (:and = true AND
                 (:unit IS NULL OR LOWER(lp.unit) LIKE LOWER(CONCAT('%', :unit, '%')))
                 AND (:tagged IS NULL OR LOWER(lp.tagged) LIKE LOWER(CONCAT('%', :tagged, '%')))
                 AND (:tagNumber IS NULL OR LOWER(lp.tagNumber) LIKE LOWER(CONCAT('%', :tagNumber, '%')))
                 AND (:description IS NULL OR LOWER(lp.description) LIKE LOWER(CONCAT('%', :description, '%')))
                 AND (:specificLocation IS NULL OR LOWER(lp.specificLocation) LIKE LOWER(CONCAT('%', :specificLocation, '%')))
                 AND (:standard IS NULL OR LOWER(lp.standard) LIKE LOWER(CONCAT('%', :standard, '%')))
                 AND (:generalLocation IS NULL OR LOWER(lp.generalLocation) LIKE LOWER(CONCAT('%', :generalLocation, '%')))
                 AND (:equipment IS NULL OR LOWER(lp.equipment) LIKE LOWER(CONCAT('%', :equipment, '%')))
                 AND (:extraInfo IS NULL OR LOWER(lp.extraInfo) LIKE LOWER(CONCAT('%', :extraInfo, '%')))
                 AND (:type IS NULL OR LOWER(lp.type) LIKE LOWER(CONCAT('%', :type, '%')))
                 AND (:system IS NULL OR LOWER(lp.system) LIKE LOWER(CONCAT('%', :system, '%')))
                 AND (:normalPosition IS NULL OR LOWER(lp.normalPosition) LIKE LOWER(CONCAT('%', :normalPosition, '%')))
                 AND (:isolatedPosition IS NULL OR LOWER(lp.isolatedPosition) LIKE LOWER(CONCAT('%', :isolatedPosition, '%')))
                 AND (:fluid IS NULL OR LOWER(lp.fluid) LIKE LOWER(CONCAT('%', :fluid, '%')))
                 AND (:size IS NULL OR LOWER(lp.size) LIKE LOWER(CONCAT('%', :size, '%')))
                 AND (:electricalCheckStatus IS NULL OR LOWER(lp.electricalCheckStatus) LIKE LOWER(CONCAT('%', :electricalCheckStatus, '%')))
                 AND (:redTagId IS NULL OR LOWER(lp.redTagId) LIKE LOWER(CONCAT('%', :redTagId, '%')))
                 AND (:oldId IS NULL OR LOWER(lp.oldId) LIKE LOWER(CONCAT('%', :oldId, '%')))
                 AND (:conflictStatus IS NULL OR LOWER(lp.conflictStatus) LIKE LOWER(CONCAT('%', :conflictStatus, '%')))
                 AND (:conflictId IS NULL OR LOWER(lp.conflictId) LIKE LOWER(CONCAT('%', :conflictId, '%')))
                AND (:isoPos IS NULL OR (lp.isoPos IS NOT NULL AND LOWER(lp.isoPos.name) LIKE LOWER(CONCAT('%', :isoPos, '%'))))
                AND (:normPos IS NULL OR (lp.normPos IS NOT NULL AND LOWER(lp.normPos.name) LIKE LOWER(CONCAT('%', :normPos, '%'))))
                )
              OR
              (:and = false AND
                 (
                   (:unit IS NOT NULL AND LOWER(lp.unit) LIKE LOWER(CONCAT('%', :unit, '%')))
                   OR (:tagged IS NOT NULL AND LOWER(lp.tagged) LIKE LOWER(CONCAT('%', :tagged, '%')))
                   OR (:tagNumber IS NOT NULL AND LOWER(lp.tagNumber) LIKE LOWER(CONCAT('%', :tagNumber, '%')))
                   OR (:description IS NOT NULL AND LOWER(lp.description) LIKE LOWER(CONCAT('%', :description, '%')))
                   OR (:specificLocation IS NOT NULL AND LOWER(lp.specificLocation) LIKE LOWER(CONCAT('%', :specificLocation, '%')))
                   OR (:standard IS NOT NULL AND LOWER(lp.standard) LIKE LOWER(CONCAT('%', :standard, '%')))
                   OR (:generalLocation IS NOT NULL AND LOWER(lp.generalLocation) LIKE LOWER(CONCAT('%', :generalLocation, '%')))
                   OR (:equipment IS NOT NULL AND LOWER(lp.equipment) LIKE LOWER(CONCAT('%', :equipment, '%')))
                   OR (:extraInfo IS NOT NULL AND LOWER(lp.extraInfo) LIKE LOWER(CONCAT('%', :extraInfo, '%')))
                   OR (:type IS NOT NULL AND LOWER(lp.type) LIKE LOWER(CONCAT('%', :type, '%')))
                   OR (:system IS NOT NULL AND LOWER(lp.system) LIKE LOWER(CONCAT('%', :system, '%')))
                   OR (:normalPosition IS NOT NULL AND LOWER(lp.normalPosition) LIKE LOWER(CONCAT('%', :normalPosition, '%')))
                   OR (:isolatedPosition IS NOT NULL AND LOWER(lp.isolatedPosition) LIKE LOWER(CONCAT('%', :isolatedPosition, '%')))
                   OR (:fluid IS NOT NULL AND LOWER(lp.fluid) LIKE LOWER(CONCAT('%', :fluid, '%')))
                   OR (:size IS NOT NULL AND LOWER(lp.size) LIKE LOWER(CONCAT('%', :size, '%')))
                   OR (:electricalCheckStatus IS NOT NULL AND LOWER(lp.electricalCheckStatus) LIKE LOWER(CONCAT('%', :electricalCheckStatus, '%')))
                   OR (:redTagId IS NOT NULL AND LOWER(lp.redTagId) LIKE LOWER(CONCAT('%', :redTagId, '%')))
                   OR (:oldId IS NOT NULL AND LOWER(lp.oldId) LIKE LOWER(CONCAT('%', :oldId, '%')))
                   OR (:conflictStatus IS NOT NULL AND LOWER(lp.conflictStatus) LIKE LOWER(CONCAT('%', :conflictStatus, '%')))
                   OR (:conflictId IS NOT NULL AND LOWER(lp.conflictId) LIKE LOWER(CONCAT('%', :conflictId, '%')))
                OR (:isoPos IS NOT NULL AND lp.isoPos IS NOT NULL AND LOWER(lp.isoPos.name) LIKE LOWER(CONCAT('%', :isoPos, '%')))
                OR (:normPos IS NOT NULL AND lp.normPos IS NOT NULL AND LOWER(lp.normPos.name) LIKE LOWER(CONCAT('%', :normPos, '%')))
                 ))
            ORDER BY lp.tagNumber
            """)
        Page<String> findDistinctTagNumber(
            @Param("unit") String unit,
            @Param("tagged") String tagged,
            @Param("tagNumber") String tagNumber,
            @Param("description") String description,
            @Param("specificLocation") String specificLocation,
            @Param("standard") String standard,
            @Param("generalLocation") String generalLocation,
            @Param("equipment") String equipment,
            @Param("extraInfo") String extraInfo,
            @Param("type") String type,
            @Param("system") String system,
            @Param("normalPosition") String normalPosition,
            @Param("isolatedPosition") String isolatedPosition,
            @Param("fluid") String fluid,
            @Param("size") String size,
            @Param("electricalCheckStatus") String electricalCheckStatus,
            @Param("redTagId") String redTagId,
            @Param("oldId") String oldId,
            @Param("conflictStatus") String conflictStatus,
            @Param("conflictId") String conflictId,
            @Param("isoPos") String isoPos,
            @Param("normPos") String normPos,
            @Param("and") boolean andLogic,
            Pageable pageable
        );

        
        @Query("""
            SELECT DISTINCT COALESCE(lp.isoPos.name, '')
            FROM LotoPoint lp
            WHERE
              (:and = true AND
                 (:unit IS NULL OR LOWER(lp.unit) LIKE LOWER(CONCAT('%', :unit, '%')))
                 AND (:tagged IS NULL OR LOWER(lp.tagged) LIKE LOWER(CONCAT('%', :tagged, '%')))
                 AND (:tagNumber IS NULL OR LOWER(lp.tagNumber) LIKE LOWER(CONCAT('%', :tagNumber, '%')))
                 AND (:description IS NULL OR LOWER(lp.description) LIKE LOWER(CONCAT('%', :description, '%')))
                 AND (:specificLocation IS NULL OR LOWER(lp.specificLocation) LIKE LOWER(CONCAT('%', :specificLocation, '%')))
                 AND (:standard IS NULL OR LOWER(lp.standard) LIKE LOWER(CONCAT('%', :standard, '%')))
                 AND (:generalLocation IS NULL OR LOWER(lp.generalLocation) LIKE LOWER(CONCAT('%', :generalLocation, '%')))
                 AND (:equipment IS NULL OR LOWER(lp.equipment) LIKE LOWER(CONCAT('%', :equipment, '%')))
                 AND (:extraInfo IS NULL OR LOWER(lp.extraInfo) LIKE LOWER(CONCAT('%', :extraInfo, '%')))
                 AND (:type IS NULL OR LOWER(lp.type) LIKE LOWER(CONCAT('%', :type, '%')))
                 AND (:system IS NULL OR LOWER(lp.system) LIKE LOWER(CONCAT('%', :system, '%')))
                 AND (:normalPosition IS NULL OR LOWER(lp.normalPosition) LIKE LOWER(CONCAT('%', :normalPosition, '%')))
                 AND (:isolatedPosition IS NULL OR LOWER(lp.isolatedPosition) LIKE LOWER(CONCAT('%', :isolatedPosition, '%')))
                 AND (:fluid IS NULL OR LOWER(lp.fluid) LIKE LOWER(CONCAT('%', :fluid, '%')))
                 AND (:size IS NULL OR LOWER(lp.size) LIKE LOWER(CONCAT('%', :size, '%')))
                 AND (:electricalCheckStatus IS NULL OR LOWER(lp.electricalCheckStatus) LIKE LOWER(CONCAT('%', :electricalCheckStatus, '%')))
                 AND (:redTagId IS NULL OR LOWER(lp.redTagId) LIKE LOWER(CONCAT('%', :redTagId, '%')))
                 AND (:oldId IS NULL OR LOWER(lp.oldId) LIKE LOWER(CONCAT('%', :oldId, '%')))
                 AND (:conflictStatus IS NULL OR LOWER(lp.conflictStatus) LIKE LOWER(CONCAT('%', :conflictStatus, '%')))
                 AND (:conflictId IS NULL OR LOWER(lp.conflictId) LIKE LOWER(CONCAT('%', :conflictId, '%')))
                AND (:isoPos IS NULL OR (lp.isoPos IS NOT NULL AND LOWER(lp.isoPos.name) LIKE LOWER(CONCAT('%', :isoPos, '%'))))
                AND (:normPos IS NULL OR (lp.normPos IS NOT NULL AND LOWER(lp.normPos.name) LIKE LOWER(CONCAT('%', :normPos, '%'))))
                )
              OR
              (:and = false AND
                 (
                   (:unit IS NOT NULL AND LOWER(lp.unit) LIKE LOWER(CONCAT('%', :unit, '%')))
                   OR (:tagged IS NOT NULL AND LOWER(lp.tagged) LIKE LOWER(CONCAT('%', :tagged, '%')))
                   OR (:tagNumber IS NOT NULL AND LOWER(lp.tagNumber) LIKE LOWER(CONCAT('%', :tagNumber, '%')))
                   OR (:description IS NOT NULL AND LOWER(lp.description) LIKE LOWER(CONCAT('%', :description, '%')))
                   OR (:specificLocation IS NOT NULL AND LOWER(lp.specificLocation) LIKE LOWER(CONCAT('%', :specificLocation, '%')))
                   OR (:standard IS NOT NULL AND LOWER(lp.standard) LIKE LOWER(CONCAT('%', :standard, '%')))
                   OR (:generalLocation IS NOT NULL AND LOWER(lp.generalLocation) LIKE LOWER(CONCAT('%', :generalLocation, '%')))
                   OR (:equipment IS NOT NULL AND LOWER(lp.equipment) LIKE LOWER(CONCAT('%', :equipment, '%')))
                   OR (:extraInfo IS NOT NULL AND LOWER(lp.extraInfo) LIKE LOWER(CONCAT('%', :extraInfo, '%')))
                   OR (:type IS NOT NULL AND LOWER(lp.type) LIKE LOWER(CONCAT('%', :type, '%')))
                   OR (:system IS NOT NULL AND LOWER(lp.system) LIKE LOWER(CONCAT('%', :system, '%')))
                   OR (:normalPosition IS NOT NULL AND LOWER(lp.normalPosition) LIKE LOWER(CONCAT('%', :normalPosition, '%')))
                   OR (:isolatedPosition IS NOT NULL AND LOWER(lp.isolatedPosition) LIKE LOWER(CONCAT('%', :isolatedPosition, '%')))
                   OR (:fluid IS NOT NULL AND LOWER(lp.fluid) LIKE LOWER(CONCAT('%', :fluid, '%')))
                   OR (:size IS NOT NULL AND LOWER(lp.size) LIKE LOWER(CONCAT('%', :size, '%')))
                   OR (:electricalCheckStatus IS NOT NULL AND LOWER(lp.electricalCheckStatus) LIKE LOWER(CONCAT('%', :electricalCheckStatus, '%')))
                   OR (:redTagId IS NOT NULL AND LOWER(lp.redTagId) LIKE LOWER(CONCAT('%', :redTagId, '%')))
                   OR (:oldId IS NOT NULL AND LOWER(lp.oldId) LIKE LOWER(CONCAT('%', :oldId, '%')))
                   OR (:conflictStatus IS NOT NULL AND LOWER(lp.conflictStatus) LIKE LOWER(CONCAT('%', :conflictStatus, '%')))
                   OR (:conflictId IS NOT NULL AND LOWER(lp.conflictId) LIKE LOWER(CONCAT('%', :conflictId, '%')))
                OR (:isoPos IS NOT NULL AND lp.isoPos IS NOT NULL AND LOWER(lp.isoPos.name) LIKE LOWER(CONCAT('%', :isoPos, '%')))
                OR (:normPos IS NOT NULL AND lp.normPos IS NOT NULL AND LOWER(lp.normPos.name) LIKE LOWER(CONCAT('%', :normPos, '%')))
                 ))
            ORDER BY COALESCE(lp.isoPos.name, '')
            """)
        Page<String> findDistinctIsoPos(
            @Param("unit") String unit,
            @Param("tagged") String tagged,
            @Param("tagNumber") String tagNumber,
            @Param("description") String description,
            @Param("specificLocation") String specificLocation,
            @Param("standard") String standard,
            @Param("generalLocation") String generalLocation,
            @Param("equipment") String equipment,
            @Param("extraInfo") String extraInfo,
            @Param("type") String type,
            @Param("system") String system,
            @Param("normalPosition") String normalPosition,
            @Param("isolatedPosition") String isolatedPosition,
            @Param("fluid") String fluid,
            @Param("size") String size,
            @Param("electricalCheckStatus") String electricalCheckStatus,
            @Param("redTagId") String redTagId,
            @Param("oldId") String oldId,
            @Param("conflictStatus") String conflictStatus,
            @Param("conflictId") String conflictId,
            @Param("isoPos") String isoPos,
            @Param("normPos") String normPos,
            @Param("and") boolean andLogic,
            Pageable pageable
        );


    @Query("""
            SELECT DISTINCT COALESCE(lp.normPos.name, '')
            FROM LotoPoint lp
            WHERE
              (:and = true AND
                 (:unit IS NULL OR LOWER(lp.unit) LIKE LOWER(CONCAT('%', :unit, '%')))
                 AND (:tagged IS NULL OR LOWER(lp.tagged) LIKE LOWER(CONCAT('%', :tagged, '%')))
                 AND (:tagNumber IS NULL OR LOWER(lp.tagNumber) LIKE LOWER(CONCAT('%', :tagNumber, '%')))
                 AND (:description IS NULL OR LOWER(lp.description) LIKE LOWER(CONCAT('%', :description, '%')))
                 AND (:specificLocation IS NULL OR LOWER(lp.specificLocation) LIKE LOWER(CONCAT('%', :specificLocation, '%')))
                 AND (:standard IS NULL OR LOWER(lp.standard) LIKE LOWER(CONCAT('%', :standard, '%')))
                 AND (:generalLocation IS NULL OR LOWER(lp.generalLocation) LIKE LOWER(CONCAT('%', :generalLocation, '%')))
                 AND (:equipment IS NULL OR LOWER(lp.equipment) LIKE LOWER(CONCAT('%', :equipment, '%')))
                 AND (:extraInfo IS NULL OR LOWER(lp.extraInfo) LIKE LOWER(CONCAT('%', :extraInfo, '%')))
                 AND (:type IS NULL OR LOWER(lp.type) LIKE LOWER(CONCAT('%', :type, '%')))
                 AND (:system IS NULL OR LOWER(lp.system) LIKE LOWER(CONCAT('%', :system, '%')))
                 AND (:normalPosition IS NULL OR LOWER(lp.normalPosition) LIKE LOWER(CONCAT('%', :normalPosition, '%')))
                 AND (:isolatedPosition IS NULL OR LOWER(lp.isolatedPosition) LIKE LOWER(CONCAT('%', :isolatedPosition, '%')))
                 AND (:fluid IS NULL OR LOWER(lp.fluid) LIKE LOWER(CONCAT('%', :fluid, '%')))
                 AND (:size IS NULL OR LOWER(lp.size) LIKE LOWER(CONCAT('%', :size, '%')))
                 AND (:electricalCheckStatus IS NULL OR LOWER(lp.electricalCheckStatus) LIKE LOWER(CONCAT('%', :electricalCheckStatus, '%')))
                 AND (:redTagId IS NULL OR LOWER(lp.redTagId) LIKE LOWER(CONCAT('%', :redTagId, '%')))
                 AND (:oldId IS NULL OR LOWER(lp.oldId) LIKE LOWER(CONCAT('%', :oldId, '%')))
                 AND (:conflictStatus IS NULL OR LOWER(lp.conflictStatus) LIKE LOWER(CONCAT('%', :conflictStatus, '%')))
                 AND (:conflictId IS NULL OR LOWER(lp.conflictId) LIKE LOWER(CONCAT('%', :conflictId, '%')))
                AND (:isoPos IS NULL OR (lp.isoPos IS NOT NULL AND LOWER(lp.isoPos.name) LIKE LOWER(CONCAT('%', :isoPos, '%'))))
                AND (:normPos IS NULL OR (lp.normPos IS NOT NULL AND LOWER(lp.normPos.name) LIKE LOWER(CONCAT('%', :normPos, '%'))))
                )
              OR
              (:and = false AND
                 (
                   (:unit IS NOT NULL AND LOWER(lp.unit) LIKE LOWER(CONCAT('%', :unit, '%')))
                   OR (:tagged IS NOT NULL AND LOWER(lp.tagged) LIKE LOWER(CONCAT('%', :tagged, '%')))
                   OR (:tagNumber IS NOT NULL AND LOWER(lp.tagNumber) LIKE LOWER(CONCAT('%', :tagNumber, '%')))
                   OR (:description IS NOT NULL AND LOWER(lp.description) LIKE LOWER(CONCAT('%', :description, '%')))
                   OR (:specificLocation IS NOT NULL AND LOWER(lp.specificLocation) LIKE LOWER(CONCAT('%', :specificLocation, '%')))
                   OR (:standard IS NOT NULL AND LOWER(lp.standard) LIKE LOWER(CONCAT('%', :standard, '%')))
                   OR (:generalLocation IS NOT NULL AND LOWER(lp.generalLocation) LIKE LOWER(CONCAT('%', :generalLocation, '%')))
                   OR (:equipment IS NOT NULL AND LOWER(lp.equipment) LIKE LOWER(CONCAT('%', :equipment, '%')))
                   OR (:extraInfo IS NOT NULL AND LOWER(lp.extraInfo) LIKE LOWER(CONCAT('%', :extraInfo, '%')))
                   OR (:type IS NOT NULL AND LOWER(lp.type) LIKE LOWER(CONCAT('%', :type, '%')))
                   OR (:system IS NOT NULL AND LOWER(lp.system) LIKE LOWER(CONCAT('%', :system, '%')))
                   OR (:normalPosition IS NOT NULL AND LOWER(lp.normalPosition) LIKE LOWER(CONCAT('%', :normalPosition, '%')))
                   OR (:isolatedPosition IS NOT NULL AND LOWER(lp.isolatedPosition) LIKE LOWER(CONCAT('%', :isolatedPosition, '%')))
                   OR (:fluid IS NOT NULL AND LOWER(lp.fluid) LIKE LOWER(CONCAT('%', :fluid, '%')))
                   OR (:size IS NOT NULL AND LOWER(lp.size) LIKE LOWER(CONCAT('%', :size, '%')))
                   OR (:electricalCheckStatus IS NOT NULL AND LOWER(lp.electricalCheckStatus) LIKE LOWER(CONCAT('%', :electricalCheckStatus, '%')))
                   OR (:redTagId IS NOT NULL AND LOWER(lp.redTagId) LIKE LOWER(CONCAT('%', :redTagId, '%')))
                   OR (:oldId IS NOT NULL AND LOWER(lp.oldId) LIKE LOWER(CONCAT('%', :oldId, '%')))
                   OR (:conflictStatus IS NOT NULL AND LOWER(lp.conflictStatus) LIKE LOWER(CONCAT('%', :conflictStatus, '%')))
                   OR (:conflictId IS NOT NULL AND LOWER(lp.conflictId) LIKE LOWER(CONCAT('%', :conflictId, '%')))
                OR (:isoPos IS NOT NULL AND lp.isoPos IS NOT NULL AND LOWER(lp.isoPos.name) LIKE LOWER(CONCAT('%', :isoPos, '%')))
                OR (:normPos IS NOT NULL AND lp.normPos IS NOT NULL AND LOWER(lp.normPos.name) LIKE LOWER(CONCAT('%', :normPos, '%')))
                 ))
            ORDER BY COALESCE(lp.normPos.name, '')
            """)
    Page<String> findDistinctNormPos(
            @Param("unit") String unit,
            @Param("tagged") String tagged,
            @Param("tagNumber") String tagNumber,
            @Param("description") String description,
            @Param("specificLocation") String specificLocation,
            @Param("standard") String standard,
            @Param("generalLocation") String generalLocation,
            @Param("equipment") String equipment,
            @Param("extraInfo") String extraInfo,
            @Param("type") String type,
            @Param("system") String system,
            @Param("normalPosition") String normalPosition,
            @Param("isolatedPosition") String isolatedPosition,
            @Param("fluid") String fluid,
            @Param("size") String size,
            @Param("electricalCheckStatus") String electricalCheckStatus,
            @Param("redTagId") String redTagId,
            @Param("oldId") String oldId,
            @Param("conflictStatus") String conflictStatus,
            @Param("conflictId") String conflictId,
            @Param("isoPos") String isoPos,
            @Param("normPos") String normPos,
            @Param("and") boolean andLogic,
            Pageable pageable
    );


    // @Query("""
    //     SELECT DISTINCT lp.description
    //     FROM LotoPoint lp
    //     WHERE
    //       (:and = true AND
    //          (:unit IS NULL OR LOWER(lp.unit) LIKE LOWER(CONCAT('%', :unit, '%')))
    //          AND (:tagged IS NULL OR LOWER(lp.tagged) LIKE LOWER(CONCAT('%', :tagged, '%')))
    //          AND (:tagNumber IS NULL OR LOWER(lp.tagNumber) LIKE LOWER(CONCAT('%', :tagNumber, '%')))
    //          AND (
    //            :description IS NULL OR 
    //            (
    //              LOWER(lp.description) LIKE LOWER(CONCAT('%', :descriptionWord1, '%'))
    //              AND LOWER(lp.description) LIKE LOWER(CONCAT('%', :descriptionWord2, '%'))
    //              AND LOWER(lp.description) LIKE LOWER(CONCAT('%', :descriptionWord3, '%'))
    //              AND LOWER(lp.description) LIKE LOWER(CONCAT('%', :descriptionWord4, '%'))
    //              AND LOWER(lp.description) LIKE LOWER(CONCAT('%', :descriptionWord5, '%'))
    //            )
    //          )
    //          AND (:specificLocation IS NULL OR LOWER(lp.specificLocation) LIKE LOWER(CONCAT('%', :specificLocation, '%')))
    //          AND (:standard IS NULL OR LOWER(lp.standard) LIKE LOWER(CONCAT('%', :standard, '%')))
    //          AND (:generalLocation IS NULL OR LOWER(lp.generalLocation) LIKE LOWER(CONCAT('%', :generalLocation, '%')))
    //          AND (:equipment IS NULL OR LOWER(lp.equipment) LIKE LOWER(CONCAT('%', :equipment, '%')))
    //          AND (:extraInfo IS NULL OR LOWER(lp.extraInfo) LIKE LOWER(CONCAT('%', :extraInfo, '%')))
    //          AND (:type IS NULL OR LOWER(lp.type) LIKE LOWER(CONCAT('%', :type, '%')))
    //          AND (:system IS NULL OR LOWER(lp.system) LIKE LOWER(CONCAT('%', :system, '%')))
    //          AND (:normalPosition IS NULL OR LOWER(lp.normalPosition) LIKE LOWER(CONCAT('%', :normalPosition, '%')))
    //          AND (:isolatedPosition IS NULL OR LOWER(lp.isolatedPosition) LIKE LOWER(CONCAT('%', :isolatedPosition, '%')))
    //          AND (:fluid IS NULL OR LOWER(lp.fluid) LIKE LOWER(CONCAT('%', :fluid, '%')))
    //          AND (:size IS NULL OR LOWER(lp.size) LIKE LOWER(CONCAT('%', :size, '%')))
    //          AND (:electricalCheckStatus IS NULL OR LOWER(lp.electricalCheckStatus) LIKE LOWER(CONCAT('%', :electricalCheckStatus, '%')))
    //          AND (:redTagId IS NULL OR LOWER(lp.redTagId) LIKE LOWER(CONCAT('%', :redTagId, '%')))
    //          AND (:oldId IS NULL OR LOWER(lp.oldId) LIKE LOWER(CONCAT('%', :oldId, '%')))
    //          AND (:conflictStatus IS NULL OR LOWER(lp.conflictStatus) LIKE LOWER(CONCAT('%', :conflictStatus, '%')))
    //          AND (:conflictId IS NULL OR LOWER(lp.conflictId) LIKE LOWER(CONCAT('%', :conflictId, '%')))
    //         AND (:isoPos IS NULL OR (lp.isoPos IS NOT NULL AND LOWER(lp.isoPos.name) LIKE LOWER(CONCAT('%', :isoPos, '%'))))
    //         AND (:normPos IS NULL OR (lp.normPos IS NOT NULL AND LOWER(lp.normPos.name) LIKE LOWER(CONCAT('%', :normPos, '%'))))
    //         )
    //       OR
    //       (:and = false AND
    //          (
    //            (:unit IS NOT NULL AND LOWER(lp.unit) LIKE LOWER(CONCAT('%', :unit, '%')))
    //            OR (:tagged IS NOT NULL AND LOWER(lp.tagged) LIKE LOWER(CONCAT('%', :tagged, '%')))
    //            OR (:tagNumber IS NOT NULL AND LOWER(lp.tagNumber) LIKE LOWER(CONCAT('%', :tagNumber, '%')))
    //            OR (
    //              :description IS NOT NULL AND 
    //              (
    //                LOWER(lp.description) LIKE LOWER(CONCAT('%', :descriptionWord1, '%'))
    //                AND LOWER(lp.description) LIKE LOWER(CONCAT('%', :descriptionWord2, '%'))
    //                AND LOWER(lp.description) LIKE LOWER(CONCAT('%', :descriptionWord3, '%'))
    //                AND LOWER(lp.description) LIKE LOWER(CONCAT('%', :descriptionWord4, '%'))
    //                AND LOWER(lp.description) LIKE LOWER(CONCAT('%', :descriptionWord5, '%'))
    //              )
    //            )
    //            OR (:specificLocation IS NOT NULL AND LOWER(lp.specificLocation) LIKE LOWER(CONCAT('%', :specificLocation, '%')))
    //            OR (:standard IS NOT NULL AND LOWER(lp.standard) LIKE LOWER(CONCAT('%', :standard, '%')))
    //            OR (:generalLocation IS NOT NULL AND LOWER(lp.generalLocation) LIKE LOWER(CONCAT('%', :generalLocation, '%')))
    //            OR (:equipment IS NOT NULL AND LOWER(lp.equipment) LIKE LOWER(CONCAT('%', :equipment, '%')))
    //            OR (:extraInfo IS NOT NULL AND LOWER(lp.extraInfo) LIKE LOWER(CONCAT('%', :extraInfo, '%')))
    //            OR (:type IS NOT NULL AND LOWER(lp.type) LIKE LOWER(CONCAT('%', :type, '%')))
    //            OR (:system IS NOT NULL AND LOWER(lp.system) LIKE LOWER(CONCAT('%', :system, '%')))
    //            OR (:normalPosition IS NOT NULL AND LOWER(lp.normalPosition) LIKE LOWER(CONCAT('%', :normalPosition, '%')))
    //            OR (:isolatedPosition IS NOT NULL AND LOWER(lp.isolatedPosition) LIKE LOWER(CONCAT('%', :isolatedPosition, '%')))
    //            OR (:fluid IS NOT NULL AND LOWER(lp.fluid) LIKE LOWER(CONCAT('%', :fluid, '%')))
    //            OR (:size IS NOT NULL AND LOWER(lp.size) LIKE LOWER(CONCAT('%', :size, '%')))
    //            OR (:electricalCheckStatus IS NOT NULL AND LOWER(lp.electricalCheckStatus) LIKE LOWER(CONCAT('%', :electricalCheckStatus, '%')))
    //            OR (:redTagId IS NOT NULL AND LOWER(lp.redTagId) LIKE LOWER(CONCAT('%', :redTagId, '%')))
    //            OR (:oldId IS NOT NULL AND LOWER(lp.oldId) LIKE LOWER(CONCAT('%', :oldId, '%')))
    //            OR (:conflictStatus IS NOT NULL AND LOWER(lp.conflictStatus) LIKE LOWER(CONCAT('%', :conflictStatus, '%')))
    //            OR (:conflictId IS NOT NULL AND LOWER(lp.conflictId) LIKE LOWER(CONCAT('%', :conflictId, '%')))
    //         OR (:isoPos IS NOT NULL AND lp.isoPos IS NOT NULL AND LOWER(lp.isoPos.name) LIKE LOWER(CONCAT('%', :isoPos, '%')))
    //         OR (:normPos IS NOT NULL AND lp.normPos IS NOT NULL AND LOWER(lp.normPos.name) LIKE LOWER(CONCAT('%', :normPos, '%')))
    //          ))
    //     ORDER BY lp.description
    //     """)
    // Page<String> findDistinctDescription(
    //     @Param("unit") String unit,
    //     @Param("tagged") String tagged,
    //     @Param("tagNumber") String tagNumber,
    //     @Param("description") String description,
    //     @Param("descriptionWord1") String descriptionWord1,
    //     @Param("descriptionWord2") String descriptionWord2,
    //     @Param("descriptionWord3") String descriptionWord3,
    //     @Param("descriptionWord4") String descriptionWord4,
    //     @Param("descriptionWord5") String descriptionWord5,
    //     @Param("specificLocation") String specificLocation,
    //     @Param("standard") String standard,
    //     @Param("generalLocation") String generalLocation,
    //     @Param("equipment") String equipment,
    //     @Param("extraInfo") String extraInfo,
    //     @Param("type") String type,
    //     @Param("system") String system,
    //     @Param("normalPosition") String normalPosition,
    //     @Param("isolatedPosition") String isolatedPosition,
    //     @Param("fluid") String fluid,
    //     @Param("size") String size,
    //     @Param("electricalCheckStatus") String electricalCheckStatus,
    //     @Param("redTagId") String redTagId,
    //     @Param("oldId") String oldId,
    //     @Param("conflictStatus") String conflictStatus,
    //     @Param("conflictId") String conflictId,
    //     @Param("isoPos") String isoPos,
    //     @Param("normPos") String normPos,
    //     @Param("and") boolean andLogic,
    //     Pageable pageable
    // );

    
        @Query("""
            SELECT DISTINCT lp.description
            FROM LotoPoint lp
            WHERE
              (:and = true AND
                 (:unit IS NULL OR LOWER(lp.unit) LIKE LOWER(CONCAT('%', :unit, '%')))
                 AND (:tagged IS NULL OR LOWER(lp.tagged) LIKE LOWER(CONCAT('%', :tagged, '%')))
                 AND (:tagNumber IS NULL OR LOWER(lp.tagNumber) LIKE LOWER(CONCAT('%', :tagNumber, '%')))
                 AND (:description IS NULL OR LOWER(lp.description) LIKE LOWER(CONCAT('%', :description, '%')))
                 AND (:specificLocation IS NULL OR LOWER(lp.specificLocation) LIKE LOWER(CONCAT('%', :specificLocation, '%')))
                 AND (:standard IS NULL OR LOWER(lp.standard) LIKE LOWER(CONCAT('%', :standard, '%')))
                 AND (:generalLocation IS NULL OR LOWER(lp.generalLocation) LIKE LOWER(CONCAT('%', :generalLocation, '%')))
                 AND (:equipment IS NULL OR LOWER(lp.equipment) LIKE LOWER(CONCAT('%', :equipment, '%')))
                 AND (:extraInfo IS NULL OR LOWER(lp.extraInfo) LIKE LOWER(CONCAT('%', :extraInfo, '%')))
                 AND (:type IS NULL OR LOWER(lp.type) LIKE LOWER(CONCAT('%', :type, '%')))
                 AND (:system IS NULL OR LOWER(lp.system) LIKE LOWER(CONCAT('%', :system, '%')))
                 AND (:normalPosition IS NULL OR LOWER(lp.normalPosition) LIKE LOWER(CONCAT('%', :normalPosition, '%')))
                 AND (:isolatedPosition IS NULL OR LOWER(lp.isolatedPosition) LIKE LOWER(CONCAT('%', :isolatedPosition, '%')))
                 AND (:fluid IS NULL OR LOWER(lp.fluid) LIKE LOWER(CONCAT('%', :fluid, '%')))
                 AND (:size IS NULL OR LOWER(lp.size) LIKE LOWER(CONCAT('%', :size, '%')))
                 AND (:electricalCheckStatus IS NULL OR LOWER(lp.electricalCheckStatus) LIKE LOWER(CONCAT('%', :electricalCheckStatus, '%')))
                 AND (:redTagId IS NULL OR LOWER(lp.redTagId) LIKE LOWER(CONCAT('%', :redTagId, '%')))
                 AND (:oldId IS NULL OR LOWER(lp.oldId) LIKE LOWER(CONCAT('%', :oldId, '%')))
                 AND (:conflictStatus IS NULL OR LOWER(lp.conflictStatus) LIKE LOWER(CONCAT('%', :conflictStatus, '%')))
                 AND (:conflictId IS NULL OR LOWER(lp.conflictId) LIKE LOWER(CONCAT('%', :conflictId, '%')))
                AND (:isoPos IS NULL OR (lp.isoPos IS NOT NULL AND LOWER(lp.isoPos.name) LIKE LOWER(CONCAT('%', :isoPos, '%'))))
                AND (:normPos IS NULL OR (lp.normPos IS NOT NULL AND LOWER(lp.normPos.name) LIKE LOWER(CONCAT('%', :normPos, '%'))))
                )
              OR
              (:and = false AND
                 (
                   (:unit IS NOT NULL AND LOWER(lp.unit) LIKE LOWER(CONCAT('%', :unit, '%')))
                   OR (:tagged IS NOT NULL AND LOWER(lp.tagged) LIKE LOWER(CONCAT('%', :tagged, '%')))
                   OR (:tagNumber IS NOT NULL AND LOWER(lp.tagNumber) LIKE LOWER(CONCAT('%', :tagNumber, '%')))
                   OR (:description IS NOT NULL AND LOWER(lp.description) LIKE LOWER(CONCAT('%', :description, '%')))
                   OR (:specificLocation IS NOT NULL AND LOWER(lp.specificLocation) LIKE LOWER(CONCAT('%', :specificLocation, '%')))
                   OR (:standard IS NOT NULL AND LOWER(lp.standard) LIKE LOWER(CONCAT('%', :standard, '%')))
                   OR (:generalLocation IS NOT NULL AND LOWER(lp.generalLocation) LIKE LOWER(CONCAT('%', :generalLocation, '%')))
                   OR (:equipment IS NOT NULL AND LOWER(lp.equipment) LIKE LOWER(CONCAT('%', :equipment, '%')))
                   OR (:extraInfo IS NOT NULL AND LOWER(lp.extraInfo) LIKE LOWER(CONCAT('%', :extraInfo, '%')))
                   OR (:type IS NOT NULL AND LOWER(lp.type) LIKE LOWER(CONCAT('%', :type, '%')))
                   OR (:system IS NOT NULL AND LOWER(lp.system) LIKE LOWER(CONCAT('%', :system, '%')))
                   OR (:normalPosition IS NOT NULL AND LOWER(lp.normalPosition) LIKE LOWER(CONCAT('%', :normalPosition, '%')))
                   OR (:isolatedPosition IS NOT NULL AND LOWER(lp.isolatedPosition) LIKE LOWER(CONCAT('%', :isolatedPosition, '%')))
                   OR (:fluid IS NOT NULL AND LOWER(lp.fluid) LIKE LOWER(CONCAT('%', :fluid, '%')))
                   OR (:size IS NOT NULL AND LOWER(lp.size) LIKE LOWER(CONCAT('%', :size, '%')))
                   OR (:electricalCheckStatus IS NOT NULL AND LOWER(lp.electricalCheckStatus) LIKE LOWER(CONCAT('%', :electricalCheckStatus, '%')))
                   OR (:redTagId IS NOT NULL AND LOWER(lp.redTagId) LIKE LOWER(CONCAT('%', :redTagId, '%')))
                   OR (:oldId IS NOT NULL AND LOWER(lp.oldId) LIKE LOWER(CONCAT('%', :oldId, '%')))
                   OR (:conflictStatus IS NOT NULL AND LOWER(lp.conflictStatus) LIKE LOWER(CONCAT('%', :conflictStatus, '%')))
                   OR (:conflictId IS NOT NULL AND LOWER(lp.conflictId) LIKE LOWER(CONCAT('%', :conflictId, '%')))
                OR (:isoPos IS NOT NULL AND lp.isoPos IS NOT NULL AND LOWER(lp.isoPos.name) LIKE LOWER(CONCAT('%', :isoPos, '%')))
                OR (:normPos IS NOT NULL AND lp.normPos IS NOT NULL AND LOWER(lp.normPos.name) LIKE LOWER(CONCAT('%', :normPos, '%')))
                 ))
            ORDER BY lp.description
            """)
        Page<String> findDistinctDescription(
            @Param("unit") String unit,
            @Param("tagged") String tagged,
            @Param("tagNumber") String tagNumber,
            @Param("description") String description,
            @Param("specificLocation") String specificLocation,
            @Param("standard") String standard,
            @Param("generalLocation") String generalLocation,
            @Param("equipment") String equipment,
            @Param("extraInfo") String extraInfo,
            @Param("type") String type,
            @Param("system") String system,
            @Param("normalPosition") String normalPosition,
            @Param("isolatedPosition") String isolatedPosition,
            @Param("fluid") String fluid,
            @Param("size") String size,
            @Param("electricalCheckStatus") String electricalCheckStatus,
            @Param("redTagId") String redTagId,
            @Param("oldId") String oldId,
            @Param("conflictStatus") String conflictStatus,
            @Param("conflictId") String conflictId,
            @Param("isoPos") String isoPos,
            @Param("normPos") String normPos,
            @Param("and") boolean andLogic,
            Pageable pageable
        );

    
        @Query("""
            SELECT DISTINCT lp.specificLocation
            FROM LotoPoint lp
            WHERE
              (:and = true AND
                 (:unit IS NULL OR LOWER(lp.unit) LIKE LOWER(CONCAT('%', :unit, '%')))
                 AND (:tagged IS NULL OR LOWER(lp.tagged) LIKE LOWER(CONCAT('%', :tagged, '%')))
                 AND (:tagNumber IS NULL OR LOWER(lp.tagNumber) LIKE LOWER(CONCAT('%', :tagNumber, '%')))
                 AND (:description IS NULL OR LOWER(lp.description) LIKE LOWER(CONCAT('%', :description, '%')))
                 AND (:specificLocation IS NULL OR LOWER(lp.specificLocation) LIKE LOWER(CONCAT('%', :specificLocation, '%')))
                 AND (:standard IS NULL OR LOWER(lp.standard) LIKE LOWER(CONCAT('%', :standard, '%')))
                 AND (:generalLocation IS NULL OR LOWER(lp.generalLocation) LIKE LOWER(CONCAT('%', :generalLocation, '%')))
                 AND (:equipment IS NULL OR LOWER(lp.equipment) LIKE LOWER(CONCAT('%', :equipment, '%')))
                 AND (:extraInfo IS NULL OR LOWER(lp.extraInfo) LIKE LOWER(CONCAT('%', :extraInfo, '%')))
                 AND (:type IS NULL OR LOWER(lp.type) LIKE LOWER(CONCAT('%', :type, '%')))
                 AND (:system IS NULL OR LOWER(lp.system) LIKE LOWER(CONCAT('%', :system, '%')))
                 AND (:normalPosition IS NULL OR LOWER(lp.normalPosition) LIKE LOWER(CONCAT('%', :normalPosition, '%')))
                 AND (:isolatedPosition IS NULL OR LOWER(lp.isolatedPosition) LIKE LOWER(CONCAT('%', :isolatedPosition, '%')))
                 AND (:fluid IS NULL OR LOWER(lp.fluid) LIKE LOWER(CONCAT('%', :fluid, '%')))
                 AND (:size IS NULL OR LOWER(lp.size) LIKE LOWER(CONCAT('%', :size, '%')))
                 AND (:electricalCheckStatus IS NULL OR LOWER(lp.electricalCheckStatus) LIKE LOWER(CONCAT('%', :electricalCheckStatus, '%')))
                 AND (:redTagId IS NULL OR LOWER(lp.redTagId) LIKE LOWER(CONCAT('%', :redTagId, '%')))
                 AND (:oldId IS NULL OR LOWER(lp.oldId) LIKE LOWER(CONCAT('%', :oldId, '%')))
                 AND (:conflictStatus IS NULL OR LOWER(lp.conflictStatus) LIKE LOWER(CONCAT('%', :conflictStatus, '%')))
                 AND (:conflictId IS NULL OR LOWER(lp.conflictId) LIKE LOWER(CONCAT('%', :conflictId, '%')))
                AND (:isoPos IS NULL OR (lp.isoPos IS NOT NULL AND LOWER(lp.isoPos.name) LIKE LOWER(CONCAT('%', :isoPos, '%'))))
                AND (:normPos IS NULL OR (lp.normPos IS NOT NULL AND LOWER(lp.normPos.name) LIKE LOWER(CONCAT('%', :normPos, '%'))))
                )
              OR
              (:and = false AND
                 (
                   (:unit IS NOT NULL AND LOWER(lp.unit) LIKE LOWER(CONCAT('%', :unit, '%')))
                   OR (:tagged IS NOT NULL AND LOWER(lp.tagged) LIKE LOWER(CONCAT('%', :tagged, '%')))
                   OR (:tagNumber IS NOT NULL AND LOWER(lp.tagNumber) LIKE LOWER(CONCAT('%', :tagNumber, '%')))
                   OR (:description IS NOT NULL AND LOWER(lp.description) LIKE LOWER(CONCAT('%', :description, '%')))
                   OR (:specificLocation IS NOT NULL AND LOWER(lp.specificLocation) LIKE LOWER(CONCAT('%', :specificLocation, '%')))
                   OR (:standard IS NOT NULL AND LOWER(lp.standard) LIKE LOWER(CONCAT('%', :standard, '%')))
                   OR (:generalLocation IS NOT NULL AND LOWER(lp.generalLocation) LIKE LOWER(CONCAT('%', :generalLocation, '%')))
                   OR (:equipment IS NOT NULL AND LOWER(lp.equipment) LIKE LOWER(CONCAT('%', :equipment, '%')))
                   OR (:extraInfo IS NOT NULL AND LOWER(lp.extraInfo) LIKE LOWER(CONCAT('%', :extraInfo, '%')))
                   OR (:type IS NOT NULL AND LOWER(lp.type) LIKE LOWER(CONCAT('%', :type, '%')))
                   OR (:system IS NOT NULL AND LOWER(lp.system) LIKE LOWER(CONCAT('%', :system, '%')))
                   OR (:normalPosition IS NOT NULL AND LOWER(lp.normalPosition) LIKE LOWER(CONCAT('%', :normalPosition, '%')))
                   OR (:isolatedPosition IS NOT NULL AND LOWER(lp.isolatedPosition) LIKE LOWER(CONCAT('%', :isolatedPosition, '%')))
                   OR (:fluid IS NOT NULL AND LOWER(lp.fluid) LIKE LOWER(CONCAT('%', :fluid, '%')))
                   OR (:size IS NOT NULL AND LOWER(lp.size) LIKE LOWER(CONCAT('%', :size, '%')))
                   OR (:electricalCheckStatus IS NOT NULL AND LOWER(lp.electricalCheckStatus) LIKE LOWER(CONCAT('%', :electricalCheckStatus, '%')))
                   OR (:redTagId IS NOT NULL AND LOWER(lp.redTagId) LIKE LOWER(CONCAT('%', :redTagId, '%')))
                   OR (:oldId IS NOT NULL AND LOWER(lp.oldId) LIKE LOWER(CONCAT('%', :oldId, '%')))
                   OR (:conflictStatus IS NOT NULL AND LOWER(lp.conflictStatus) LIKE LOWER(CONCAT('%', :conflictStatus, '%')))
                   OR (:conflictId IS NOT NULL AND LOWER(lp.conflictId) LIKE LOWER(CONCAT('%', :conflictId, '%')))
                OR (:isoPos IS NOT NULL AND lp.isoPos IS NOT NULL AND LOWER(lp.isoPos.name) LIKE LOWER(CONCAT('%', :isoPos, '%')))
                OR (:normPos IS NOT NULL AND lp.normPos IS NOT NULL AND LOWER(lp.normPos.name) LIKE LOWER(CONCAT('%', :normPos, '%')))
                 ))
            ORDER BY lp.specificLocation
            """)
        Page<String> findDistinctSpecificLocation(
            @Param("unit") String unit,
            @Param("tagged") String tagged,
            @Param("tagNumber") String tagNumber,
            @Param("description") String description,
            @Param("specificLocation") String specificLocation,
            @Param("standard") String standard,
            @Param("generalLocation") String generalLocation,
            @Param("equipment") String equipment,
            @Param("extraInfo") String extraInfo,
            @Param("type") String type,
            @Param("system") String system,
            @Param("normalPosition") String normalPosition,
            @Param("isolatedPosition") String isolatedPosition,
            @Param("fluid") String fluid,
            @Param("size") String size,
            @Param("electricalCheckStatus") String electricalCheckStatus,
            @Param("redTagId") String redTagId,
            @Param("oldId") String oldId,
            @Param("conflictStatus") String conflictStatus,
            @Param("conflictId") String conflictId,
            @Param("isoPos") String isoPos,
            @Param("normPos") String normPos,
            @Param("and") boolean andLogic,
            Pageable pageable
        );


}
