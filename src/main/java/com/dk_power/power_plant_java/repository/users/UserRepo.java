package com.dk_power.power_plant_java.repository.users;

import com.dk_power.power_plant_java.entities2.users.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;

public interface UserRepo extends JpaRepository<User,Long> {
    User findByEmail(String email);
}
