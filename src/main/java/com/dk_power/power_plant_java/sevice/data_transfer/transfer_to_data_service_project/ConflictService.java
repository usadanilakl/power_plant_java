package com.dk_power.power_plant_java.sevice.data_transfer.transfer_to_data_service_project;

import com.dk_power.power_plant_java.entities.Conflict;
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
        if (checkIfConflictExists(conflict.getConflictType(), conflict.getEntityId())) {
            System.out.println("Conflict with the same type and entity ID already exists. Skipping.");
            return null;
        }
        return conflictRepo.save(conflict);
    }

    public boolean checkIfConflictExists(Conflict.ConflictType conflictType, String entityId) {
        Conflict byConflictTypeAndEntityIdContaining = conflictRepo.findByConflictTypeAndEntityIdContaining(conflictType, entityId);
        return byConflictTypeAndEntityIdContaining != null;
    }

    public void resolveConflict(Conflict.ConflictType conflictType, String equipmentId) {
        Conflict conflict = conflictRepo.findByConflictTypeAndEntityIdContaining(conflictType, equipmentId);
        if (conflict == null) {
            throw new IllegalStateException("No conflict found for the given type and entity ID");
        }
        // Resolve conflict logic goes here
        conflict.setStatus(Conflict.ConflictStatus.RESOLVED);
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

    Conflict createMismatchConflict(LotoPoint u1Equipment, LotoPoint u2Equipment, String reason) {
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
                .createdAt(LocalDateTime.now())
                .entityId(entityIds)
                .status(Conflict.ConflictStatus.OPEN)
                .build();

        try {
            return save(conflict);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
