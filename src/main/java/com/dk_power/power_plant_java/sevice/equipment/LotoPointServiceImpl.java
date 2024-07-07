package com.dk_power.power_plant_java.sevice.equipment;

import com.dk_power.power_plant_java.entities2.equipment.LotoPoint;
import com.dk_power.power_plant_java.repository.equipment.LotoPointRepo;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class LotoPointServiceImpl implements LotoPointService{
    private final LotoPointRepo lotoPointRepo;
    public LotoPoint saveEntity(LotoPoint entity){
        return lotoPointRepo.save(entity);
    }
}
