package com.dk_power.power_plant_java.repository.esp;

import com.dk_power.power_plant_java.entities.esp.WledCommand;
import com.dk_power.power_plant_java.enums.WledCommandStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface WledCommandRepo extends JpaRepository<WledCommand, Long> {

    @Query("SELECT c FROM WledCommand c WHERE c.commandStatus IN :statuses AND c.nextRetryAt <= :now ORDER BY c.createdAt ASC")
    List<WledCommand> findDueCommands(@Param("statuses") List<WledCommandStatus> statuses, @Param("now") LocalDateTime now);

    /**
     * Dedup guard for enqueue. Returns true if there's already an unresolved
     * refresh command (PENDING or transiently FAILED with backoff pending) for
     * this ESP — in which case a new box change doesn't need to enqueue another,
     * the existing one will pick up the fresh DB state when the leader processes it.
     */
    @Query("SELECT COUNT(c) > 0 FROM WledCommand c WHERE c.espDeviceId = :espDeviceId AND c.commandStatus IN :statuses")
    boolean existsForEspInStatuses(@Param("espDeviceId") Long espDeviceId, @Param("statuses") List<WledCommandStatus> statuses);

    long countByCommandStatus(WledCommandStatus status);

    void deleteByCommandStatus(WledCommandStatus status);
}
