package com.dk_power.power_plant_java.repository.users;

import com.dk_power.power_plant_java.model.users.Role;
import com.dk_power.power_plant_java.model.users.User;
import org.springframework.data.repository.CrudRepository;

public interface RoleDto extends CrudRepository<Role,Long> {
}
