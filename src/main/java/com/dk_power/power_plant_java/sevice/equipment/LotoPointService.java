package com.dk_power.power_plant_java.sevice.equipment;

import com.dk_power.power_plant_java.entities2.equipment.LotoPoint;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;


public interface LotoPointService {
    LotoPoint saveEntity(LotoPoint entity);
}
