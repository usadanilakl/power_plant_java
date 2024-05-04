package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.PermitNumbers;
import com.dk_power.power_plant_java.enums.PermitTypes;
import org.springframework.data.repository.CrudRepository;

public interface PermitNumbersRepo extends CrudRepository<PermitNumbers, PermitTypes> {
}
