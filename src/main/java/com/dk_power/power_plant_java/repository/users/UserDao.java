package com.dk_power.power_plant_java.repository.users;

import com.dk_power.power_plant_java.model.users.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;

public interface UserDao extends CrudRepository<User,Long> {
    User findByEmail(String email);
}
