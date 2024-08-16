package com.dk_power.power_plant_java.repository.users;

import com.dk_power.power_plant_java.entities.users.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepo extends JpaRepository<User,Long> {
    User findByEmail(String email);
}
