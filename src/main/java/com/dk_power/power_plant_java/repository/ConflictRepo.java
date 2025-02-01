package com.dk_power.power_plant_java.repository;

import com.dk_power.power_plant_java.entities.Conflict;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConflictRepo extends JpaRepository<Conflict,Long> {
    List<Conflict> findAllByConflictType(String type);

    List<Conflict> findByConflictTypeAndDescriptionContaining(Conflict.ConflictType conflictType, String descriptionPart);

    Conflict findByConflictTypeAndEntityIdContaining(Conflict.ConflictType conflictType, String id);

    List<Conflict> findByConflictType(Conflict.ConflictType conflictType);

    List<Conflict> findByConflictTypeAndStatus(Conflict.ConflictType conflictType, Conflict.ConflictStatus conflictStatus);

    List<Conflict> findByConflictTypeAndDescriptionContainingAndStatus(Conflict.ConflictType conflictType, String loto, Conflict.ConflictStatus conflictStatus);

    Conflict findByConflictTypeAndEntityId(Conflict.ConflictType conflictType, String eqId);
}
