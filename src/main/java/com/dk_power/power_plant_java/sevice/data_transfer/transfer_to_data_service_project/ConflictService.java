package com.dk_power.power_plant_java.sevice.data_transfer.transfer_to_data_service_project;

import com.dk_power.power_plant_java.entities.Conflict;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.repository.ConflictRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ConflictService {
    private final ConflictRepo conflictRepo;

    public Conflict save(Conflict conflict) {
        Conflict conflict1 = checkIfConflictExists(conflict.getConflictType(), conflict.getEntityId());
        if (conflict1!=null) {
            System.out.println("Conflict with the same type and entity ID already exists. Changing status to OPEN.");
            conflict1.setStatus(Conflict.ConflictStatus.OPEN);
            return conflictRepo.save(conflict1);
        }
        conflict.setCreatedAt(LocalDateTime.now());
        conflict.setStatus(Conflict.ConflictStatus.OPEN);
        return conflictRepo.save(conflict);
    }

    public Conflict checkIfConflictExists(Conflict.ConflictType conflictType, String entityId) {
        Conflict byConflictTypeAndEntityIdContaining = conflictRepo.findByConflictTypeAndEntityIdContaining(conflictType, entityId);
        return byConflictTypeAndEntityIdContaining;
    }

    public void resolveConflict(Conflict.ConflictType conflictType, String equipmentId) {
        Conflict conflict = conflictRepo.findByConflictTypeAndEntityIdContaining(conflictType, equipmentId);
        if (conflict == null) {
            throw new IllegalStateException("No conflict found for the given type and entity ID");
        }
        // Resolve conflict logic goes here
        conflict.setStatus(Conflict.ConflictStatus.RESOLVED);
        conflict.setResolvedAt(LocalDateTime.now());
        conflictRepo.save(conflict);

    }




    public Conflict createFileNotFoundConflict(FileObject fileObject) {
        Conflict conflict = Conflict.builder()
                .entityId(fileObject.getId().toString())
                .conflictType(Conflict.ConflictType.file_not_found)
                .status(Conflict.ConflictStatus.OPEN)
                .build();
        return save(conflict);
    }

    Conflict createUnitMismatchConflict(LotoPoint u1Equipment, LotoPoint u2Equipment, String reason) {
        String description = reason + " between Unit 1 and Unit 2 equipment: ";
        String entityIds = "";

        if (u1Equipment != null) {
            description += "U1: " + u1Equipment.getTagNumber();
            entityIds += u1Equipment.getId();
        }

        if (u2Equipment != null) {
            description += (u1Equipment != null ? ", " : "") + "U2: " + u2Equipment.getTagNumber();
            entityIds += (u1Equipment != null ? "," : "") + u2Equipment.getId();
        }

        Conflict conflict = Conflict.builder()
                .conflictType(Conflict.ConflictType.unit_loto_point_mismatch)
                .description(description)
                .entityId(entityIds)
                .build();

        try {
            return save(conflict);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public Conflict createLpMissingEqConflict(LotoPoint lotoPoint) {
        Conflict conflict = Conflict.builder()
                .conflictType(Conflict.ConflictType.lp_missing_eq)
                .entityId(lotoPoint.getId().toString())
                .build();
        return save(conflict);
    }

    public Conflict createIncompleteLpConflict(LotoPoint lotoPoint) {
        Conflict conflict = Conflict.builder()
                .conflictType(Conflict.ConflictType.incomplete_lp)
                .entityId(lotoPoint.getId().toString())
                .build();
        return save(conflict);
    }

    public Conflict createCoordinatesMissmatchConflict(Equipment e) {
        Conflict conflict = Conflict.builder()
               .conflictType(Conflict.ConflictType.equipment_coordinates)
               .entityId(e.getId().toString())
               .description("Coordinates mismatch for equipment with tag number: " + e.getTagNumber())
               .build();
        return save(conflict);
    }
}
