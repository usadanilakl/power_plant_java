package com.dk_power.power_plant_java.sevice.data_transfer.transfer_to_data_service_project;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.entities.Conflict;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.repository.ConflictRepo;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import com.fasterxml.jackson.core.io.schubfach.FloatToDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConflictService {
    private final ConflictRepo conflictRepo;
    private final EquipmentService equipmentService;
    private final LotoPointService lotoPointService;

    public Conflict save(Conflict conflict) {
        Conflict conflict1 = checkIfConflictExists(conflict.getConflictType(), conflict.getEntityId());
        if (conflict1 != null) {
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

    public Map<String, List<EquipmentDto>> getConflictedPointsById(String id) {
        Set<Conflict> allConflicts = new HashSet<>();
        Set<String> allConflictIds = new HashSet<>();
        Equipment entityById = equipmentService.getEntityById(id);
        if (entityById == null) {
            throw new IllegalStateException("No equipment found with the given ID");
        }
        if (entityById.getConflictId() != null)
            allConflictIds.addAll(Arrays.asList(entityById.getConflictId().split(",")));
        entityById.getLotoPoints()
                .stream()
                .filter(lp -> lp.getConflictId() != null)
                .forEach(lotoPoint -> allConflictIds.addAll(Arrays.asList(lotoPoint.getConflictId().split(","))));

        for (String conflictId : allConflictIds) {
            allConflicts.add(conflictRepo.findById(Long.parseLong(conflictId)).get());
        }

        return allConflicts.stream()
                .flatMap(conflict -> Arrays.stream(conflict.getEntityId().split(","))
                        .map(equipmentService::getEntityById)
                        .filter(Objects::nonNull)
                        .map(equipmentService::convertToDto)
                        .map(dto -> new AbstractMap.SimpleEntry<>(conflict.getConflictType().toString(), dto)))
                .collect(Collectors.groupingBy(
                        Map.Entry::getKey,
                        Collectors.mapping(Map.Entry::getValue, Collectors.toList())
                ));
    }


    public Conflict createFileNotFoundConflict(FileObject fileObject) {
        Conflict conflict = Conflict.builder()
                .entityId(fileObject.getId().toString())
                .conflictType(Conflict.ConflictType.file_not_found)
                .entityType(fileObject.getObjectType())
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
                .entityType(u1Equipment.getObjectType())
                .entityId(entityIds)
                .build();

        try {
            Conflict saved = save(conflict);
            u1Equipment.addConflictId(saved.getId());
            u2Equipment.addConflictId(saved.getId());
            lotoPointService.save(u1Equipment);
            lotoPointService.save(u2Equipment);
            return saved;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public Conflict createLpMissingEqConflict(LotoPoint lotoPoint) {
        Conflict conflict = Conflict.builder()
                .conflictType(Conflict.ConflictType.lp_missing_eq)
                .entityId(lotoPoint.getId().toString())
                .entityType(lotoPoint.getObjectType())
                .build();
        Conflict saved = save(conflict);
        lotoPoint.addConflictId(saved.getId());
        lotoPointService.save(lotoPoint);
        return saved;
    }

    public Conflict createIncompleteLpConflict(LotoPoint lotoPoint) {
        Conflict conflict = Conflict.builder()
                .conflictType(Conflict.ConflictType.incomplete_lp)
                .entityId(lotoPoint.getId().toString())
                .entityType(lotoPoint.getObjectType())
                .build();
        Conflict saved = save(conflict);
        lotoPoint.addConflictId(saved.getId());
        lotoPointService.save(lotoPoint);
        return saved;
    }

    public Conflict createCoordinatesMissmatchConflict(Equipment e) {
        Conflict conflict = Conflict.builder()
                .conflictType(Conflict.ConflictType.equipment_coordinates)
                .entityId(e.getId().toString())
                .entityType(e.getObjectType())
                .status(Conflict.ConflictStatus.OPEN)
                .description("Coordinates mismatch for equipment with tag number: " + e.getTagNumber())
                .build();
        return save(conflict);
    }


}
