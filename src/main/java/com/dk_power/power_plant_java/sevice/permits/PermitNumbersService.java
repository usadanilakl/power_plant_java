package com.dk_power.power_plant_java.sevice.permits;


import com.dk_power.power_plant_java.entities.permits.PermitNumbers;
import com.dk_power.power_plant_java.enums.PermitType;

public interface PermitNumbersService {
    Long getNumber(PermitType type);
    Long generate(Long lastCreatedNumber);
    PermitNumbers saveNumber(PermitNumbers num);
}
