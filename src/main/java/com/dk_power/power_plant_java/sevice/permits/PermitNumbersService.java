package com.dk_power.power_plant_java.sevice.permits;

import com.dk_power.power_plant_java.entities.permits.PermitNumbers;
import com.dk_power.power_plant_java.enums.PermitTypes;

import java.time.LocalDateTime;

public interface PermitNumbersService {
    Long getNumber(PermitTypes type);
    Long generate(Long lastCreatedNumber);
    PermitNumbers saveNumber(PermitNumbers num);
}
