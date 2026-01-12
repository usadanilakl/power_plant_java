package com.dk_power.power_plant_java.sevice.angular.refactor_equipment;

import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.sevice.angular.NgEquipmentService;
import com.dk_power.power_plant_java.sevice.angular.file.NgFileService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class EquipmentRefactorService {
    private final NgEquipmentService equipmentService;
    private final NgFileService fileService;

    public List<Equipment> splitEquipmentWithMultipleLotoPoints(Long equipmentId) {
        Equipment sourceEquipment = equipmentService.findById(equipmentId)
                .orElseThrow(() -> new RuntimeException("Equipment not found with id: " + equipmentId));

        Set<LotoPoint> lotoPoints = sourceEquipment.getLotoPoints();

        // If equipment has 1 or fewer loto points, no splitting needed
        if (lotoPoints == null || lotoPoints.size() <= 1) {
            return List.of(sourceEquipment);
        }

        List<Equipment> splitEquipmentList = new ArrayList<>();
        List<LotoPoint> lotoPointList = new ArrayList<>(lotoPoints);


        // Keep the first loto point with the original equipment
        String lotoPointIds = lotoPointList.stream().map(l->l.getId()).toList().toString();
        LotoPoint firstLotoPoint = lotoPointList.get(0);
        sourceEquipment.setLotoPoints(new HashSet<>(List.of(firstLotoPoint)));
        sourceEquipment.setDescription(firstLotoPoint.getDescription());
        sourceEquipment.setTagNumber(firstLotoPoint.getTagNumber());
        sourceEquipment.setSeparationNote("Original LotoPoints: " + lotoPointIds);
        equipmentService.save(sourceEquipment);
        splitEquipmentList.add(sourceEquipment);

        // Parse original coordinates
        CoordinateInfo originalCoords = CoordinateParser.parse(sourceEquipment.getCoordinates());
        FileObject mainFile = sourceEquipment.getMainFile();

        // Get all existing equipment coordinates to avoid overlaps
        List<Equipment> allFileEquipment = mainFile.getPoints();
        List<CoordinateInfo> existingCoordinates = allFileEquipment.stream()
                .map(eq -> CoordinateParser.parse(eq.getCoordinates()))
                .collect(Collectors.toList());

        // Create new equipment for remaining loto points
        for (int i = 1; i < lotoPointList.size(); i++) {
            Equipment newEquipment = new Equipment();

            // Copy properties from source
            newEquipment.setSystem(sourceEquipment.getSystem());
            newEquipment.setLocation(sourceEquipment.getLocation());
            newEquipment.setVendor(sourceEquipment.getVendor());
            newEquipment.setEqType(sourceEquipment.getEqType());
            newEquipment.setSpecificLocation(sourceEquipment.getSpecificLocation());
            newEquipment.setMainFile(mainFile);
            newEquipment.setFiles(new ArrayList<>(sourceEquipment.getFiles()));
            newEquipment.setLotoPoints(new HashSet<>(List.of(lotoPointList.get(i))));

            // Copy tag number and description from loto point
            LotoPoint currentLotoPoint = lotoPointList.get(i);
            newEquipment.setTagNumber(currentLotoPoint.getTagNumber());
            newEquipment.setDescription(currentLotoPoint.getDescription());

            // Calculate new coordinates positioned to the right without overlap
            CoordinateInfo newCoords = CoordinatePositioner.calculateNextPosition(
                    originalCoords,
                    existingCoordinates,
                    i
            );
            newEquipment.setCoordinates(newCoords.toString());
            newEquipment.setOriginalPictureSize(sourceEquipment.getOriginalPictureSize());

            newEquipment.setSeparationNote("Original LotoPoints: " + lotoPointIds);

            Equipment savedEquipment = equipmentService.save(newEquipment);
            mainFile.addPoint(savedEquipment);
            existingCoordinates.add(newCoords);
            splitEquipmentList.add(savedEquipment);
        }

        System.out.println(mainFile.getName() + " - " + mainFile.getFileNumber());
        fileService.save(mainFile);
        return splitEquipmentList;
    }


    @Transactional
    public List<Equipment> splitAllEquipmentWithMultipleLotoPoints() {
        List<Equipment> allWithMultipleLotoPoints = equipmentService.getAllWithMultipleLotoPoints();
        List<Equipment> allSplitEquipment = new ArrayList<>();
        
        for (Equipment e : allWithMultipleLotoPoints) {
            try {
                List<Equipment> splitEquipment = splitEquipmentWithMultipleLotoPoints(e.getId());
                allSplitEquipment.addAll(splitEquipment);
                
                splitEquipment.forEach(eq -> {
                    System.out.println(eq.getTagNumber() + " - " + eq.getDescription() + " - " + eq.getCoordinates() + " - " + eq.getNote());
                });
            } catch (Exception ex) {
                System.err.println("Failed to split equipment ID " + e.getId() + ": " + ex.getMessage());
            }
        }
        
        return allSplitEquipment;
    }
    
        @Transactional
    public void assignEquipmentLocationAndTypeToLotoPoints() {
        List<Equipment> allEquipmentWithLotoPoints = equipmentService.getAllWithLotoPoints();
        int updatedCount = 0;
        
        for (Equipment equipment : allEquipmentWithLotoPoints) {
            Set<LotoPoint> lotoPoints = equipment.getLotoPoints();
            
            if (lotoPoints != null && !lotoPoints.isEmpty()) {
                for (LotoPoint lotoPoint : lotoPoints) {
                    if (equipment.getLocation() != null && lotoPoint.getLocation() == null) {
                        lotoPoint.setLocation(equipment.getLocation());
                    }
                    if (equipment.getEqType() != null && lotoPoint.getEqType() == null) {
                        lotoPoint.setEqType(equipment.getEqType());
                    }
                    if(equipment.getSystem() != null && lotoPoint.getSystemValue() == null){
                        lotoPoint.setSystemValue(equipment.getSystem());
                    }
                    if(equipment.getVendor() != null && lotoPoint.getVendor() == null){
                        lotoPoint.setVendor(equipment.getVendor());
                    }
                    updatedCount++;
                }
            }
        }
        
        System.out.println("Assigned location and eqType to " + updatedCount + " loto points");
    }
}
