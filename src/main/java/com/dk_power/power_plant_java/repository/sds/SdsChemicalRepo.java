package com.dk_power.power_plant_java.repository.sds;

import com.dk_power.power_plant_java.entities.sds.SdsChemical;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface SdsChemicalRepo extends BaseRepository<SdsChemical> {
    Optional<SdsChemical> findFirstBySharepointIdOrderByIdAsc(String sharepointId);
    Optional<SdsChemical> findFirstByLocalUuidOrderByIdAsc(String localUuid);
    Optional<SdsChemical> findFirstBySourceIdOrderByIdAsc(String sourceId);
    /** All chemicals sharing a sourceId — used by Sync PDFs to detect and refuse ambiguous matches. */
    List<SdsChemical> findAllBySourceId(String sourceId);

    /** Preflight for Sync PDFs: rows sharing a sharepointId are a data-integrity break — if two
     *  chemicals both write to the same SP folder they'd delete each other's attachments. Native
     *  SQL because we need to see rows even with the @Where soft-delete guard. */
    @Query(value = "SELECT sharepoint_id FROM sds_chemical WHERE sharepoint_id IS NOT NULL AND sharepoint_id <> '' AND (deleted IS NULL OR deleted = FALSE) GROUP BY sharepoint_id HAVING COUNT(*) > 1",
            nativeQuery = true)
    List<String> findDuplicateSharepointIds();
    List<SdsChemical> findByStatus_NameIgnoreCase(String statusName);
    List<SdsChemical> findByStatus_NameIn(List<String> statusNames);
    boolean existsBySharepointId(String sharepointId);

    @Query("select max(s.bookNumber) from SdsChemical s")
    Integer findMaxBookNumber();

    @Query("select max(s.sectionNumber) from SdsChemical s where s.bookNumber = :book")
    Integer findMaxSectionInBook(@Param("book") int book);

    /** Chemicals not yet pushed to SharePoint (status join-fetched to avoid lazy-init in the outbound sweep). */
    @Query("select s from SdsChemical s left join fetch s.status where s.sharepointId is null")
    List<SdsChemical> findUnsyncedWithStatus();

    /** Already-on-SharePoint chemicals (status join-fetched) — outbound update sweep diffs these vs the SP snapshot. */
    @Query("select s from SdsChemical s left join fetch s.status where s.sharepointId is not null")
    List<SdsChemical> findSyncedWithStatus();

    /**
     * Soft-deleted chemicals that still have a SharePoint row to clean up. Native query so it bypasses
     * the {@code @Where(deleted IS NOT TRUE)} clause that hides deleted rows from every JPQL query.
     */
    @Query(value = "SELECT * FROM sds_chemical WHERE deleted = TRUE AND sharepoint_id IS NOT NULL", nativeQuery = true)
    List<SdsChemical> findDeletedWithSharepointId();

    /** Clear the SP id after deleting the SP row, so the delete sweep won't retry. Native to reach a deleted row. */
    @Transactional
    @Modifying
    @Query(value = "UPDATE sds_chemical SET sharepoint_id = NULL WHERE id = :id", nativeQuery = true)
    void clearSharepointId(@Param("id") Long id);
}
