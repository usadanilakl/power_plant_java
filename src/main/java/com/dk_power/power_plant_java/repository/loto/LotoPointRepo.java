package com.dk_power.power_plant_java.repository.loto;

import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDtoLight;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface LotoPointRepo extends BaseRepository<LotoPoint> {
    List<LotoPoint> findByModelFile_Id(Long fileId);
    List<LotoPoint> findByDescriptionContaining(String tag);
    List<LotoPoint> findByDescriptionContainingAndDescriptionContaining(String one, String two);

    LotoPoint findByOldId(String oldId);

    List<LotoPoint> findByNormPos(Value oldVal);

    List<LotoPoint> findByIsoPos(Value oldVal);

    List<LotoPoint> findByTagNumber(String tag);

    /** LOTO points bound to a PhysicalObject (informational binder soft-FK). */
    List<LotoPoint> findByPhysicalObjectId(Long physicalObjectId);

    /**
     * Case-insensitive active-only lookup used by the QR resolver. Ordered by
     * id ascending so callers get deterministic multi-match results (a tag
     * with no uniqueness constraint can yield multiple hits).
     */
    @Query("SELECT lp FROM LotoPoint lp WHERE UPPER(lp.tagNumber) = UPPER(:tagNumber) AND (lp.deleted IS NULL OR lp.deleted = false) ORDER BY lp.id ASC")
    List<LotoPoint> findAllActiveByTagNumberIgnoreCase(@Param("tagNumber") String tagNumber);

    @Query("SELECT lp FROM LotoPoint lp WHERE UPPER(lp.tagNumber) IN :tagNumbers")
    List<LotoPoint> findByTagNumberUpperIn(@Param("tagNumbers") Collection<String> tagNumbers);

    @Query("SELECT new com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDtoLight(e.id,e.unit,e.tagged,e.tagNumber,e.description,e.specificLocation,e.normalPosition, e.isolatedPosition,e.oldId,e.objectType)FROM LotoPoint e")
    List<LotoPointDtoLight> getAllLight();

    List<LotoPoint> findByEquipmentListNotNull();

    List<LotoPoint> findByEquipmentListNotNullAndIsUpdatedNull();

    List<LotoPoint> findBySpecificLocationContaining(String tagNumber);

    List<LotoPoint> findByTagNumberContaining(String tagNumber);

    List<LotoPoint> findByIsProcessed(boolean isProcessed);

    List<LotoPoint> findByDataServiceItemIdIsNull();

    List<LotoPoint> findByDataServiceItemId(UUID dataServiceItemId);

    // ── PWA walkdown-pile queries (all filtering at the DB, no LazyInit, single round-trip) ──

    /**
     * Distinct non-blank system values across every active LOTO point — feeds the PWA "by system"
     * picker. DB-side DISTINCT is a full table scan on a small column so it stays sub-second even
     * on 10k+ points; the in-memory equivalent iterated {@code getAllDtos()} and took 20+s.
     */
    @Query("SELECT DISTINCT lp.system FROM LotoPoint lp " +
           "WHERE lp.system IS NOT NULL AND lp.system <> '' " +
           "AND (lp.deleted IS NULL OR lp.deleted = false) " +
           "ORDER BY lp.system")
    List<String> findDistinctSystems();

    /** Distinct non-blank unit values (same reasoning as {@link #findDistinctSystems}). */
    @Query("SELECT DISTINCT lp.unit FROM LotoPoint lp " +
           "WHERE lp.unit IS NOT NULL AND lp.unit <> '' " +
           "AND (lp.deleted IS NULL OR lp.deleted = false) " +
           "ORDER BY lp.unit")
    List<String> findDistinctUnits();

    /**
     * Union of all points on the given standards, with the FK relations eagerly loaded so a caller
     * outside a Hibernate session can safely serialize them. Replaces the previous
     * {@code standardRepo.findAllById(...).forEach(s -> s.getLotoPoints())} pattern which threw
     * LazyInitializationException because {@code LotoStandard.lotoPoints} is @ManyToMany LAZY.
     */
    @Query("SELECT DISTINCT lp FROM LotoStandard s JOIN s.lotoPoints lp " +
           "LEFT JOIN FETCH lp.isoPos LEFT JOIN FETCH lp.normPos " +
           "LEFT JOIN FETCH lp.location LEFT JOIN FETCH lp.eqType " +
           "WHERE s.id IN :standardIds " +
           "AND (s.deleted IS NULL OR s.deleted = false) " +
           "AND (lp.deleted IS NULL OR lp.deleted = false)")
    List<LotoPoint> findPointsOnStandards(@Param("standardIds") Collection<Long> standardIds);

    /**
     * Filtered active LOTO points for the PWA walkdown pile. Every list/scalar param is optional:
     * null (scalar) or empty (list) means "no restriction on this facet". Location/eqType/system
     * accept multiple values with OR semantics (JPQL IN). Text params do case-insensitive
     * contains-match. Eager-fetches the relations the mobile dialog reads.
     *
     * <p>The empty-list guard uses a size sentinel because JPQL treats an empty {@code IN ()} as
     * a syntax error: callers pass a placeholder single-value list AND a flag telling the query
     * to skip that filter. See {@code hasLocationIds}/{@code hasEqTypeIds}/{@code hasSystems}.
     */
    @Query("SELECT DISTINCT lp FROM LotoPoint lp " +
           "LEFT JOIN FETCH lp.isoPos LEFT JOIN FETCH lp.normPos " +
           "LEFT JOIN FETCH lp.location LEFT JOIN FETCH lp.eqType " +
           "WHERE (lp.deleted IS NULL OR lp.deleted = false) " +
           "  AND (:hasLocationIds = false OR (lp.location IS NOT NULL AND lp.location.id IN :locationIds)) " +
           "  AND (:hasEqTypeIds = false OR (lp.eqType IS NOT NULL AND lp.eqType.id IN :eqTypeIds)) " +
           "  AND (:hasSystems = false OR (lp.system IS NOT NULL AND LOWER(lp.system) IN :systems)) " +
           "  AND (:isoPosId IS NULL OR (lp.isoPos IS NOT NULL AND lp.isoPos.id = :isoPosId)) " +
           "  AND (:normPosId IS NULL OR (lp.normPos IS NOT NULL AND lp.normPos.id = :normPosId)) " +
           "  AND (:unit IS NULL OR LOWER(lp.unit) = :unit) " +
           "  AND (:tagNumber IS NULL OR LOWER(lp.tagNumber) LIKE CONCAT('%', :tagNumber, '%')) " +
           "  AND (:description IS NULL OR LOWER(lp.description) LIKE CONCAT('%', :description, '%')) " +
           "  AND (:specificLocation IS NULL OR LOWER(lp.specificLocation) LIKE CONCAT('%', :specificLocation, '%'))")
    List<LotoPoint> findPointsForPile(
            @Param("hasLocationIds") boolean hasLocationIds,
            @Param("locationIds") Collection<Long> locationIds,
            @Param("hasEqTypeIds") boolean hasEqTypeIds,
            @Param("eqTypeIds") Collection<Long> eqTypeIds,
            @Param("hasSystems") boolean hasSystems,
            @Param("systems") Collection<String> systems,
            @Param("isoPosId") Long isoPosId,
            @Param("normPosId") Long normPosId,
            @Param("unit") String unit,
            @Param("tagNumber") String tagNumber,
            @Param("description") String description,
            @Param("specificLocation") String specificLocation);


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

    // Count methods for Value dependency checking
    @Query("SELECT COUNT(lp) FROM LotoPoint lp WHERE lp.isoPos.id = :valueId")
    long countByIsoPosId(@org.springframework.data.repository.query.Param("valueId") Long valueId);

    @Query("SELECT COUNT(lp) FROM LotoPoint lp WHERE lp.normPos.id = :valueId")
    long countByNormPosId(@org.springframework.data.repository.query.Param("valueId") Long valueId);

    @Query("SELECT COUNT(lp) FROM LotoPoint lp WHERE lp.location.id = :valueId")
    long countByLocationId(@org.springframework.data.repository.query.Param("valueId") Long valueId);

    @Query("SELECT COUNT(lp) FROM LotoPoint lp WHERE lp.eqType.id = :valueId")
    long countByEqTypeId(@org.springframework.data.repository.query.Param("valueId") Long valueId);

    @Query("SELECT DISTINCT lp FROM LotoPoint lp " +
           "LEFT JOIN FETCH lp.equipmentList " +
           "LEFT JOIN FETCH lp.location " +
           "LEFT JOIN FETCH lp.eqType " +
           "LEFT JOIN FETCH lp.isoPos " +
           "LEFT JOIN FETCH lp.normPos " +
           "LEFT JOIN FETCH lp.zeroEnergy ze " +
           "LEFT JOIN FETCH ze.zeroEnergyTemplate " +
           "WHERE lp.id = :id")
    LotoPoint findByIdWithEquipment(@Param("id") Long id);

    /**
     * Counts how many LOTO points use a specific ZeroEnergy.
     * Used for usage statistics and before deleting orphaned ZeroEnergy items.
     *
     * @param zeroEnergyId The ZeroEnergy ID
     * @return Count of LOTO points using this ZeroEnergy
     */
    @Query("SELECT COUNT(lp) FROM LotoPoint lp WHERE lp.zeroEnergy.id = :zeroEnergyId")
    long countByZeroEnergyId(@Param("zeroEnergyId") Long zeroEnergyId);

    /**
     * Reassigns all LOTO points from one ZeroEnergy to another.
     * Used when merging ZeroEnergy items.
     *
     * @param sourceId The source ZeroEnergy ID to reassign from
     * @param targetId The target ZeroEnergy ID to reassign to
     * @return Number of LOTO points reassigned
     */
    @Modifying
    @Query("UPDATE LotoPoint lp SET lp.zeroEnergy.id = :targetId WHERE lp.zeroEnergy.id = :sourceId")
    int reassignZeroEnergy(@Param("sourceId") Long sourceId, @Param("targetId") Long targetId);

    // ── Conflict detection queries ──

    /**
     * Find LOTO points with no equipment connections.
     */
    @Query("SELECT lp FROM LotoPoint lp WHERE lp.equipmentList IS EMPTY")
    List<LotoPoint> findWithEmptyEquipment();

    @Query("SELECT COUNT(lp) FROM LotoPoint lp WHERE lp.equipmentList IS EMPTY")
    long countWithEmptyEquipment();

    /**
     * Find LOTO points with no zero energy.
     */
    List<LotoPoint> findByZeroEnergyIsNull();

    @Query("SELECT COUNT(lp) FROM LotoPoint lp WHERE lp.zeroEnergy IS NULL")
    long countByZeroEnergyIsNull();

    /**
     * Find LOTO points with no characteristics.
     */
    @Query("SELECT lp FROM LotoPoint lp WHERE lp.characteristicsJson IS NULL OR lp.characteristicsJson = '' OR lp.characteristicsJson = '[]'")
    List<LotoPoint> findWithEmptyCharacteristics();

    @Query("SELECT COUNT(lp) FROM LotoPoint lp WHERE lp.characteristicsJson IS NULL OR lp.characteristicsJson = '' OR lp.characteristicsJson = '[]'")
    long countWithEmptyCharacteristics();

    /**
     * Find unit-specific LOTO points (tag starts with 01 or 02) with no counterpart linked.
     */
    @Query("SELECT lp FROM LotoPoint lp WHERE (lp.tagNumber LIKE '01%' OR lp.tagNumber LIKE '02%') AND lp.counterpartId IS NULL")
    List<LotoPoint> findMissingCounterparts();

    @Query("SELECT COUNT(lp) FROM LotoPoint lp WHERE (lp.tagNumber LIKE '01%' OR lp.tagNumber LIKE '02%') AND lp.counterpartId IS NULL")
    long countMissingCounterparts();

    /**
     * Find all LOTO points with non-null tag numbers for duplicate detection.
     * Returns id and tagNumber only for efficiency.
     */
    @Query("SELECT lp FROM LotoPoint lp WHERE lp.tagNumber IS NOT NULL AND lp.tagNumber <> ''")
    List<LotoPoint> findAllWithTagNumber();

    // ── Paginated conflict queries ──

    @Query("SELECT lp FROM LotoPoint lp WHERE lp.equipmentList IS EMPTY")
    Page<LotoPoint> findWithEmptyEquipment(Pageable pageable);

    @Query("SELECT lp FROM LotoPoint lp WHERE lp.zeroEnergy IS NULL")
    Page<LotoPoint> findByZeroEnergyIsNull(Pageable pageable);

    @Query("SELECT lp FROM LotoPoint lp WHERE lp.characteristicsJson IS NULL OR lp.characteristicsJson = '' OR lp.characteristicsJson = '[]'")
    Page<LotoPoint> findWithEmptyCharacteristics(Pageable pageable);

    @Query("SELECT lp FROM LotoPoint lp WHERE (lp.tagNumber LIKE '01%' OR lp.tagNumber LIKE '02%') AND lp.counterpartId IS NULL")
    Page<LotoPoint> findMissingCounterparts(Pageable pageable);

}
