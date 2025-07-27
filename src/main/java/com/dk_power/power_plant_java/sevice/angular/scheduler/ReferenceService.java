package com.dk_power.power_plant_java.sevice.angular.scheduler;

import com.dk_power.power_plant_java.entities.Referenceable;
import com.dk_power.power_plant_java.repository.FileRepo;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReferenceService {
    private final FileRepo fileRepository;
    private final EquipmentRepo equipmentRepository;
    private final ValueRepo valueRepository;
    private final LotoPointRepo lotoPointRepository;
    
    public Referenceable loadReference(String type, Long id) {
        switch(type) {
            case "FileObject":
                return fileRepository.findById(id).orElse(null);
            case "Equipment":
                return equipmentRepository.findById(id).orElse(null);
            case "LotoPoint":
                return lotoPointRepository.findById(id).orElse(null);
            case "Value":
                return valueRepository.findById(id).orElse(null);
            default:
                return null;
        }
    }
}