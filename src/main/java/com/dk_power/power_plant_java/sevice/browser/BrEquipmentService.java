package com.dk_power.power_plant_java.sevice.browser;

import com.dk_power.power_plant_java.dto.browser.BrEquipmentDto;
import com.dk_power.power_plant_java.mappers.browser.BrEquipmentMapper;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BrEquipmentService {
    private final EquipmentRepo equipmentRepo;;
    private final BrEquipmentMapper brEquipmentMapper;

    public List<BrEquipmentDto> getAllBrEquipment() {
        return brEquipmentMapper.toDtoAll(equipmentRepo.findAll());
    }
}
