package com.dk_power.power_plant_java.repository.users;

import com.dk_power.power_plant_java.entities.users.Role;
import org.springframework.data.repository.CrudRepository;

public interface RoleRepo extends CrudRepository<Role,Long> {
}
