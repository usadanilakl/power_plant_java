package com.dk_power.power_plant_java.repository.loto;


import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import com.dk_power.power_plant_java.repository.base_repositories.PermitRepo;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface LotoRepo extends PermitRepo<Loto> {
    Optional<Loto> findFirstBySharepointIdOrderByIdAsc(String sharepointId);
    @Query("SELECT u FROM Loto u WHERE u.docNum IS NULL AND u.createdBy = ?1")
    Loto getLoto(String currentUserName);
    @Query("SELECT MAX(e.docNum) FROM Loto e")
//    @Override
    Long findMaxPermitNum();
    List<Loto> findByCreatedBy(String name);
    @Query("SELECT u FROM Loto u WHERE u.docNum IS NULL AND u.createdBy = ?1")
    Loto getTempPermit(String currentUserName);

    Optional<Loto> findByName(String name);

    @Query("SELECT l FROM Loto l WHERE l.boxNumber IS NOT NULL AND l.lotoBox IS NULL AND l.deleted = false")
    List<Loto> findUnlinkedLotosWithBoxNumber();

    @Query("SELECT l FROM Loto l WHERE l.boxNumber IS NOT NULL AND l.deleted = false " +
           "AND (l.permitStatus IS NULL OR l.permitStatus.name IN ('Building', 'Active', 'Test'))")
    List<Loto> findActiveWithBox();

    /**
     * All (undeleted) permits that were spawned from the given standard. Used
     * by the standard-delete flow to unlink the {@code sourceStandard} FK on
     * every historical permit before the standard is soft-deleted, so the
     * permits survive with a null source rather than an orphan pointer.
     */
    List<Loto> findBySourceStandard_Id(Long sourceStandardId);

    /** Not-closed permits (Building/Active/Test, or null status), for the WO→LOTO picker. */
    @Query("SELECT l FROM Loto l WHERE l.deleted = false " +
           "AND (l.permitStatus IS NULL OR l.permitStatus.name IN ('Building', 'Active', 'Test'))")
    List<Loto> findActiveNotClosed();

    /** Prefilter for "LOTOs linked to this WO": a substring match on the comma-joined list. Case-sensitive (Maximo
     *  wonums are uppercase); the caller confirms each hit with {@code Loto.isLinkedTo(wonum)} (case-insensitive,
     *  delimiter-safe) to avoid partial-number false positives. */
    @Query("SELECT l FROM Loto l WHERE l.deleted = false AND l.linkedWonums LIKE concat('%', ?1, '%')")
    List<Loto> findByLinkedWonumLike(String wonum);
}
