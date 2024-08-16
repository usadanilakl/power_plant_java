package com.dk_power.power_plant_java.repository.users;

import com.dk_power.power_plant_java.entities.users.Role;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepo extends JpaRepository<Role,Long> {
}
